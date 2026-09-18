"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2, ShoppingCart, X } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { CartLines, OrderTotals, PromoCodeInput } from "@/components/store/cart-parts";
import { useCartQuote } from "@/components/store/use-cart-quote";
import { useCart } from "@/lib/cart-store";

export function CartDrawer() {
  const isOpen = useCart((s) => s.isOpen);
  const closeCart = useCart((s) => s.closeCart);
  const pathname = usePathname();
  const { quote, loading, items } = useCartQuote();

  useEffect(() => closeCart(), [pathname, closeCart]);
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  const empty = items.length === 0;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <div className="animate-fade-in absolute inset-0 bg-overlay" onClick={closeCart} />
      <aside className="animate-slide-in-right absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-bg shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-serif text-2xl">Your Cart</h2>
          <button type="button" onClick={closeCart} aria-label="Close cart" className="p-2 hover:text-gold">
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </div>

        {empty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingCart className="size-10 text-gold" strokeWidth={1} />
            <p className="font-serif text-xl">Your cart is empty</p>
            <Link href="/shop" onClick={closeCart} className={buttonClasses("primary", "md")}>
              Discover the collection
            </Link>
          </div>
        ) : !quote ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-gold" />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5">
              <CartLines quote={quote} compact onNavigate={closeCart} />
            </div>
            <div className="space-y-4 border-t border-border bg-surface px-5 py-5">
              <PromoCodeInput quote={quote} />
              <OrderTotals quote={quote} className={loading ? "opacity-60" : undefined} />
              <div className="grid grid-cols-2 gap-2">
                <Link href="/cart" onClick={closeCart} className={buttonClasses("outline", "md")}>
                  View cart
                </Link>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  aria-disabled={quote.itemCount === 0}
                  className={buttonClasses("primary", "md", quote.itemCount === 0 ? "pointer-events-none opacity-50" : undefined)}
                >
                  Checkout
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
