import type { Metadata } from "next";
import { PageHeader, ProductListing } from "@/components/store/product-listing";
import { getNavCategories, parseFilters } from "@/lib/catalog";

export const metadata: Metadata = { title: "Shop All" };

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const categories = await getNavCategories();

  const title = filters.q
    ? `Results for “${filters.q}”`
    : filters.tags.length === 1
      ? { BEST_SELLER: "Best Sellers", NEW: "New Arrivals", SALE: "Sale" }[filters.tags[0]]
      : "Shop All";

  return (
    <>
      <PageHeader eyebrow="The collection" title={title} />
      <div className="container-page py-10 md:py-14">
        <form action="/shop" className="mb-8 lg:hidden">
          <input
            name="q"
            defaultValue={filters.q}
            placeholder="Search jewelry…"
            aria-label="Search"
            className="h-11 w-full rounded-[3px] border border-border bg-surface px-3.5 text-sm focus:border-gold focus:outline-none"
          />
        </form>
        <ProductListing filters={filters} basePath="/shop" searchParams={sp} categories={categories} />
      </div>
    </>
  );
}
