import Link from "next/link";

export function SectionHeading({ eyebrow, title, href, linkLabel = "View all" }: { eyebrow?: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4 md:mb-10">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="text-3xl md:text-4xl">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="shrink-0 border-b border-gold/50 pb-0.5 text-[0.68rem] tracking-[0.22em] uppercase transition hover:text-gold">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
