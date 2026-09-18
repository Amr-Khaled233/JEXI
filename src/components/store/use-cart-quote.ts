"use client";

import { useEffect, useRef, useState } from "react";
import { getCartQuote } from "@/app/actions/cart";
import { useCart, useCartHydrated } from "@/lib/cart-store";
import type { Quote } from "@/lib/pricing";

/** Live server-side quote for the current cart. Re-runs when items, promo or shipping details change. */
export function useCartQuote(opts: { governorate?: string | null; email?: string | null; phone?: string | null } = {}) {
  const hydrated = useCartHydrated();
  const items = useCart((s) => s.items);
  const promoCode = useCart((s) => s.promoCode);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);
  const itemsKey = JSON.stringify(items);

  useEffect(() => {
    if (!hydrated) return;
    const id = ++seq.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const q = await getCartQuote({
          items: JSON.parse(itemsKey),
          promoCode,
          governorate: opts.governorate || null,
          customerEmail: opts.email || null,
          customerPhone: opts.phone || null,
        });
        if (id === seq.current) setQuote(q);
      } catch (err) {
        console.error("Failed to load cart quote", err);
      } finally {
        if (id === seq.current) setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [hydrated, itemsKey, promoCode, opts.governorate, opts.email, opts.phone]);

  return { quote, loading: loading || !hydrated, hydrated, items, promoCode };
}
