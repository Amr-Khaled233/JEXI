import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ColorSwatch } from "@/components/color-swatch";
import { AddGiftBoxToCart } from "@/components/store/add-to-cart";
import { BackButton } from "@/components/store/back-button";
import { getGiftBoxBySlug, giftBoxValue } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const box = await getGiftBoxBySlug((await params).slug);
  if (!box) return { title: "Gift box not found" };
  return { title: box.name, description: box.description.slice(0, 160), openGraph: { images: [box.coverImage] } };
}

export default async function GiftBoxPage({ params }: Props) {
  const box = await getGiftBoxBySlug((await params).slug);
  if (!box) notFound();
  const { separate, savings, savingsPercent, stock } = giftBoxValue(box);

  return (
    <div className="container-page py-8 md:py-12">
      <BackButton fallbackHref="/gift-boxes" />
      <nav aria-label="Breadcrumb" className="mb-6 text-xs tracking-[0.14em] text-muted uppercase">
        <Link href="/" className="hover:text-gold">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/gift-boxes" className="hover:text-gold">
          Gift Boxes
        </Link>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16">
        <div className="relative aspect-4/5 overflow-hidden rounded-[3px] bg-surface-2">
          <Image src={box.coverImage} alt={box.name} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        </div>

        <div className="lg:sticky lg:top-36 lg:self-start">
          <p className="eyebrow mb-3">Gift Box</p>
          <h1 className="text-4xl leading-tight md:text-5xl">{box.name}</h1>

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="text-2xl font-medium text-gold">{formatMoney(box.price)}</span>
            {savings > 0 && <span className="text-muted line-through">{formatMoney(separate)}</span>}
          </div>
          {savings > 0 && (
            <p className="mt-3 inline-block rounded-full bg-gold/10 px-4 py-1.5 text-xs tracking-[0.16em] text-gold uppercase">
              You save {formatMoney(savings)} ({savingsPercent}%) vs. buying separately
            </p>
          )}

          {box.description && <p className="mt-6 leading-relaxed whitespace-pre-line text-fg/85">{box.description}</p>}

          <div className="mt-8 border-y border-border py-6">
            <h2 className="mb-4 font-sans text-[0.68rem] tracking-[0.24em] text-gold uppercase">Inside the box</h2>
            <ul className="space-y-4">
              {box.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4">
                  <div className="relative aspect-4/5 w-14 shrink-0 overflow-hidden rounded-[3px] bg-surface-2">
                    {item.product.images[0] && <Image src={item.product.images[0]} alt="" fill sizes="56px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    {item.product.published ? (
                      <Link href={`/product/${item.product.slug}`} className="font-serif text-lg hover:text-gold">
                        {item.product.name}
                      </Link>
                    ) : (
                      <span className="font-serif text-lg">{item.product.name}</span>
                    )}
                    <p className="flex items-center gap-1.5 text-xs text-muted">
                      <ColorSwatch hex={item.variant.color.hex} className="size-3" /> {item.variant.color.name}
                      {item.quantity > 1 && ` · × ${item.quantity}`}
                    </p>
                  </div>
                  <span className="text-sm text-muted">{formatMoney(item.product.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8">
            <AddGiftBoxToCart giftBoxId={box.id} stock={stock} />
          </div>
        </div>
      </div>
    </div>
  );
}
