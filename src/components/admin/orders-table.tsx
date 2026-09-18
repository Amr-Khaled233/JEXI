"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Pencil, X } from "lucide-react";
import { updateOrderStatusAction } from "@/app/admin/actions/orders";
import { DeleteOrderButton } from "@/components/admin/delete-order-button";
import { OrderStatusBadge, Table } from "@/components/admin/ui";
import { buttonClasses } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { ORDER_STATUS_KEYS, ORDER_STATUSES, type OrderStatusKey } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";

export type OrderRow = {
  id: string;
  orderNumber: string;
  status: OrderStatusKey;
  createdAt: string;
  customerName: string;
  email: string;
  phone: string;
  governorate: string;
  area: string;
  address: string;
  notes: string | null;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  promoCode: string | null;
  items: { id: string; name: string; colorName: string | null; image: string | null; quantity: number; unitPrice: number; lineTotal: number }[];
};

const isOpen = (s: OrderStatusKey) => s === "PENDING" || s === "SHIPPED";

export function OrdersTable({ orders }: { orders: OrderRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const selected = orders.find((o) => o.id === openId) ?? null;

  return (
    <>
      <Table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Date</th>
            <th className="w-20">Items</th>
            <th>Total</th>
            <th>Status</th>
            <th className="w-28">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr
              key={o.id}
              onClick={() => setOpenId(o.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpenId(o.id);
                }
              }}
              tabIndex={0}
              aria-label={`Open order ${o.orderNumber}`}
              className="cursor-pointer focus-visible:outline-2 focus-visible:outline-gold"
            >
              <td className="font-medium tracking-wide tabular-nums">{o.orderNumber}</td>
              <td>
                <span className="block font-medium">{o.customerName}</span>
                <span className="block text-xs break-all text-muted">{o.email}</span>
                <span className="block text-xs text-muted tabular-nums">{o.phone}</span>
              </td>
              <td className="whitespace-nowrap text-muted tabular-nums">{formatDate(o.createdAt)}</td>
              <td className="tabular-nums">{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
              <td className="whitespace-nowrap font-medium tabular-nums">{formatMoney(o.total)}</td>
              <td>
                <OrderStatusBadge status={o.status} />
              </td>
              <td onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1">
                  <Link href={`/admin/orders/${o.id}`} aria-label={`Edit order ${o.orderNumber}`} title="Edit order" className={buttonClasses("ghost", "sm", "px-2.5")}>
                    <Pencil className="size-3.5" />
                  </Link>
                  <DeleteOrderButton orderId={o.id} orderNumber={o.orderNumber} open={isOpen(o.status)} compact />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {selected && <OrderQuickView order={selected} onClose={() => setOpenId(null)} />}
    </>
  );
}

function OrderQuickView({ order, onClose }: { order: OrderRow; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const changeStatus = (status: string) => {
    if (status === order.status) return;
    setMessage(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("orderId", order.id);
      fd.set("status", status);
      fd.set("notify", "on");
      const res = await updateOrderStatusAction(undefined, fd);
      setMessage(res?.error ? { tone: "error", text: res.error } : { tone: "success", text: res?.success ?? "Status updated." });
      router.refresh();
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={`Order ${order.orderNumber}`}>
      <div className="animate-fade-in fixed inset-0 bg-overlay backdrop-blur-sm" onClick={onClose} />
      <div className="animate-rise relative w-full max-w-2xl rounded-lg border border-border bg-bg shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-5 sm:px-7">
          <div>
            <h2 className="font-sans text-xl font-medium tabular-nums sm:text-2xl">Order {order.orderNumber}</h2>
            <p className="mt-1 text-sm text-muted">Placed {formatDate(order.createdAt, true)}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1.5 text-muted hover:bg-surface-2 hover:text-fg">
            <X className="size-5" />
          </button>
        </header>

        <div className="space-y-6 px-5 py-6 sm:px-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-[0.65rem] tracking-[0.16em] text-muted uppercase">Status</p>
              <OrderStatusBadge status={order.status} />
            </div>
            <div className="w-full sm:w-52">
              <label htmlFor="quick-status" className="mb-2 block text-[0.65rem] tracking-[0.16em] text-muted uppercase">
                Change status
              </label>
              <Select id="quick-status" value={order.status} disabled={pending || order.status === "CANCELLED"} onChange={(e) => changeStatus(e.target.value)} className="h-10">
                {ORDER_STATUS_KEYS.map((s) => (
                  <option key={s} value={s}>
                    {ORDER_STATUSES[s].label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          {message && <p className={message.tone === "error" ? "text-sm text-danger" : "text-sm text-success"}>{message.text}</p>}
          {order.status === "CANCELLED" && <p className="text-xs text-muted">Cancelled orders can&apos;t be changed.</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="rounded-md border border-border p-4">
              <p className="mb-2 text-[0.65rem] tracking-[0.16em] text-muted uppercase">Customer</p>
              <p className="font-medium">{order.customerName}</p>
              <a href={`mailto:${order.email}`} className="block text-sm break-all text-muted hover:text-gold">
                {order.email}
              </a>
              <a href={`tel:${order.phone}`} className="block text-sm text-muted tabular-nums hover:text-gold">
                {order.phone}
              </a>
            </section>
            <section className="rounded-md border border-border p-4">
              <p className="mb-2 text-[0.65rem] tracking-[0.16em] text-muted uppercase">Delivering to</p>
              <p className="text-sm">{order.address}</p>
              <p className="text-sm text-muted">
                {order.area}, {order.governorate}
              </p>
              {order.notes && <p className="mt-2 text-xs text-muted italic">“{order.notes}”</p>}
            </section>
          </div>

          <section>
            <p className="mb-2 text-[0.65rem] tracking-[0.16em] text-muted uppercase">Items</p>
            <ul className="divide-y divide-border border-y border-border">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-3">
                  <div className="relative aspect-4/5 w-12 shrink-0 overflow-hidden rounded-[3px] bg-surface-2">
                    {i.image && <Image src={i.image} alt="" fill sizes="48px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{i.name}</p>
                    <p className="text-xs text-muted">
                      {i.colorName ? `${i.colorName}, ` : ""}
                      {formatMoney(i.unitPrice)} each
                    </p>
                  </div>
                  <span className="text-xs text-muted tabular-nums">x{i.quantity}</span>
                  <span className="w-24 text-right text-sm tabular-nums">{formatMoney(i.lineTotal)}</span>
                </li>
              ))}
            </ul>
          </section>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tabular-nums">{formatMoney(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-success">
                <dt>Discount{order.promoCode ? ` (${order.promoCode})` : ""}</dt>
                <dd className="tabular-nums">-{formatMoney(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted">Shipping</dt>
              <dd className="tabular-nums">{order.shippingFee === 0 ? "Free" : formatMoney(order.shippingFee)}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-border pt-3">
              <dt className="text-[0.65rem] tracking-[0.16em] text-muted uppercase">Total</dt>
              <dd className="text-xl font-medium tabular-nums">{formatMoney(order.total)}</dd>
            </div>
          </dl>
        </div>

        <footer className="flex flex-wrap justify-end gap-3 border-t border-border px-5 py-4 sm:px-7">
          <button type="button" onClick={onClose} className={buttonClasses("outline", "md")}>
            Close
          </button>
          <Link href={`/admin/orders/${order.id}`} className={buttonClasses("primary", "md")}>
            Edit order
          </Link>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
