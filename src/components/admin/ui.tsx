import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { ORDER_STATUSES, type OrderStatusKey } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function PageTitle({ title, description, action }: { title: string; description?: string; action?: { href: string; label: string } | React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl md:text-4xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {action && typeof action === "object" && "href" in action ? (
        <Link href={action.href} className={buttonClasses("primary", "md")}>
          {action.label}
        </Link>
      ) : (
        action
      )}
    </div>
  );
}

export const ORDER_STATUS_TONES: Record<OrderStatusKey, BadgeTone> = {
  PENDING: "warning",
  CONFIRMED: "gold",
  SHIPPED: "dark",
  DELIVERED: "success",
  CANCELLED: "danger",
};

export function OrderStatusBadge({ status }: { status: OrderStatusKey }) {
  return <Badge tone={ORDER_STATUS_TONES[status]}>{ORDER_STATUSES[status].label}</Badge>;
}

/** Grid-style table: every cell is bordered, header row is shaded, rows highlight on hover. */
export function Table({ children, className, compact }: { children: React.ReactNode; className?: string; compact?: boolean }) {
  return (
    <div className={cn("overflow-x-auto rounded-lg border border-border bg-surface", className)}>
      <table
        className={cn(
          "w-full border-collapse text-left text-sm",
          !compact && "min-w-160",
          // Cells
          "[&_td]:border [&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td]:align-middle",
          "[&_th]:border [&_th]:border-border [&_th]:bg-surface-2 [&_th]:px-4 [&_th]:py-3 [&_th]:text-[0.65rem] [&_th]:font-medium [&_th]:tracking-[0.16em] [&_th]:text-muted [&_th]:uppercase",
          // Hide the outer edge (the wrapper draws it) so borders don't double up.
          "[&_tr>*:first-child]:border-l-0 [&_tr>*:last-child]:border-r-0 [&_thead_tr>*]:border-t-0 [&_tbody_tr:last-child>*]:border-b-0",
          "[&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-surface-2/50",
        )}
      >
        {children}
      </table>
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="card px-6 py-16 text-center text-sm text-muted">{children}</div>;
}

export function Panel({ title, children, className, action }: { title?: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <section className={cn("card p-5 md:p-6", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-xl">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
