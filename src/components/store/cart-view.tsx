"use client";

import Link from "next/link";
import { Loader2, ShoppingCart } from "lucide-react";
import { CartLines, OrderTotals, PromoCodeInput } from "@/components/store/cart-parts";
import { useCartQuote } from "@/components/store/use-cart-quote";
import { buttonClasses } from "@/components/ui/button";
import { Alert } from "@/components/ui/field";

export function CartView() {
  const { quote, loading, hydrated, items } = useCartQuote();

  if (hydrated && items.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-4 px-6 py-20 text-center">
        <ShoppingCart className="size-10 text-gold" strokeWidth={1} />
        <p className="font-serif text-2xl">Your cart is empty</p>
        <Link href="/shop" className={buttonClasses("primary")}>
          Discover the collection
        </Link>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-gold" />
      </div>
    );
  }

  const blocked = quote.itemCount === 0 || quote.lines.some((l) => l.issue);

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="card px-5">
        <CartLines quote={quote} />
      </div>
      <aside className="card h-fit space-y-5 p-6 lg:sticky lg:top-36">
        <h2 className="text-2xl">Summary</h2>
        <PromoCodeInput quote={quote} />
        <OrderTotals quote={quote} className={loading ? "opacity-60" : undefined} />
        {blocked && quote.itemCount > 0 && <Alert tone="error">Please update the highlighted items before checking out.</Alert>}
        <Link
          href="/checkout"
          aria-disabled={blocked}
          className={buttonClasses("primary", "lg", `w-full ${blocked ? "pointer-events-none opacity-50" : ""}`)}
        >
          Proceed to checkout
        </Link>
        <p className="text-center text-xs text-muted">Cash on delivery · Shipping calculated by governorate</p>
      </aside>
    </div>
  );
}
