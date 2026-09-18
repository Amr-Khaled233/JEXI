"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { ColorSwatch } from "@/components/color-swatch";
import { QuantityStepper } from "@/components/store/cart-parts";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

type Variant = { id: string; color: { name: string; hex: string }; stock: number };

export function AddToCart({ variants, lowStockThreshold }: { variants: Variant[]; lowStockThreshold: number }) {
  const add = useCart((s) => s.add);
  const firstInStock = variants.find((v) => v.stock > 0) ?? variants[0];
  const [variantId, setVariantId] = useState(firstInStock?.id);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const variant = variants.find((v) => v.id === variantId);
  const soldOut = !variant || variant.stock <= 0;

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-3 text-[0.68rem] tracking-[0.24em] text-muted uppercase">
          Color: <span className="text-fg">{variant ? variant.color.name : ""}</span>
        </legend>
        <div className="flex flex-wrap gap-2.5">
          {variants.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => {
                setVariantId(v.id);
                setQuantity(1);
              }}
              aria-pressed={v.id === variantId}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
                v.id === variantId ? "border-gold bg-gold/10" : "border-border hover:border-gold/60",
                v.stock <= 0 && "text-muted line-through decoration-muted/60",
              )}
            >
              <ColorSwatch hex={v.color.hex} className="size-4" />
              {v.color.name}
            </button>
          ))}
        </div>
        {variant && variant.stock > 0 && variant.stock <= lowStockThreshold && (
          <p className="mt-3 text-xs text-warning">Only {variant.stock} left in {variant.color.name.toLowerCase()}</p>
        )}
      </fieldset>

      <div className="flex gap-3">
        <QuantityStepper value={quantity} max={Math.max(1, Math.min(variant?.stock ?? 1, 20))} onChange={(q) => setQuantity(Math.max(1, q))} disabled={soldOut} size="md" />
        <Button
          type="button"
          size="lg"
          className="h-11 min-w-0 flex-1"
          disabled={soldOut}
          onClick={() => {
            if (!variant) return;
            add({ kind: "product", variantId: variant.id, quantity });
            setAdded(true);
            setTimeout(() => setAdded(false), 1800);
          }}
        >
          {soldOut ? "Sold out" : added ? (
            <>
              <Check className="size-4" /> Added
            </>
          ) : (
            "Add to cart"
          )}
        </Button>
      </div>
    </div>
  );
}

export function AddGiftBoxToCart({ giftBoxId, stock }: { giftBoxId: string; stock: number }) {
  const add = useCart((s) => s.add);
  const [quantity, setQuantity] = useState(1);
  const soldOut = stock <= 0;
  return (
    <div className="flex gap-3">
      <QuantityStepper value={quantity} max={Math.max(1, Math.min(stock, 20))} onChange={(q) => setQuantity(Math.max(1, q))} disabled={soldOut} size="md" />
      <Button type="button" size="lg" className="h-11 min-w-0 flex-1" disabled={soldOut} onClick={() => add({ kind: "giftbox", giftBoxId, quantity })}>
        {soldOut ? "Sold out" : "Add to cart"}
      </Button>
    </div>
  );
}
