import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { RecentOrders } from "@/components/admin/recent-orders";
import { EmptyState, PageTitle, Panel } from "@/components/admin/ui";
import { ColorSwatch } from "@/components/color-swatch";
import { Alert } from "@/components/ui/field";
import { db } from "@/lib/db";
import { isEmailConfigured } from "@/lib/email/mailer";
import { formatMoney } from "@/lib/money";
import { getSettings } from "@/lib/settings";
import { freeShippingOffer } from "@/lib/shipping";

export default async function OverviewPage() {
  const settings = await getSettings();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [totalOrders, revenue, monthRevenue, pending, lowStock, recent, paidZones] = await Promise.all([
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
    db.shippingZone.count({ where: { enabled: true, fee: { gt: 0 } } }),
  ]);

  // The checkout instructions need somewhere to send the fee and a fee worth sending.
  const freeForEveryone = freeShippingOffer(settings).active && settings.freeShippingThreshold == null;
  const feeNotice = !settings.paymentPhone
    ? { text: "Customers aren't told to send the shipping fee, because no number is set to receive it.", href: "/admin/settings", cta: "Add a shipping fee number" }
    : freeForEveryone
      ? { text: "Free shipping is on for every order, so there is no fee to collect before you confirm.", href: "/admin/free-shipping", cta: "Review free shipping" }
      : paidZones === 0
        ? { text: "No governorate has a shipping fee yet, so there is nothing for customers to send before you confirm.", href: "/admin/shipping", cta: "Set the fees" }
        : null;

  const stats = [
    { label: "Total orders", value: totalOrders.toLocaleString("en-US"), hint: "Excluding cancelled" },
    { label: "Revenue", value: formatMoney(revenue._sum.total ?? 0), hint: `${formatMoney(monthRevenue._sum.total ?? 0)} this month` },
    { label: "Pending orders", value: pending.toLocaleString("en-US"), hint: "Awaiting confirmation", href: "/admin/orders?status=PENDING" },
    { label: "Low stock", value: lowStock.length.toLocaleString("en-US"), hint: `Variants at ≤ ${settings.lowStockThreshold} units` },
  ];

  return (
    <>
      <PageTitle title="Overview" description={`Welcome back. Here's how ${settings.storeName} is doing.`} />

      {feeNotice && (
        <Alert tone="warning" className="mb-6">
          {feeNotice.text}{" "}
          <Link href={feeNotice.href} className="underline underline-offset-4">
            {feeNotice.cta}
          </Link>
        </Alert>
      )}

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
            <RecentOrders orders={recent.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() }))} />
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
