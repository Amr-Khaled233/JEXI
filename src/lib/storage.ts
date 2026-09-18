// Image storage.
// - Production (Vercel): when BLOB_READ_WRITE_TOKEN is set, the admin's browser uploads
//   straight to Vercel Blob via src/app/api/admin/upload/blob/route.ts — this file isn't used.
// - Local development: images are written to UPLOAD_DIR (default ./uploads) by
//   src/app/api/admin/upload/route.ts and served by src/app/uploads/[...path]/route.ts.
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

function matchesSignature(b: Buffer, type: string): boolean {
  const ascii = (start: number, end: number) => b.subarray(start, end).toString("latin1");
  switch (type) {
    case "image/jpeg":
      return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    case "image/png":
      return b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case "image/gif":
      return ascii(0, 4) === "GIF8";
    case "image/webp":
      return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
    case "image/avif":
      return ascii(4, 8) === "ftyp" && /avi[fs]/.test(ascii(8, 12));
    default:
      return false;
  }
}

export function uploadDir() {
  return path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR || "./uploads");
}

export async function saveImage(file: File): Promise<string> {
  const ext = IMAGE_TYPES[file.type];
  if (!ext) throw new Error(`Unsupported image type: ${file.type || "unknown"}`);
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Images must be 8 MB or smaller.");

  const data = Buffer.from(await file.arrayBuffer());
  // The declared type comes from the browser; check the file's actual bytes too.
  if (!matchesSignature(data, file.type)) throw new Error("The file's contents don't match its image type.");

  const dir = uploadDir();
  await mkdir(dir, { recursive: true });
  const name = `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.${ext}`;
  await writeFile(path.join(dir, name), data);
  return `/uploads/${name}`;
}

/** Resolve an upload by file name, refusing anything that escapes the upload dir. */
export async function readUpload(name: string): Promise<{ data: Buffer; type: string } | null> {
  if (!/^[\w.-]+$/.test(name)) return null;
  const ext = name.split(".").pop()?.toLowerCase();
  const type = Object.entries(IMAGE_TYPES).find(([, e]) => e === ext)?.[0];
  if (!type) return null;
  try {
    return { data: await readFile(path.join(uploadDir(), name)), type };
  } catch {
    return null;
  }
}
