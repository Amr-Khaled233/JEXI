"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const src = images[active] ?? images[0];

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {images.length > 1 && (
        <div className="scrollbar-none flex gap-2.5 overflow-x-auto md:w-20 md:flex-col md:overflow-visible" role="tablist" aria-label="Product images">
          {images.map((img, i) => (
            <button
              key={img + i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Image ${i + 1}`}
              onClick={() => setActive(i)}
              className={cn(
                "relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-[3px] bg-surface-2 ring-1 transition md:w-full",
                i === active ? "ring-gold" : "ring-border opacity-70 hover:opacity-100",
              )}
            >
              <Image src={img} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="relative aspect-[4/5] flex-1 overflow-hidden rounded-[3px] bg-surface-2">
        {src && <Image key={src} src={src} alt={name} fill priority sizes="(min-width: 1024px) 45vw, 100vw" className="animate-fade-in object-cover" />}
      </div>
    </div>
  );
}
