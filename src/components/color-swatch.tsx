import { COLORS, type ColorKey } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ColorSwatch({ color, className }: { color: ColorKey; className?: string }) {
  return (
    <span
      title={COLORS[color].label}
      className={cn("inline-block size-3.5 shrink-0 rounded-full ring-1 ring-black/10 dark:ring-white/15", className)}
      style={{ background: COLORS[color].swatch }}
    />
  );
}
