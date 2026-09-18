import { cn } from "@/lib/utils";

const control =
  "w-full rounded-[3px] border border-border bg-surface px-3.5 text-sm text-fg placeholder:text-muted/70 transition focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-60";

const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8' fill='none' stroke='%23a8988a' stroke-width='1.5'%3E%3Cpath d='M1 1.5l5 5 5-5'/%3E%3C/svg%3E\")";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-muted", className)} {...props} />;
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, "min-h-24 py-2.5", className)} {...props} />;
}

export function Select({ className, children, style, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(control, "h-11 appearance-none bg-size-[12px] bg-position-[right_0.9rem_center] bg-no-repeat pr-9", className)}
      style={{ backgroundImage: CHEVRON, ...style }}
      {...props}
    >
      {children}
    </select>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
}: {
  label?: string;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function Checkbox({ label, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2.5 text-sm text-fg", className)}>
      <input type="checkbox" className="size-4 cursor-pointer accent-gold" {...props} />
      <span>{label}</span>
    </label>
  );
}

export function Alert({ tone = "info", children, className }: { tone?: "info" | "error" | "success"; children: React.ReactNode; className?: string }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-[3px] border px-4 py-3 text-sm",
        tone === "error" && "border-danger/40 bg-danger/10 text-danger",
        tone === "success" && "border-success/40 bg-success/10 text-success",
        tone === "info" && "border-gold/30 bg-gold/10 text-fg",
        className,
      )}
    >
      {children}
    </div>
  );
}
