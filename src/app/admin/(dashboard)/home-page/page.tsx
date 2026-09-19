import type { Metadata } from "next";
import { HomePageForm } from "@/components/admin/home-page-form";
import { PageTitle } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { getHomePage } from "@/lib/home";

export const metadata: Metadata = { title: "Home Page" };

export default async function HomePageSettingsPage() {
  const [home, products, giftBoxes, categories] = await Promise.all([
    getHomePage(),
    db.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, images: true, published: true } }),
    db.giftBox.findMany({ where: { published: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { name: true, slug: true } }),
  ]);

  const linkSuggestions = [
    { href: "/shop", label: "Shop All" },
    { href: "/gift-boxes", label: "Gift Boxes" },
    { href: "/shop?tag=BEST_SELLER", label: "Best Sellers" },
    { href: "/shop?sort=newest", label: "New Arrivals" },
    { href: "/shop?tag=SALE", label: "Sale" },
    { href: "/track", label: "Track your order" },
    ...categories.map((c) => ({ href: `/category/${c.slug}`, label: c.name })),
  ];

  return (
    <>
      <PageTitle title="Home Page" description="Choose what the home page shows: the hero, which sections appear, and which products they feature." />
      <HomePageForm
        products={products.map((p) => ({ id: p.id, name: p.name, image: p.images[0] ?? null, published: p.published }))}
        giftBoxes={giftBoxes}
        linkSuggestions={linkSuggestions}
        initial={{
          heroImage: home.heroImage,
          heroTagline: home.heroTagline,
          heroPrimaryLabel: home.heroPrimaryLabel,
          heroPrimaryHref: home.heroPrimaryHref,
          heroSecondaryLabel: home.heroSecondaryLabel,
          heroSecondaryHref: home.heroSecondaryHref,
          showCategories: home.showCategories,
          showBestSellers: home.showBestSellers,
          bestSellersEyebrow: home.bestSellersEyebrow,
          bestSellersTitle: home.bestSellersTitle,
          bestSellerIds: home.bestSellerIds,
          showGiftBox: home.showGiftBox,
          featuredGiftBoxId: home.featuredGiftBoxId,
          showNewArrivals: home.showNewArrivals,
          newArrivalsEyebrow: home.newArrivalsEyebrow,
          newArrivalsTitle: home.newArrivalsTitle,
          newArrivalIds: home.newArrivalIds,
          showPromises: home.showPromises,
        }}
      />
    </>
  );
}
