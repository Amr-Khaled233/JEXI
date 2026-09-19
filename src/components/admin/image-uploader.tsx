"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

async function upload(files: FileList): Promise<string[]> {
  for (const f of Array.from(files)) {
    if (!ACCEPTED.includes(f.type)) throw new Error(`${f.name}: unsupported image type`);
    if (f.size > MAX_BYTES) throw new Error(`${f.name}: images must be 8 MB or smaller`);
  }

  // Vercel Blob: upload directly from the browser using a token from our API.
  if (process.env.NEXT_PUBLIC_BLOB_UPLOADS) {
    const { upload: blobUpload } = await import("@vercel/blob/client");
    const results = await Promise.all(
      Array.from(files).map((f) => {
        const safeName = f.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").slice(-60);
        return blobUpload(`jexi/products/${safeName}`, f, { access: "public", handleUploadUrl: "/api/admin/upload/blob", contentType: f.type });
      }),
    );
    return results.map((r) => r.url);
  }

  // Local development: saved to UPLOAD_DIR by our API.
  const body = new FormData();
  for (const f of Array.from(files)) body.append("files", f);
  const res = await fetch("/api/admin/upload", { method: "POST", body });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  return data.urls;
}

/** Multi-image gallery editor. The first image is the cover. */
export function ImageUploader({ value, onChange, max = 10, hint }: { value: string[]; onChange: (v: string[]) => void; max?: number; hint?: React.ReactNode }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const move = (i: number, dir: -1 | 1) => {
    const next = [...value];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };

  return (
    <div>
      <div className={cn("grid gap-3", max === 1 ? "grid-cols-1" : "grid-cols-3 sm:grid-cols-5")}>
        {value.map((src, i) => (
          <div key={src + i} className="group relative aspect-4/5 overflow-hidden rounded-[3px] bg-surface-2 ring-1 ring-border">
            <Image src={src} alt="" fill sizes="160px" className="object-cover" />
            {i === 0 && <span className="absolute top-1.5 left-1.5 rounded-full bg-gold px-2 py-0.5 text-[0.55rem] tracking-wider text-on-gold uppercase">Cover</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/55 p-1 text-white opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="p-1 disabled:opacity-30" aria-label="Move left">
                <ChevronLeft className="size-4" />
              </button>
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="p-1 hover:text-red-300" aria-label="Remove image">
                <X className="size-4" />
              </button>
              <button type="button" disabled={i === value.length - 1} onClick={() => move(i, 1)} className="p-1 disabled:opacity-30" aria-label="Move right">
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        ))}
        {value.length < max && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="flex aspect-4/5 flex-col items-center justify-center gap-2 rounded-[3px] border border-dashed border-border text-xs text-muted transition hover:border-gold hover:text-gold"
          >
            {busy ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" strokeWidth={1.5} />}
            {busy ? "Uploading…" : max === 1 ? "Add image" : "Add images"}
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        multiple={max > 1}
        hidden
        onChange={async (e) => {
          if (!e.target.files?.length) return;
          setBusy(true);
          setError(null);
          try {
            const urls = await upload(e.target.files);
            onChange([...value, ...urls].slice(0, max));
          } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
          } finally {
            setBusy(false);
            e.target.value = "";
          }
        }}
      />
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      <p className="mt-3 text-xs leading-relaxed text-muted">{hint ?? "JPG, PNG, WebP or AVIF, up to 8 MB."}</p>
    </div>
  );
}

/** Single image picker that also writes its value into a hidden input (for plain <form> actions). */
export function SingleImageField({ name, defaultValue, className, hint }: { name: string; defaultValue?: string | null; className?: string; hint?: React.ReactNode }) {
  const [value, setValue] = useState(defaultValue ? [defaultValue] : []);
  return (
    <div className={cn("max-w-40", className)}>
      <input type="hidden" name={name} value={value[0] ?? ""} />
      <ImageUploader value={value} onChange={setValue} max={1} hint={hint} />
    </div>
  );
}
