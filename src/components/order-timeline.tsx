import { Check, X } from "lucide-react";
import { ORDER_FLOW, ORDER_STATUSES, type OrderStatusKey } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";

type HistoryEntry = { id: string; status: OrderStatusKey; note: string | null; createdAt: Date };

/** Progress stepper (Pending → Delivered) plus the full dated status history. */
export function OrderTimeline({ status, history }: { status: OrderStatusKey; history: HistoryEntry[] }) {
  const cancelled = status === "CANCELLED";
  const currentIndex = ORDER_FLOW.indexOf(status);
  const reachedAt = new Map<OrderStatusKey, Date>();
  for (const h of history) if (!reachedAt.has(h.status)) reachedAt.set(h.status, h.createdAt);

  return (
    <div className="space-y-8">
      {cancelled ? (
        <div className="flex items-center gap-3 rounded-[3px] border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          <X className="size-4" /> This order was cancelled.
        </div>
      ) : (
        <ol className="grid grid-cols-5 gap-1">
          {ORDER_FLOW.map((s, i) => {
            const done = i <= currentIndex;
            return (
              <li key={s} className="flex flex-col items-center text-center">
                <div className="flex w-full items-center">
                  <span className={cn("h-px flex-1", i === 0 ? "bg-transparent" : done ? "bg-gold" : "bg-border")} />
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border text-[0.65rem]",
                      done ? "border-gold bg-gold text-on-gold" : "border-border text-muted",
                      i === currentIndex && "ring-4 ring-gold/20",
                    )}
                  >
                    {done ? <Check className="size-3.5" /> : i + 1}
                  </span>
                  <span className={cn("h-px flex-1", i === ORDER_FLOW.length - 1 ? "bg-transparent" : i < currentIndex ? "bg-gold" : "bg-border")} />
                </div>
                <span className={cn("mt-2 text-[0.6rem] tracking-[0.12em] uppercase sm:text-[0.65rem]", done ? "text-fg" : "text-muted")}>
                  {ORDER_STATUSES[s].label}
                </span>
                {reachedAt.get(s) && <span className="mt-0.5 hidden text-[0.65rem] text-muted sm:block">{formatDate(reachedAt.get(s)!)}</span>}
              </li>
            );
          })}
        </ol>
      )}

      <div>
        <h3 className="mb-3 font-sans text-[0.68rem] tracking-[0.24em] text-gold uppercase">History</h3>
        <ul className="space-y-3 border-l border-border pl-5">
          {[...history].reverse().map((h) => (
            <li key={h.id} className="relative">
              <span className="absolute top-1.5 left-[-23.5px] size-2 rounded-full bg-gold" />
              <p className="text-sm font-medium">{ORDER_STATUSES[h.status].label}</p>
              <p className="text-xs text-muted">{formatDate(h.createdAt, true)}</p>
              {h.note && <p className="mt-1 text-sm text-fg/80">{h.note}</p>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
