"use client";

import Image from "next/image";
import { useActionState } from "react";
import { PackageSearch } from "lucide-react";
import { trackOrderAction } from "@/app/actions/track";
import { OrderProgress } from "@/components/order-timeline";
import { Button } from "@/components/ui/button";
import { Alert, Input } from "@/components/ui/field";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";

export function TrackForm() {
  const [state, action, pending] = useActionState(trackOrderAction, undefined);

  return (
    <div className="mt-8">
      <form action={action} className="mx-auto flex max-w-xl flex-col gap-3 sm:flex-row">
        <Input
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-label="Email address"
          defaultValue={state?.email}
          required
          className="h-12 min-w-0 flex-1"
        />
        <Button type="submit" size="lg" className="h-12 sm:px-10" loading={pending}>
          Track order
        </Button>
      </form>

      {state?.error && <Alert tone="error" className="mx-auto mt-6 max-w-xl">{state.error}</Alert>}

      {state?.orders && state.orders.length === 0 && (
        <div className="card mt-10 flex flex-col items-center gap-3 px-6 py-12 text-center">
          <PackageSearch className="size-9 text-gold" strokeWidth={1.2} />
          <p className="font-serif text-2xl">No orders found</p>
          <p className="max-w-sm text-sm text-muted">We couldn&apos;t find any orders for {state.email}. Please check the email you used at checkout.</p>
        </div>
      )}

      {state?.orders && state.orders.length > 0 && (
        <div className="mt-10 space-y-5">
          <p className="text-sm text-muted">
            {state.orders.length} {state.orders.length === 1 ? "order" : "orders"} for <span className="break-all text-fg">{state.email}</span>
          </p>
          {state.orders.map((o) => (
            <article key={o.orderNumber} className="card overflow-hidden">
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-2/50 px-5 py-4">
                <div>
                  <p className="text-[0.65rem] tracking-[0.18em] text-muted uppercase">Order</p>
                  <p className="font-medium tracking-wide tabular-nums">{o.orderNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium tabular-nums">{formatMoney(o.total)}</p>
                  <p className="text-xs text-muted tabular-nums">{formatDate(o.createdAt)}</p>
                </div>
              </header>
              <div className="px-3 py-6 sm:px-6">
                <OrderProgress status={o.status} history={o.history} />
              </div>
              <ul className="divide-y divide-border border-t border-border">
                {o.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 px-5 py-3">
                    <div className="relative aspect-4/5 w-11 shrink-0 overflow-hidden rounded-[3px] bg-surface-2">
                      {item.image && <Image src={item.image} alt="" fill sizes="44px" className="object-cover" />}
                    </div>
                    <p className="min-w-0 flex-1 truncate text-sm">{item.name}</p>
                    <p className="shrink-0 text-xs text-muted">
                      {item.colorName && `${item.colorName}, `}Qty {item.quantity}
                    </p>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
