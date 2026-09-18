import type { Metadata } from "next";
import { CheckoutForm } from "@/components/store/checkout-form";
import { db } from "@/lib/db";
import { listPaymentMethods } from "@/lib/payments";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const zones = await db.shippingZone.findMany({
    where: { enabled: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { name: true, estimatedDelivery: true },
  });

  return (
    <div className="container-page py-8 md:py-14">
      <h1 className="mb-6 text-3xl sm:text-4xl md:mb-8 md:text-5xl">Checkout</h1>
      <CheckoutForm zones={zones} paymentMethods={listPaymentMethods()} />
    </div>
  );
}
