import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import { togglePromoCodeAction } from "@/app/admin/actions/store";
import { EmptyState, PageTitle, Table } from "@/components/admin/ui";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { PROMO_STATUS_LABELS, promoStatus, type PromoStatus } from "@/lib/promo";
import { cn, formatDate } from "@/lib/utils";

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
              <th className="w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {promos.map((p) => {
              const status = promoStatus(p);
              const pct = p.usageLimit ? Math.min(100, (p.usedCount / p.usageLimit) * 100) : 0;
              return (
                // Codes that can't be used right now are dimmed (the Actions cell stays bright).
                <tr key={p.id} className={cn(status !== "ACTIVE" && "[&>td:not(:last-child)]:opacity-40")}>
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
                  <td>
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/promo-codes/${p.id}`} aria-label={`Edit ${p.code}`} title="Edit code" className={buttonClasses("ghost", "sm", "px-2.5")}>
                        <Pencil className="size-3.5" />
                      </Link>
                      <form action={togglePromoCodeAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <button
                          type="submit"
                          aria-label={p.active ? `Deactivate ${p.code}` : `Activate ${p.code}`}
                          title={p.active ? "Active. Click to deactivate" : "Inactive. Click to activate"}
                          className={cn("flex h-9 items-center rounded-[3px] px-2 transition hover:bg-surface-2", p.active ? "text-gold" : "text-muted hover:text-fg")}
                        >
                          {p.active ? <ToggleRight className="size-6" strokeWidth={1.5} /> : <ToggleLeft className="size-6" strokeWidth={1.5} />}
                        </button>
                      </form>
                    </div>
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
