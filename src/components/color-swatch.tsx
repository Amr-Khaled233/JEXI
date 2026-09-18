import { swatchBackground } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ColorSwatch({ hex, name, className }: { hex: string; name?: string; className?: string }) {
  return (
    <span
      title={name}
      className={cn("inline-block size-3.5 shrink-0 rounded-full ring-1 ring-black/10 dark:ring-white/15", className)}
      style={{ background: swatchBackground(hex) }}
    />
  );
}
