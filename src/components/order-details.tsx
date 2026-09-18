import Image from "next/image";
import { COLORS, type ColorKey } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { PAYMENT_LABELS } from "@/lib/payments";

type Item = {
  id: string;
  name: string;
  color: ColorKey | null;
  image: string | null;
  sku: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  contents: unknown;
};

type Order = {
  customerName: string;
  email: string;
  phone: string;
  governorate: string;
  area: string;
  address: string;
  notes: string | null;
  paymentMethod: "COD";
  paymentStatus: string;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  promoCode: string | null;
  items: Item[];
};

export function OrderItems({ items, showSku }: { items: Item[]; showSku?: boolean }) {
  return (
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <li key={item.id} className="flex gap-4 py-4">
          <div className="relative aspect-4/5 w-16 shrink-0 overflow-hidden rounded-[3px] bg-surface-2">
            {item.image && <Image src={item.image} alt="" fill sizes="64px" className="object-cover" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-serif text-lg leading-tight">{item.name}</p>
            <p className="text-xs text-muted">
              {item.color && COLORS[item.color].label}
              {showSku && item.sku && ` · ${item.sku}`}
              {` · ${formatMoney(item.unitPrice)} × ${item.quantity}`}
            </p>
            {Array.isArray(item.contents) && (
              <ul className="mt-1.5 space-y-0.5 text-xs text-muted">
                {(item.contents as { name: string; color: ColorKey; quantity: number }[]).map((c, i) => (
                  <li key={i}>
                    {c.name}, {COLORS[c.color]?.label}
                    {c.quantity > 1 && ` × ${c.quantity}`}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <span className="text-sm font-medium">{formatMoney(item.lineTotal)}</span>
        </li>
      ))}
    </ul>
  );
}

export function OrderSummaryTotals({ order }: { order: Pick<Order, "subtotal" | "discount" | "shippingFee" | "total" | "promoCode"> }) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted">Subtotal</dt>
        <dd>{formatMoney(order.subtotal)}</dd>
      </div>
      {order.discount > 0 && (
        <div className="flex justify-between text-success">
          <dt>Discount{order.promoCode && ` (${order.promoCode})`}</dt>
          <dd>− {formatMoney(order.discount)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-muted">Shipping</dt>
        <dd className={order.shippingFee === 0 ? "text-gold" : undefined}>{order.shippingFee === 0 ? "Free Shipping" : formatMoney(order.shippingFee)}</dd>
      </div>
      <div className="flex justify-between border-t border-border pt-3 text-base font-medium">
        <dt>Total</dt>
        <dd>{formatMoney(order.total)}</dd>
      </div>
    </dl>
  );
}

export function OrderAddress({ order }: { order: Order }) {
  return (
    <div className="space-y-4 text-sm">
      <div>
        <h3 className="mb-1.5 font-sans text-[0.68rem] tracking-[0.24em] text-gold uppercase">Ship to</h3>
        <p className="font-medium">{order.customerName}</p>
        <p className="text-fg/80">{order.address}</p>
        <p className="text-fg/80">
          {order.area}, {order.governorate}
        </p>
        <p className="text-fg/80">{order.phone}</p>
        <p className="text-fg/80">{order.email}</p>
        {order.notes && <p className="mt-2 text-muted italic">“{order.notes}”</p>}
      </div>
      <div>
        <h3 className="mb-1.5 font-sans text-[0.68rem] tracking-[0.24em] text-gold uppercase">Payment</h3>
        <p>
          {PAYMENT_LABELS[order.paymentMethod]} · <span className="text-muted">{order.paymentStatus === "PAID" ? "Paid" : order.paymentStatus === "REFUNDED" ? "Refunded" : "Due on delivery"}</span>
        </p>
      </div>
    </div>
  );
}
