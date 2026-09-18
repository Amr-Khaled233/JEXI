import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export function Price({
  price,
  compareAt,
  className,
  size = "md",
}: {
  price: number;
  compareAt?: number | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const onSale = compareAt != null && compareAt > price;
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2", className)}>
      <span className={cn("font-medium", { sm: "text-sm", md: "text-base", lg: "text-2xl" }[size], onSale ? "text-gold" : "text-fg")}>
        {formatMoney(price)}
      </span>
      {onSale && (
        <span className={cn("text-muted line-through", size === "lg" ? "text-base" : "text-xs")}>
          <span className="sr-only">Was </span>
          {formatMoney(compareAt)}
        </span>
      )}
    </span>
  );
}
