"use client";

import { useRouter } from "next/navigation";
import { OrderStatusBadge, Table } from "@/components/admin/ui";
import type { OrderStatusKey } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";

export type RecentOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: OrderStatusKey;
  createdAt: string;
};

/** The overview list. A whole row opens the order, like the orders table. */
export function RecentOrders({ orders }: { orders: RecentOrder[] }) {
  const router = useRouter();
  const open = (id: string) => router.push(`/admin/orders/${id}`);

  return (
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
        {orders.map((o) => (
          <tr
            key={o.id}
            onClick={() => open(o.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                open(o.id);
              }
            }}
            tabIndex={0}
            aria-label={`Open order ${o.orderNumber}`}
            className="cursor-pointer focus-visible:outline-2 focus-visible:outline-gold"
          >
            <td>
              <span className="block font-medium tabular-nums">{o.orderNumber}</span>
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
  );
}
