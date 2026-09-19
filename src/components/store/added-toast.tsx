"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { useCart } from "@/lib/cart-store";

/** Small "Added to your cart" notice. The cart panel only opens if the customer asks for it. */
export function AddedToast() {
  const lastAddedAt = useCart((s) => s.lastAddedAt);
  const openCart = useCart((s) => s.openCart);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!lastAddedAt) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(t);
  }, [lastAddedAt]);

  if (!visible) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-rise fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-40 mx-auto flex max-w-sm items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 shadow-2xl sm:right-6 sm:left-auto sm:mx-0"
    >
      <CheckCircle2 className="size-5 shrink-0 text-gold" strokeWidth={1.5} />
      <p className="min-w-0 flex-1 text-sm">Added to your cart</p>
      <button
        type="button"
        onClick={() => {
          setVisible(false);
          openCart();
        }}
        className="shrink-0 text-xs font-medium tracking-[0.16em] text-gold uppercase hover:text-gold-strong"
      >
        View cart
      </button>
      <button type="button" onClick={() => setVisible(false)} aria-label="Dismiss" className="shrink-0 p-1 text-muted hover:text-fg">
        <X className="size-4" />
      </button>
    </div>
  );
}
