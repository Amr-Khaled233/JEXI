import { cn } from "@/lib/utils";

const SIZES = {
  sm: { word: "text-2xl tracking-[0.38em]", rule: "w-16 my-1", sub: "text-[0.45rem] tracking-[0.5em]" },
  md: { word: "text-[2rem] tracking-[0.4em]", rule: "w-20 my-1.5", sub: "text-[0.5rem] tracking-[0.55em]" },
  lg: { word: "text-5xl tracking-[0.42em]", rule: "w-28 my-2.5", sub: "text-[0.65rem] tracking-[0.6em]" },
  xl: { word: "text-6xl md:text-8xl tracking-[0.42em]", rule: "w-32 md:w-44 my-4", sub: "text-[0.7rem] md:text-sm tracking-[0.6em]" },
};

/** The JEXI wordmark: spaced serif caps, a gold divider with a dot, and letter-spaced "ACCESSORIES". */
export function Logo({ size = "md", className }: { size?: keyof typeof SIZES; className?: string }) {
  const s = SIZES[size];
  return (
    <span className={cn("inline-flex flex-col items-center leading-none select-none", className)}>
      {/* Negative margin cancels the trailing letter-spacing so the word is optically centred. */}
      <span className={cn("gold-text font-serif font-light", s.word)} style={{ marginRight: "-0.4em" }}>
        JEXI
      </span>
      <span className={cn("flex items-center justify-center", s.rule)} aria-hidden>
        <span className="h-px flex-1 bg-gold/80" />
        <span className="mx-1 size-[3px] rounded-full bg-gold" />
        <span className="h-px flex-1 bg-gold/80" />
      </span>
      <span className={cn("font-sans text-gold uppercase", s.sub)} style={{ marginRight: "-0.55em" }}>
        Accessories
      </span>
    </span>
  );
}
