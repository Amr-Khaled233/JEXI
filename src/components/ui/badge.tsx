import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "gold" | "success" | "danger" | "warning" | "dark";

export function Badge({ tone = "neutral", className, children }: { tone?: BadgeTone; className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.62rem] font-medium uppercase tracking-[0.14em] whitespace-nowrap",
        {
          neutral: "bg-surface-2 text-muted",
          gold: "bg-gold text-on-gold",
          success: "bg-success/15 text-success",
          danger: "bg-danger/15 text-danger",
          warning: "bg-warning/15 text-warning",
          dark: "bg-fg text-bg",
        }[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
