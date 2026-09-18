import type { Metadata } from "next";
import { CartView } from "@/components/store/cart-view";

export const metadata: Metadata = { title: "Your Cart" };

export default function CartPage() {
  return (
    <div className="container-page py-10 md:py-14">
      <h1 className="mb-8 text-4xl md:text-5xl">Your Cart</h1>
      <CartView />
    </div>
  );
}
