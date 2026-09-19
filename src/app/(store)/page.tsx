import Image from "next/image";
import Link from "next/link";
import { Gift, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { ProductCard } from "@/components/store/product-card";
import { SectionHeading } from "@/components/store/section-heading";
import { buttonClasses } from "@/components/ui/button";
import { getNavCategories, giftBoxValue, type GiftBoxWithItems, type ProductCardData } from "@/lib/catalog";
import { getFeaturedGiftBox, getHomePage, getHomeProducts } from "@/lib/home";
import { formatMoney } from "@/lib/money";
import { getSettings } from "@/lib/settings";
import { freeShippingOffer } from "@/lib/shipping";

// Everything on this page is controlled from Admin → Home Page.
export default async function HomePage() {
  const home = await getHomePage();
  const [bestSellers, newArrivals, featuredBox, categories, settings] = await Promise.all([
    home.showBestSellers ? getHomeProducts(home.bestSellerIds, "BEST_SELLER") : [],
    home.showNewArrivals ? getHomeProducts(home.newArrivalIds, "NEW") : [],
    home.showGiftBox ? getFeaturedGiftBox(home.featuredGiftBoxId) : null,
    home.showCategories ? getNavCategories() : [],
    getSettings(),
  ]);
  const offer = freeShippingOffer(settings);
  const customHero = !!home.heroImage;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0f0b08] text-[#f1e8dc]">
        <h1 className="sr-only">{settings.storeName}</h1>
        {/* A square photo shown whole and feathered into the background (the brand photo carries the embossed wordmark). */}
        <div
          className="relative mx-auto aspect-square w-full max-w-[min(100%,82svh)]"
          style={{ maskImage: "radial-gradient(closest-side, #000 72%, transparent)", WebkitMaskImage: "radial-gradient(closest-side, #000 72%, transparent)" }}
        >
          <Image
            src={home.heroImage || "/brand/logo-hero.jpg"}
            alt={customHero ? "" : "JEXI Accessories"}
            fill
            priority
            sizes="(min-width: 768px) 82vh, 100vw"
            className="object-cover"
          />
        </div>
        <div className="container-page flex flex-col items-center pb-14 text-center md:absolute md:inset-x-0 md:bottom-[5%] md:pb-0">
          {home.heroTagline && (
            <p className="animate-rise -mt-6 max-w-md font-serif text-xl text-[#e6d5c0] italic md:mt-0 md:text-2xl" style={{ animationDelay: "150ms" }}>
              {home.heroTagline}
            </p>
          )}
          <div className="animate-rise mt-8 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "300ms" }}>
            {home.heroPrimaryLabel && (
              <Link href={home.heroPrimaryHref || "/shop"} className={buttonClasses("primary", "lg", "bg-[#c9a27a] text-[#140e0a] hover:bg-[#e0bf98] hover:text-[#140e0a]")}>
                {home.heroPrimaryLabel}
              </Link>
            )}
            {home.heroSecondaryLabel && (
              <Link
                href={home.heroSecondaryHref || "/gift-boxes"}
                className={buttonClasses("outline", "lg", "border-[#c9a27a]/60 text-[#e0bf98] hover:border-[#e0bf98] hover:text-[#f1e8dc]")}
              >
                {home.heroSecondaryLabel}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Category shortcuts */}
      {categories.length > 0 && (
        <section className="container-page py-16 md:py-20">
          <div className="scrollbar-none -mx-4 flex snap-x scroll-px-4 gap-4 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-6 md:overflow-visible md:px-0">
            {categories.map((c) => (
              <Link key={c.id} href={`/category/${c.slug}`} className="group w-32 shrink-0 snap-start text-center md:w-auto">
                <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-full bg-surface-2 ring-1 ring-border transition group-hover:ring-gold">
                  {c.image && <Image src={c.image} alt="" fill sizes="(min-width: 768px) 16vw, 128px" className="object-cover transition duration-700 group-hover:scale-110" />}
                </div>
                <p className="mt-3 text-[0.7rem] tracking-[0.22em] uppercase transition group-hover:text-gold">{c.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {bestSellers.length > 0 && (
        <section className={`container-page ${categories.length ? "py-8 md:py-12" : "pt-16 pb-8 md:pt-20 md:pb-12"}`}>
          <SectionHeading eyebrow={home.bestSellersEyebrow} title={home.bestSellersTitle} href="/shop?tag=BEST_SELLER" />
          <ProductRow products={bestSellers} />
        </section>
      )}

      {/* Gift box promo */}
      {featuredBox && <GiftBoxFeature box={featuredBox} />}

      {newArrivals.length > 0 && (
        <section className="container-page py-8 md:py-12">
          <SectionHeading eyebrow={home.newArrivalsEyebrow} title={home.newArrivalsTitle} href="/shop?sort=newest" />
          <ProductRow products={newArrivals} />
        </section>
      )}

      {/* Promises */}
      {home.showPromises && (
        <section className="container-page mt-12 grid grid-cols-2 gap-8 border-y border-border py-12 md:grid-cols-4">
          {[
            offer.active
              ? { icon: Truck, title: "Free shipping", text: offer.minimum ? `On orders over ${formatMoney(offer.minimum)}` : "Delivered across Egypt" }
              : { icon: Truck, title: "Fast delivery", text: "Across Egypt" },
            { icon: ShieldCheck, title: "Cash on delivery", text: "Pay when it arrives" },
            { icon: Gift, title: "Gift ready", text: "Signature JEXI packaging" },
            { icon: RotateCcw, title: "Easy support", text: "We're a message away" },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex flex-col items-center text-center">
              <Icon className="size-6 text-gold" strokeWidth={1.2} />
              <p className="mt-3 text-[0.7rem] tracking-[0.22em] uppercase">{title}</p>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </div>
          ))}
        </section>
      )}
    </>
  );
}

function ProductRow({ products }: { products: ProductCardData[] }) {
  return (
    <div className="scrollbar-none -mx-4 flex snap-x scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:px-0">
      {products.slice(0, 8).map((p) => (
        <div key={p.id} className="w-[46%] shrink-0 snap-start sm:w-[31%] md:w-auto">
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  );
}

function GiftBoxFeature({ box }: { box: GiftBoxWithItems }) {
  const { separate, savings } = giftBoxValue(box);
  return (
    <section className="my-16 bg-[#120d0a] text-[#f1e8dc] md:my-24">
      <div className="container-page grid grid-cols-1 items-center gap-10 py-16 md:grid-cols-2 md:py-0">
        <div className="relative aspect-4/5 w-full overflow-hidden md:my-16 md:max-w-md md:justify-self-end">
          <Image src={box.coverImage} alt={box.name} fill sizes="(min-width: 768px) 28rem, 100vw" className="object-cover" />
        </div>
        <div className="max-w-md">
          <p className="eyebrow mb-3 text-[#c9a27a]">The Gift Box</p>
          <h2 className="text-4xl md:text-5xl">{box.name}</h2>
          <p className="mt-5 leading-relaxed text-[#bfae9c]">{box.description}</p>
          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="text-2xl text-[#e0bf98]">{formatMoney(box.price)}</span>
            {savings > 0 && (
              <>
                <span className="text-sm text-[#8a7b6d] line-through">{formatMoney(separate)}</span>
                <span className="text-xs tracking-[0.18em] text-[#c9a27a] uppercase">You save {formatMoney(savings)}</span>
              </>
            )}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/gift-boxes/${box.slug}`} className={buttonClasses("primary", "md", "bg-[#c9a27a] text-[#140e0a] hover:bg-[#e0bf98] hover:text-[#140e0a]")}>
              Shop this box
            </Link>
            <Link href="/gift-boxes" className={buttonClasses("outline", "md", "border-[#c9a27a]/50 text-[#e0bf98] hover:border-[#e0bf98] hover:text-[#f1e8dc]")}>
              All gift boxes
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
