"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CartItemInput } from "@/lib/pricing";

// The cart only stores what was chosen (variant/gift box + quantity).
// Names, prices and stock always come from the server quote.

type CartState = {
  items: CartItemInput[];
  promoCode: string | null;
  isOpen: boolean;
  /** Timestamp of the last add, used to show the "Added to your cart" notice. */
  lastAddedAt: number;
  add: (item: CartItemInput) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  setPromoCode: (code: string | null) => void;
  openCart: () => void;
  closeCart: () => void;
};

export function itemKey(item: CartItemInput) {
  return item.kind === "product" ? `p:${item.variantId}` : `g:${item.giftBoxId}`;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      promoCode: null,
      isOpen: false,
      lastAddedAt: 0,
      add: (item) =>
        set((s) => {
          const key = itemKey(item);
          const existing = s.items.find((i) => itemKey(i) === key);
          const items = existing
            ? s.items.map((i) => (itemKey(i) === key ? { ...i, quantity: Math.min(20, i.quantity + item.quantity) } : i))
            : [...s.items, item];
          return { items, lastAddedAt: Date.now() };
        }),
      setQuantity: (key, quantity) =>
        set((s) => ({
          items: quantity <= 0 ? s.items.filter((i) => itemKey(i) !== key) : s.items.map((i) => (itemKey(i) === key ? { ...i, quantity } : i)),
        })),
      remove: (key) => set((s) => ({ items: s.items.filter((i) => itemKey(i) !== key) })),
      clear: () => set({ items: [], promoCode: null }),
      setPromoCode: (promoCode) => set({ promoCode: promoCode?.trim().toUpperCase() || null }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: "jexi-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items, promoCode: s.promoCode }),
      // Rehydrated on mount (see useCartHydrated) so server and client first render match.
      skipHydration: true,
    },
  ),
);

export function useCartHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useCart.persist.onFinishHydration(() => setHydrated(true));
    if (useCart.persist.hasHydrated()) setHydrated(true);
    else void useCart.persist.rehydrate();
    return unsub;
  }, []);
  return hydrated;
}
