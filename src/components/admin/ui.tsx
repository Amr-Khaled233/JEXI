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
  PROCESSING: "gold",
  SHIPPED: "dark",
  DELIVERED: "success",
  CANCELLED: "danger",
};

export function OrderStatusBadge({ status }: { status: OrderStatusKey }) {
  return <Badge tone={ORDER_STATUS_TONES[status]}>{ORDER_STATUSES[status].label}</Badge>;
}

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("card overflow-x-auto", className)}>
      <table className="w-full min-w-[40rem] text-left text-sm [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3 [&_th]:text-[0.65rem] [&_th]:font-medium [&_th]:tracking-[0.16em] [&_th]:text-muted [&_th]:uppercase [&_tbody_tr]:border-t [&_tbody_tr]:border-border">
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
