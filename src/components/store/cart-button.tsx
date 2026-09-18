"use client";

import { ShoppingBag } from "lucide-react";
import { useCart, useCartHydrated } from "@/lib/cart-store";

export function CartButton() {
  const hydrated = useCartHydrated();
  const count = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const openCart = useCart((s) => s.openCart);

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Open bag${hydrated && count ? `, ${count} items` : ""}`}
      className="relative inline-flex size-10 cursor-pointer items-center justify-center rounded-full hover:text-gold"
    >
      <ShoppingBag className="size-[18px]" strokeWidth={1.5} />
      {hydrated && count > 0 && (
        <span className="absolute top-1 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[0.6rem] font-medium text-on-gold">
          {count}
        </span>
      )}
    </button>
  );
}
