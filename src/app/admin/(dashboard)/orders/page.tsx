import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { EmptyState, OrderStatusBadge, PageTitle, Table } from "@/components/admin/ui";
import { Input } from "@/components/ui/field";
import { ORDER_STATUS_KEYS, ORDER_STATUSES, type OrderStatusKey } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { cn, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Orders" };

const PER_PAGE = 25;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  const sp = await searchParams;
  const status = ORDER_STATUS_KEYS.includes(sp.status as OrderStatusKey) ? (sp.status as OrderStatusKey) : null;
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { orderNumber: { contains: q, mode: "insensitive" } },
            { customerName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
          ],
        }
      : {}),
  };

  const [orders, total, counts] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: { id: true, orderNumber: true, customerName: true, phone: true, governorate: true, total: true, status: true, createdAt: true, _count: { select: { items: true } } },
    }),
    db.order.count({ where }),
    db.order.groupBy({ by: ["status"], _count: true }),
  ]);
  const countBy = Object.fromEntries(counts.map((c) => [c.status, c._count]));
  const all = counts.reduce((n, c) => n + c._count, 0);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  const href = (params: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const merged = { status, q: q || null, ...params };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    return `/admin/orders${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <PageTitle title="Orders" description="Open an order to see details and update its status." />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="scrollbar-none flex gap-1.5 overflow-x-auto">
          {[null, ...ORDER_STATUS_KEYS].map((s) => (
            <Link
              key={s ?? "all"}
              href={href({ status: s, page: null })}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs transition",
                status === s ? "border-gold bg-gold/15 text-gold" : "border-border hover:border-gold/60",
              )}
            >
              {s ? ORDER_STATUSES[s].label : "All"} <span className="text-muted">{s ? (countBy[s] ?? 0) : all}</span>
            </Link>
          ))}
        </div>
        <form className="w-full sm:w-72">
          {status && <input type="hidden" name="status" value={status} />}
          <Input name="q" defaultValue={q} placeholder="Search order #, name, email, phone" className="h-10" aria-label="Search orders" />
        </form>
      </div>

      {orders.length === 0 ? (
        <EmptyState>No orders found.</EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Governorate</th>
              <th>Items</th>
              <th>Status</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="transition hover:bg-surface-2/50">
                <td>
                  <Link href={`/admin/orders/${o.id}`} className="font-medium hover:text-gold">
                    {o.orderNumber}
                  </Link>
                  <span className="block text-xs text-muted">{formatDate(o.createdAt, true)}</span>
                </td>
                <td>
                  {o.customerName}
                  <span className="block text-xs text-muted">{o.phone}</span>
                </td>
                <td>{o.governorate}</td>
                <td>{o._count.items}</td>
                <td>
                  <OrderStatusBadge status={o.status} />
                </td>
                <td className="text-right tabular-nums">{formatMoney(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          {page > 1 && <Link href={href({ page: String(page - 1) })} className="hover:text-gold">← Previous</Link>}
          <span className="text-muted">
            Page {page} of {pages}
          </span>
          {page < pages && <Link href={href({ page: String(page + 1) })} className="hover:text-gold">Next →</Link>}
        </div>
      )}
    </>
  );
}
