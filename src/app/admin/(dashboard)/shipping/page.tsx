import type { Metadata } from "next";
import { setAllShippingZonesAction } from "@/app/admin/actions/store";
import { ShippingZoneRow } from "@/components/admin/shipping-zone-row";
import { PageTitle, Table } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { fromMinor } from "@/lib/money";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Shipping Zones" };

export default async function ShippingPage() {
  const [zones, settings] = await Promise.all([db.shippingZone.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }), getSettings()]);
  const enabled = zones.filter((z) => z.enabled).length;

  return (
    <>
      <PageTitle title="Shipping Zones" description={`${enabled} of ${zones.length} governorates are visible at checkout.`} />

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

      <Table>
        <thead>
          <tr>
            <th>Governorate</th>
            <th className="w-24">Visible</th>
            <th className="w-40">Fee (EGP)</th>
            <th>Estimated delivery</th>
            <th className="w-36" aria-label="Save" />
          </tr>
        </thead>
        <tbody>
          {zones.map((z) => (
            <ShippingZoneRow
              key={z.id}
              zone={{ id: z.id, name: z.name, enabled: z.enabled, fee: z.fee != null ? String(fromMinor(z.fee)) : "", estimatedDelivery: z.estimatedDelivery ?? "" }}
            />
          ))}
        </tbody>
      </Table>
    </>
  );
}
