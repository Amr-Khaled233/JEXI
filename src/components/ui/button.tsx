import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md" | "lg" | "icon";

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-[3px] font-sans font-medium uppercase tracking-[0.18em] transition-colors disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap cursor-pointer",
    {
      primary: "bg-fg text-bg hover:bg-gold hover:text-on-gold",
      outline: "border border-fg/25 text-fg hover:border-gold hover:text-gold",
      ghost: "text-fg hover:text-gold",
      danger: "bg-danger text-white hover:opacity-90",
      subtle: "bg-surface-2 text-fg hover:bg-gold-soft/60",
    }[variant],
    {
      sm: "h-9 px-4 text-[0.65rem]",
      md: "h-11 px-6 text-[0.7rem]",
      lg: "h-13 px-8 text-xs",
      icon: "size-10 p-0",
    }[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className,
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button className={buttonClasses(variant, size, className)} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}
