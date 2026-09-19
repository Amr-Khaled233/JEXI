import type { Metadata } from "next";
import { FreeShippingForm } from "@/components/admin/free-shipping-form";
import { PageTitle } from "@/components/admin/ui";
import { fromMinor } from "@/lib/money";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Free Shipping" };

export default async function FreeShippingPage() {
  const s = await getSettings();
  return (
    <>
      <PageTitle title="Free Shipping" description="Run free shipping all the time, for a set period, or only on bigger orders." />
      <FreeShippingForm
        initial={{
          enabled: s.freeShippingEnabled,
          startsAt: s.freeShippingStartsAt?.toISOString() ?? null,
          endsAt: s.freeShippingEndsAt?.toISOString() ?? null,
          minimum: s.freeShippingThreshold != null ? String(fromMinor(s.freeShippingThreshold)) : "",
        }}
      />
    </>
  );
}
