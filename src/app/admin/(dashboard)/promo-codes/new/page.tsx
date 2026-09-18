import type { Metadata } from "next";
import { PromoForm } from "@/components/admin/promo-form";
import { PageTitle } from "@/components/admin/ui";

export const metadata: Metadata = { title: "New promo code" };

export default function NewPromoPage() {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  const inAMonth = new Date(now.getTime() + 30 * 86_400_000);

  return (
    <>
      <PageTitle title="New promo code" />
      <PromoForm
        initial={{
          code: "",
          description: "",
          discountType: "PERCENTAGE",
          value: "10",
          startsAt: now.toISOString(),
          endsAt: inAMonth.toISOString(),
          usageLimit: "100",
          perCustomerLimit: "1",
          minOrderValue: "",
          active: true,
        }}
      />
    </>
  );
}
