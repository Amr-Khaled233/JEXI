import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { OrderStatusBadge, Panel } from "@/components/admin/ui";
import { OrderAddress, OrderItems, OrderSummaryTotals } from "@/components/order-details";
import { OrderTimeline } from "@/components/order-timeline";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const order = await db.order.findUnique({ where: { id: (await params).id }, select: { orderNumber: true } });
  return { title: order ? `Order ${order.orderNumber}` : "Order" };
}

export default async function AdminOrderPage({ params }: Props) {
  const order = await db.order.findUnique({
    where: { id: (await params).id },
    include: { items: true, history: { orderBy: { createdAt: "asc" } }, customer: { select: { id: true, name: true } } },
  });
  if (!order) notFound();

  const previousOrders = await db.order.count({ where: { email: order.email, id: { not: order.id } } });
  const whatsapp = order.phone.replace(/^0/, "20");

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1.5 text-xs tracking-[0.14em] text-muted uppercase hover:text-gold">
        <ArrowLeft className="size-3.5" /> Orders
      </Link>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-muted">Placed {formatDate(order.createdAt, true)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Panel title="Items">
            <OrderItems items={order.items} showSku />
            <div className="mt-4 border-t border-border pt-4">
              <OrderSummaryTotals order={order} />
            </div>
          </Panel>
          <Panel title="Timeline">
            <OrderTimeline status={order.status} history={order.history} />
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Update status">
            <OrderStatusForm orderId={order.id} current={order.status} />
          </Panel>
          <Panel title="Customer">
            <OrderAddress order={order} />
            <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-4 text-xs tracking-[0.12em] uppercase">
              <a href={`tel:${order.phone}`} className="text-gold hover:underline">
                Call
              </a>
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                WhatsApp
              </a>
              <a href={`mailto:${order.email}`} className="text-gold hover:underline">
                Email
              </a>
            </div>
            <p className="mt-3 text-xs text-muted">
              {order.customer ? "Registered customer" : "Guest checkout"} · {previousOrders} other {previousOrders === 1 ? "order" : "orders"} with this email
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
