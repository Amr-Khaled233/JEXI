import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Gift, ShieldCheck, Truck } from "lucide-react";
import { Price } from "@/components/price";
import { AddToCart } from "@/components/store/add-to-cart";
import { BackButton } from "@/components/store/back-button";
import { ProductGrid } from "@/components/store/product-card";
import { ProductGallery } from "@/components/store/product-gallery";
import { SectionHeading } from "@/components/store/section-heading";
import { Badge } from "@/components/ui/badge";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { TAGS } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { getSettings } from "@/lib/settings";
import { freeShippingMessage } from "@/lib/shipping";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: { images: product.images.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();

  const [related, settings] = await Promise.all([
    getRelatedProducts(product.id, product.categories.map((c) => c.id)),
    getSettings(),
  ]);
  const primaryCategory = product.categories[0];
  const saving = product.compareAtPrice && product.compareAtPrice > product.price ? product.compareAtPrice - product.price : 0;

  return (
    <div className="container-page py-8 md:py-12">
      <BackButton fallbackHref={primaryCategory ? `/category/${primaryCategory.slug}` : "/shop"} />
      <nav aria-label="Breadcrumb" className="mb-6 text-xs tracking-[0.14em] text-muted uppercase">
        <Link href="/" className="hover:text-gold">
          Home
        </Link>
        <span className="mx-2">/</span>
        {primaryCategory ? (
          <Link href={`/category/${primaryCategory.slug}`} className="hover:text-gold">
            {primaryCategory.name}
          </Link>
        ) : (
          <Link href="/shop" className="hover:text-gold">
            Shop
          </Link>
        )}
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16">
        <ProductGallery images={product.images} name={product.name} />

        <div className="lg:sticky lg:top-36 lg:self-start">
          {product.tags.length > 0 && (
            <div className="mb-4 flex gap-2">
              {product.tags.map((t) => (
                <Badge key={t} tone={t === "SALE" ? "gold" : "neutral"}>
                  {TAGS[t].label}
                </Badge>
              ))}
            </div>
          )}
          <h1 className="text-4xl leading-tight md:text-5xl">{product.name}</h1>
          <div className="mt-4 flex items-center gap-3">
            <Price price={product.price} compareAt={product.compareAtPrice} size="lg" />
            {saving > 0 && <span className="text-xs tracking-[0.14em] text-gold uppercase">Save {formatMoney(saving)}</span>}
          </div>

          <div className="my-8 h-px bg-border" />

          <AddToCart
            variants={product.variants.map((v) => ({ id: v.id, color: { name: v.color.name, hex: v.color.hex }, stock: v.stock }))}
            lowStockThreshold={settings.lowStockThreshold}
          />

          <ul className="mt-8 space-y-3 text-sm text-muted">
            <li className="flex items-center gap-3">
              <Truck className="size-4 text-gold" strokeWidth={1.5} />
              {freeShippingMessage(settings) ?? "Delivery across Egypt"}
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-gold" strokeWidth={1.5} /> Cash on delivery
            </li>
            <li className="flex items-center gap-3">
              <Gift className="size-4 text-gold" strokeWidth={1.5} /> Arrives in signature JEXI packaging
            </li>
          </ul>

          {product.description && (
            <div className="mt-8 border-t border-border pt-8">
              <h2 className="mb-3 text-[0.68rem] font-sans tracking-[0.24em] text-gold uppercase">Details</h2>
              <p className="leading-relaxed whitespace-pre-line text-fg/85">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <SectionHeading eyebrow="Complete the look" title="You may also like" />
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
