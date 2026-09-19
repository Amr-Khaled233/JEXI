import Image from "next/image";
import Link from "next/link";
import { ColorSwatch } from "@/components/color-swatch";
import { Price } from "@/components/price";
import { Badge } from "@/components/ui/badge";
import type { ProductCardData } from "@/lib/catalog";
import { TAGS } from "@/lib/constants";

export function ProductCard({ product, priority }: { product: ProductCardData; priority?: boolean }) {
  const first = product.images[0];
  const soldOut = product.variants.every((v) => v.stock <= 0);
  const colors = [...new Map(product.variants.map((v) => [v.color.id, v.color])).values()];

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-4/5 overflow-hidden rounded-[3px] bg-surface-2">
        {first && (
          <Image
            src={first}
            alt={product.name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition duration-700 ease-out group-hover:scale-[1.08] group-focus-visible:scale-[1.08]"
          />
        )}
        <HoverView />
        <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5">
          {soldOut ? (
            <Badge tone="dark">Sold out</Badge>
          ) : (
            product.tags.map((t) => (
              <Badge key={t} tone={t === "SALE" ? "gold" : "dark"}>
                {TAGS[t].label}
              </Badge>
            ))
          )}
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        <h3 className="font-serif text-lg leading-snug transition group-hover:text-gold">{product.name}</h3>
        <div className="flex items-center justify-between gap-2">
          <Price price={product.price} compareAt={product.compareAtPrice} size="sm" />
          <span className="flex gap-1">
            {colors.map((c) => (
              <ColorSwatch key={c.id} hex={c.hex} name={c.name} className="size-3" />
            ))}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: ProductCardData[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 md:gap-x-6">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}

/** Hover effect shared by product and gift box cards: a soft shade and a "View" button. */
export function HoverView() {
  return (
    <>
      <span className="pointer-events-none absolute inset-0 bg-black/0 transition duration-500 group-hover:bg-black/25 group-focus-visible:bg-black/25" />
      <span className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center">
        <span className="translate-y-3 rounded-full bg-[#f6efe4] px-6 py-2.5 text-[0.65rem] font-medium tracking-[0.24em] text-[#1c140f] uppercase opacity-0 shadow-lg transition duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
          View
        </span>
      </span>
    </>
  );
}
