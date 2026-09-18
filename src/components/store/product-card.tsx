import Image from "next/image";
import Link from "next/link";
import { ColorSwatch } from "@/components/color-swatch";
import { Price } from "@/components/price";
import { Badge } from "@/components/ui/badge";
import type { ProductCardData } from "@/lib/catalog";
import { TAGS } from "@/lib/constants";

export function ProductCard({ product, priority }: { product: ProductCardData; priority?: boolean }) {
  const [first, second] = product.images;
  const soldOut = product.variants.every((v) => v.stock <= 0);
  const colors = [...new Set(product.variants.map((v) => v.color))];

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[3px] bg-surface-2">
        {first && (
          <Image
            src={first}
            alt={product.name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
          />
        )}
        {second && (
          <Image
            src={second}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover opacity-0 transition duration-700 group-hover:opacity-100"
          />
        )}
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
              <ColorSwatch key={c} color={c} className="size-3" />
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
