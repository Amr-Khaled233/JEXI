import type { Metadata } from "next";
import { CheckoutForm } from "@/components/store/checkout-form";
import { getCustomer } from "@/lib/auth";
import { db } from "@/lib/db";
import { listPaymentMethods } from "@/lib/payments";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const customer = await getCustomer();
  const [zones, addresses] = await Promise.all([
    db.shippingZone.findMany({ where: { enabled: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { name: true, estimatedDelivery: true } }),
    customer ? db.address.findMany({ where: { customerId: customer.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }) : [],
  ]);

  return (
    <div className="container-page py-10 md:py-14">
      <h1 className="mb-8 text-4xl md:text-5xl">Checkout</h1>
      <CheckoutForm
        zones={zones}
        paymentMethods={listPaymentMethods()}
        customer={customer ? { name: customer.name, email: customer.email, phone: customer.phone ?? "" } : null}
        addresses={addresses.map((a) => ({ id: a.id, label: a.label, fullName: a.fullName, phone: a.phone, governorate: a.governorate, area: a.area, address: a.address }))}
      />
    </div>
  );
}
