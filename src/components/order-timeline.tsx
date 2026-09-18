import { Check, X } from "lucide-react";
import { ORDER_FLOW, ORDER_STATUSES, type OrderStatusKey } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";

type HistoryEntry = { id?: string; status: OrderStatusKey; note?: string | null; createdAt: Date | string };

/**
 * The tracking line: Pending → Shipped → Delivered, with the current step highlighted.
 * A cancelled order shows the steps it reached, then a red "Cancelled" step.
 */
export function OrderProgress({ status, history }: { status: OrderStatusKey; history: HistoryEntry[] }) {
  const reachedAt = new Map<OrderStatusKey, Date | string>();
  for (const h of history) if (!reachedAt.has(h.status)) reachedAt.set(h.status, h.createdAt);

  const cancelled = status === "CANCELLED";
  const steps: OrderStatusKey[] = cancelled ? [...ORDER_FLOW.filter((s) => s === "PENDING" || reachedAt.has(s)), "CANCELLED"] : ORDER_FLOW;
  const current = steps.indexOf(status);

  return (
    <ol className="flex w-full" aria-label={`Order status: ${ORDER_STATUSES[status].label}`}>
      {steps.map((s, i) => {
        const done = i <= current;
        const isCancel = s === "CANCELLED";
        const date = reachedAt.get(s);
        return (
          <li key={s} className="flex min-w-0 flex-1 flex-col items-center text-center" aria-current={i === current ? "step" : undefined}>
            <div className="flex w-full items-center">
              <span className={cn("h-0.5 flex-1", i === 0 ? "bg-transparent" : done ? (isCancel ? "bg-danger" : "bg-gold") : "bg-border")} />
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs transition",
                  isCancel ? "border-danger bg-danger text-white" : done ? "border-gold bg-gold text-on-gold" : "border-border bg-surface text-muted",
                  i === current && !isCancel && "ring-4 ring-gold/20",
                  i === current && isCancel && "ring-4 ring-danger/20",
                )}
              >
                {isCancel ? <X className="size-4" /> : done ? <Check className="size-4" /> : i + 1}
              </span>
              <span className={cn("h-0.5 flex-1", i === steps.length - 1 ? "bg-transparent" : i < current ? "bg-gold" : "bg-border")} />
            </div>
            <span className={cn("mt-2 text-[0.65rem] tracking-[0.14em] uppercase sm:text-xs", isCancel ? "text-danger" : done ? "text-fg" : "text-muted", i === current && "font-medium")}>
              {ORDER_STATUSES[s].label}
            </span>
            <span className="mt-0.5 min-h-4 text-[0.65rem] text-muted tabular-nums sm:text-xs">{date ? formatDate(date) : ""}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Progress line plus the full dated status history (order page and admin). */
export function OrderTimeline({ status, history }: { status: OrderStatusKey; history: HistoryEntry[] }) {
  return (
    <div className="space-y-8">
      <OrderProgress status={status} history={history} />
      <div>
        <h3 className="mb-3 font-sans text-[0.68rem] tracking-[0.24em] text-gold uppercase">History</h3>
        <ul className="space-y-3 border-l border-border pl-5">
          {[...history].reverse().map((h, i) => (
            <li key={h.id ?? i} className="relative">
              <span className={cn("absolute top-1.5 left-[-23.5px] size-2 rounded-full", h.status === "CANCELLED" ? "bg-danger" : "bg-gold")} />
              <p className="text-sm font-medium">{ORDER_STATUSES[h.status].label}</p>
              <p className="text-xs text-muted tabular-nums">{formatDate(h.createdAt, true)}</p>
              {h.note && <p className="mt-1 text-sm text-fg/80">{h.note}</p>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
