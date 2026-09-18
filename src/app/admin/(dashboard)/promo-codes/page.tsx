import type { Metadata } from "next";
import Link from "next/link";
import { togglePromoCodeAction } from "@/app/admin/actions/store";
import { EmptyState, PageTitle, Table } from "@/components/admin/ui";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { PROMO_STATUS_LABELS, promoStatus, type PromoStatus } from "@/lib/promo";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Promo Codes" };

const TONES: Record<PromoStatus, BadgeTone> = { ACTIVE: "success", SCHEDULED: "gold", EXPIRED: "neutral", EXHAUSTED: "warning", INACTIVE: "neutral" };

export default async function PromoCodesPage() {
  const promos = await db.promoCode.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <>
      <PageTitle title="Promo Codes" description="Codes expire automatically after their end date or once the usage limit is reached." action={{ href: "/admin/promo-codes/new", label: "New code" }} />
      {promos.length === 0 ? (
        <EmptyState>No promo codes yet.</EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Discount</th>
              <th>Valid</th>
              <th>Used</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {promos.map((p) => {
              const status = promoStatus(p);
              const pct = p.usageLimit ? Math.min(100, (p.usedCount / p.usageLimit) * 100) : 0;
              return (
                <tr key={p.id}>
                  <td>
                    <Link href={`/admin/promo-codes/${p.id}`} className="font-medium tracking-wider hover:text-gold">
                      {p.code}
                    </Link>
                    {p.description && <span className="block text-xs text-muted">{p.description}</span>}
                  </td>
                  <td>
                    {p.discountType === "PERCENTAGE" ? `${p.value}%` : formatMoney(p.value)}
                    <span className="block text-xs text-muted">
                      {p.minOrderValue ? `Min. order ${formatMoney(p.minOrderValue)}` : "Whole order"}
                    </span>
                  </td>
                  <td className="text-xs whitespace-nowrap">
                    {formatDate(p.startsAt)}
                    <span className="block text-muted">to {formatDate(p.endsAt)}</span>
                  </td>
                  <td className="min-w-28">
                    <span className="tabular-nums">
                      {p.usedCount}/{p.usageLimit ?? "∞"}
                    </span>
                    {p.usageLimit && (
                      <span className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-surface-2">
                        <span className="block h-full bg-gold" style={{ width: `${pct}%` }} />
                      </span>
                    )}
                    {p.perCustomerLimit && <span className="block text-xs text-muted">{p.perCustomerLimit} per customer</span>}
                  </td>
                  <td>
                    <Badge tone={TONES[status]}>{PROMO_STATUS_LABELS[status]}</Badge>
                  </td>
                  <td className="text-right">
                    <form action={togglePromoCodeAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" className="text-xs tracking-[0.12em] text-muted uppercase hover:text-gold">
                        {p.active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </>
  );
}
