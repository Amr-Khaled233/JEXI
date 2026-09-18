import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { OrdersTable } from "@/components/admin/orders-table";
import { OrdersToolbar } from "@/components/admin/orders-toolbar";
import { EmptyState, PageTitle } from "@/components/admin/ui";
import { ORDER_STATUS_KEYS, type OrderStatusKey } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Orders" };

const PER_PAGE = 25;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  const sp = await searchParams;
  const status = ORDER_STATUS_KEYS.includes(sp.status as OrderStatusKey) ? (sp.status as OrderStatusKey) : null;
  const q = sp.q?.trim().slice(0, 100) ?? "";
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

  const [orders, total, all, active, revenue] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { items: { select: { id: true, name: true, colorName: true, image: true, quantity: true, unitPrice: true, lineTotal: true } } },
    }),
    db.order.count({ where }),
    db.order.count(),
    db.order.count({ where: { status: { in: ["PENDING", "SHIPPED"] } } }),
    db.order.aggregate({ where: { status: { not: "CANCELLED" } }, _sum: { total: true }, _count: true }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const revenueTotal = revenue._sum.total ?? 0;
  const average = revenue._count ? Math.round(revenueTotal / revenue._count) : 0;

  const stats = [
    { label: "Total orders", value: all.toLocaleString("en-US"), hint: "All time" },
    { label: "Active orders", value: active.toLocaleString("en-US"), hint: "Pending or shipped" },
    { label: "Revenue", value: formatMoney(revenueTotal), hint: "Excluding cancelled" },
    { label: "Average order", value: formatMoney(average), hint: "Excluding cancelled" },
  ];

  const pageHref = (n: number) => {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (q) p.set("q", q);
    if (n > 1) p.set("page", String(n));
    return `/admin/orders${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <PageTitle title="Orders" description="Click an order to see its details and change its status." />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-[0.65rem] tracking-[0.18em] text-muted uppercase">{s.label}</p>
            <p className="mt-2 font-sans text-2xl font-medium tabular-nums sm:text-3xl">{s.value}</p>
            <p className="mt-1 text-xs text-muted">{s.hint}</p>
          </div>
        ))}
      </div>

      <Suspense>
        <OrdersToolbar count={total} />
      </Suspense>

      {orders.length === 0 ? (
        <EmptyState>No orders found.</EmptyState>
      ) : (
        <OrdersTable
          orders={orders.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            status: o.status,
            createdAt: o.createdAt.toISOString(),
            customerName: o.customerName,
            email: o.email,
            phone: o.phone,
            governorate: o.governorate,
            area: o.area,
            address: o.address,
            notes: o.notes,
            subtotal: o.subtotal,
            discount: o.discount,
            shippingFee: o.shippingFee,
            total: o.total,
            promoCode: o.promoCode,
            items: o.items,
          }))}
        />
      )}

      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          {page > 1 && (
            <Link href={pageHref(page - 1)} className="hover:text-gold">
              Previous
            </Link>
          )}
          <span className="text-muted">
            Page {page} of {pages}
          </span>
          {page < pages && (
            <Link href={pageHref(page + 1)} className="hover:text-gold">
              Next
            </Link>
          )}
        </div>
      )}
    </>
  );
}
