import type { Metadata } from "next";
import { setAllShippingZonesAction } from "@/app/admin/actions/store";
import { ShippingZoneRow } from "@/components/admin/shipping-zone-row";
import { PageTitle } from "@/components/admin/ui";
import { Alert } from "@/components/ui/field";
import { db } from "@/lib/db";
import { formatMoney, fromMinor } from "@/lib/money";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Shipping Zones" };

export default async function ShippingPage() {
  const [zones, settings] = await Promise.all([db.shippingZone.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }), getSettings()]);
  const enabled = zones.filter((z) => z.enabled).length;

  return (
    <>
      <PageTitle title="Shipping Zones" description={`${enabled} of ${zones.length} governorates are visible at checkout.`} />
      <Alert tone="info" className="mb-6">
        {settings.freeShippingEnabled
          ? "Free shipping is on. A zone only charges if you set a fee for it below"
          : `Free shipping is off. Zones without a fee charge the default ${formatMoney(settings.defaultShippingFee)}`}
        {settings.freeShippingThreshold != null && `, and orders over ${formatMoney(settings.freeShippingThreshold)} always ship free`}. Change this in Settings.
      </Alert>

      <div className="mb-4 flex gap-2">
        {[true, false].map((on) => (
          <form key={String(on)} action={setAllShippingZonesAction}>
            <input type="hidden" name="enabled" value={String(on)} />
            <button type="submit" className="rounded-[3px] border border-border px-3 py-1.5 text-xs tracking-[0.12em] uppercase hover:border-gold hover:text-gold">
              {on ? "Show all" : "Hide all"}
            </button>
          </form>
        ))}
      </div>

      <div className="card divide-y divide-border">
        <div className="hidden grid-cols-[minmax(0,1fr)_7rem_10rem_12rem_5rem] gap-3 px-4 py-3 text-[0.65rem] tracking-[0.16em] text-muted uppercase md:grid">
          <span>Governorate</span>
          <span>Visible</span>
          <span>Fee (EGP)</span>
          <span>Estimated delivery</span>
          <span />
        </div>
        {zones.map((z) => (
          <ShippingZoneRow
            key={z.id}
            zone={{ id: z.id, name: z.name, enabled: z.enabled, fee: z.fee != null ? String(fromMinor(z.fee)) : "", estimatedDelivery: z.estimatedDelivery ?? "" }}
          />
        ))}
      </div>
    </>
  );
}
