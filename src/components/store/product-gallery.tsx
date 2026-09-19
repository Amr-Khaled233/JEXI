"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  // Photos that fail to load are dropped, so a missing file never shows as a broken image.
  const [failed, setFailed] = useState<string[]>([]);
  const shown = images.filter((img) => !failed.includes(img));
  const [active, setActive] = useState(0);
  const src = shown[active] ?? shown[0];
  const drop = (img: string) => {
    setFailed((f) => (f.includes(img) ? f : [...f, img]));
    setActive(0);
  };

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {shown.length > 1 && (
        <div className="scrollbar-none flex gap-2.5 overflow-x-auto md:w-20 md:flex-col md:overflow-visible" role="tablist" aria-label="Product images">
          {shown.map((img, i) => (
            <button
              key={img}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Image ${i + 1}`}
              onClick={() => setActive(i)}
              className={cn(
                "relative aspect-4/5 w-16 shrink-0 overflow-hidden rounded-[3px] bg-surface-2 ring-1 transition md:w-full",
                i === active ? "ring-gold" : "ring-border opacity-70 hover:opacity-100",
              )}
            >
              <Image src={img} alt="" fill sizes="80px" className="object-cover" onError={() => drop(img)} />
            </button>
          ))}
        </div>
      )}
      <div className="relative aspect-4/5 flex-1 overflow-hidden rounded-[3px] bg-surface-2">
        {src && (
          <Image
            key={src}
            src={src}
            alt={name}
            fill
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="animate-fade-in object-cover"
            onError={() => drop(src)}
          />
        )}
      </div>
    </div>
  );
}
