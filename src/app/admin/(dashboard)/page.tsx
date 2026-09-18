import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { EmptyState, OrderStatusBadge, PageTitle, Panel, Table } from "@/components/admin/ui";
import { ColorSwatch } from "@/components/color-swatch";
import { Alert } from "@/components/ui/field";
import { db } from "@/lib/db";
import { isEmailConfigured } from "@/lib/email/mailer";
import { formatMoney } from "@/lib/money";
import { getSettings } from "@/lib/settings";
import { formatDate } from "@/lib/utils";

export default async function OverviewPage() {
  const settings = await getSettings();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [totalOrders, revenue, monthRevenue, pending, lowStock, recent] = await Promise.all([
    db.order.count({ where: { status: { not: "CANCELLED" } } }),
    db.order.aggregate({ where: { status: { not: "CANCELLED" } }, _sum: { total: true } }),
    db.order.aggregate({ where: { status: { not: "CANCELLED" }, createdAt: { gte: startOfMonth } }, _sum: { total: true }, _count: true }),
    db.order.count({ where: { status: "PENDING" } }),
    db.variant.findMany({
      where: { stock: { lte: settings.lowStockThreshold } },
      include: { product: { select: { id: true, name: true, published: true } }, color: { select: { name: true, hex: true } } },
      orderBy: { stock: "asc" },
      take: 12,
    }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { id: true, orderNumber: true, customerName: true, total: true, status: true, createdAt: true } }),
  ]);

  const stats = [
    { label: "Total orders", value: totalOrders.toLocaleString("en-US"), hint: "Excluding cancelled" },
    { label: "Revenue", value: formatMoney(revenue._sum.total ?? 0), hint: `${formatMoney(monthRevenue._sum.total ?? 0)} this month` },
    { label: "Pending orders", value: pending.toLocaleString("en-US"), hint: "Awaiting confirmation", href: "/admin/orders?status=PENDING" },
    { label: "Low stock", value: lowStock.length.toLocaleString("en-US"), hint: `Variants at ≤ ${settings.lowStockThreshold} units` },
  ];

  return (
    <>
      <PageTitle title="Overview" description={`Welcome back. Here's how ${settings.storeName} is doing.`} />

      {!isEmailConfigured() && (
        <Alert tone="info" className="mb-6">
          Email notifications are off. Set <code>GMAIL_USER</code> and <code>GMAIL_APP_PASSWORD</code> in your environment to send order emails.
        </Alert>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const body = (
            <>
              <p className="text-[0.65rem] tracking-[0.18em] text-muted uppercase">{s.label}</p>
              <p className="mt-2 font-sans text-2xl font-medium tabular-nums sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-xs text-muted">{s.hint}</p>
            </>
          );
          return s.href ? (
            <Link key={s.label} href={s.href} className="card p-5 transition hover:border-gold">
              {body}
            </Link>
          ) : (
            <div key={s.label} className="card p-5">
              {body}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl">Recent orders</h2>
            <Link href="/admin/orders" className="text-xs tracking-[0.14em] text-gold uppercase">
              All orders
            </Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState>No orders yet. They&apos;ll show up here as soon as customers check out.</EmptyState>
          ) : (
            <Table compact>
              <thead>
                <tr>
                  <th>Order</th>
                  <th className="hidden sm:table-cell">Customer</th>
                  <th>Status</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/admin/orders/${o.id}`} className="font-medium hover:text-gold">
                        {o.orderNumber}
                      </Link>
                      <span className="block text-xs text-muted">{formatDate(o.createdAt, true)}</span>
                    </td>
                    <td className="hidden sm:table-cell">{o.customerName}</td>
                    <td>
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="text-right tabular-nums">{formatMoney(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>

        <Panel title="Low-stock alerts">
          {lowStock.length === 0 ? (
            <p className="text-sm text-muted">All variants are well stocked.</p>
          ) : (
            <ul className="divide-y divide-border">
              {lowStock.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <Link href={`/admin/products/${v.product.id}`} className="flex min-w-0 items-center gap-2 hover:text-gold">
                    <ColorSwatch hex={v.color.hex} />
                    <span className="truncate">
                      {v.product.name} <span className="text-muted">· {v.color.name}</span>
                    </span>
                  </Link>
                  <span className={v.stock === 0 ? "inline-flex items-center gap-1 text-danger" : "text-warning"}>
                    {v.stock === 0 && <AlertTriangle className="size-3.5" />}
                    {v.stock === 0 ? "Sold out" : `${v.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
