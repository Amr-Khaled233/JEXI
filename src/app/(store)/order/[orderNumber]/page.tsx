import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { timingSafeEqual } from "node:crypto";
import { CheckCircle2 } from "lucide-react";
import { OrderAddress, OrderItems, OrderSummaryTotals } from "@/components/order-details";
import { OrderTimeline } from "@/components/order-timeline";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUSES } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

type Props = {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ t?: string; new?: string }>;
};

function tokenMatches(a: string | undefined, b: string) {
  if (!a) return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export default async function OrderPage({ params, searchParams }: Props) {
  const [{ orderNumber }, { t, new: isNew }] = await Promise.all([params, searchParams]);
  const order = await db.order.findUnique({
    where: { orderNumber: decodeURIComponent(orderNumber) },
    include: { items: true, history: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) notFound();

  // Only visible with the order's secret link (shown after checkout and sent by email).
  if (!tokenMatches(t, order.accessToken)) notFound();

  return (
    <div className="container-page max-w-5xl py-10 md:py-14">
      {isNew && (
        <div className="mb-12 text-center">
          <CheckCircle2 className="mx-auto size-12 text-gold" strokeWidth={1} />
          <p className="eyebrow mt-5">Thank you, {order.customerName.split(" ")[0]}</p>
          <h1 className="mt-3 text-4xl md:text-5xl">Your order is placed</h1>
          <p className="mx-auto mt-4 max-w-lg text-muted">
            We&apos;ve emailed a confirmation to <span className="text-fg">{order.email}</span>. We&apos;ll call you to confirm delivery, and you&apos;ll get an email each time your order&apos;s status changes.
          </p>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-surface-2/50 px-6 py-5">
          <div>
            <p className="text-xs tracking-[0.18em] text-muted uppercase">Order number</p>
            <p className="font-sans text-xl font-medium tracking-wide tabular-nums sm:text-2xl">{order.orderNumber}</p>
          </div>
          <div className="text-right">
            <Badge tone={order.status === "CANCELLED" ? "danger" : order.status === "DELIVERED" ? "success" : "gold"}>{ORDER_STATUSES[order.status].label}</Badge>
            <p className="mt-1.5 text-xs text-muted">Placed {formatDate(order.createdAt, true)}</p>
          </div>
        </div>

        <div className="border-b border-border px-6 py-8">
          <OrderTimeline status={order.status} history={order.history} />
        </div>

        <div className="grid grid-cols-1 gap-8 px-6 py-6 md:grid-cols-[minmax(0,1fr)_18rem]">
          <div>
            <OrderItems items={order.items} />
            <div className="mt-4 border-t border-border pt-4">
              <OrderSummaryTotals order={order} />
            </div>
          </div>
          <OrderAddress order={order} />
        </div>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className={buttonClasses("primary")}>
          Continue shopping
        </Link>
        <Link href="/track" className={buttonClasses("outline")}>
          Track another order
        </Link>
      </div>
    </div>
  );
}
