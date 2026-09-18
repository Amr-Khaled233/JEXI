import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/store/product-listing";
import { Badge } from "@/components/ui/badge";
import { getGiftBoxes, giftBoxValue } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = {
  title: "Gift Boxes",
  description: "Curated JEXI jewelry sets, presented in a keepsake box — and priced for less than buying separately.",
};

export default async function GiftBoxesPage() {
  const boxes = await getGiftBoxes();

  return (
    <>
      <PageHeader
        eyebrow="Curated sets"
        title="Gift Boxes"
        description="Hand-picked pieces that belong together, wrapped in our signature box — and priced for less than buying them separately."
      />
      <div className="container-page py-12 md:py-16">
        {boxes.length === 0 ? (
          <p className="py-20 text-center text-muted">New gift boxes are coming soon.</p>
        ) : (
          <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {boxes.map((box) => {
              const { separate, savings, savingsPercent, stock } = giftBoxValue(box);
              return (
                <Link key={box.id} href={`/gift-boxes/${box.slug}`} className="group block">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[3px] bg-surface-2">
                    <Image src={box.coverImage} alt={box.name} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition duration-700 group-hover:scale-[1.04]" />
                    <div className="absolute top-3 left-3 flex gap-2">
                      {stock <= 0 ? <Badge tone="dark">Sold out</Badge> : savingsPercent > 0 && <Badge tone="gold">Save {savingsPercent}%</Badge>}
                    </div>
                  </div>
                  <h2 className="mt-4 text-2xl transition group-hover:text-gold">{box.name}</h2>
                  <p className="mt-1 text-sm text-muted">{box.items.length} pieces · {box.items.map((i) => i.product.name).join(", ")}</p>
                  <div className="mt-2 flex flex-wrap items-baseline gap-2">
                    <span className="font-medium">{formatMoney(box.price)}</span>
                    {savings > 0 && <span className="text-xs text-muted line-through">{formatMoney(separate)}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
