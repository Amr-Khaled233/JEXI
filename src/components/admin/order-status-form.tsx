"use client";

import { useActionState } from "react";
import { updateOrderStatusAction } from "@/app/admin/actions/orders";
import { Button } from "@/components/ui/button";
import { Alert, Checkbox, Field, Select, Textarea } from "@/components/ui/field";
import { ORDER_STATUS_KEYS, ORDER_STATUSES, type OrderStatusKey } from "@/lib/constants";

export function OrderStatusForm({ orderId, current }: { orderId: string; current: OrderStatusKey }) {
  const [state, action, pending] = useActionState(updateOrderStatusAction, undefined);

  if (current === "CANCELLED") return <p className="text-sm text-muted">This order was cancelled. Its stock was returned to inventory.</p>;

  const nextIndex = Math.min(ORDER_STATUS_KEYS.indexOf(current) + 1, ORDER_STATUS_KEYS.length - 2);

  return (
    <form action={action} className="space-y-4" key={current}>
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      {state?.success && <Alert tone="success">{state.success}</Alert>}
      <input type="hidden" name="orderId" value={orderId} />
      <Field label="New status" htmlFor="status" hint="Cancelling returns items to stock and releases the promo code use.">
        <Select id="status" name="status" defaultValue={ORDER_STATUS_KEYS[nextIndex]}>
          {ORDER_STATUS_KEYS.filter((s) => s !== current).map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUSES[s].label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Note (optional)" htmlFor="note" hint="Included in the customer email, e.g. a courier tracking number.">
        <Textarea id="note" name="note" rows={2} className="min-h-0" maxLength={500} />
      </Field>
      <Checkbox name="notify" defaultChecked label="Email the customer about this update" />
      <Button type="submit" className="w-full" loading={pending}>
        Update status
      </Button>
    </form>
  );
}
