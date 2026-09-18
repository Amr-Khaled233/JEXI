import Link from "next/link";
import { Suspense } from "react";
import { FilterPanel, MobileFilters, SortSelect } from "@/components/store/filters";
import { ProductGrid } from "@/components/store/product-card";
import { getProducts, type ProductFilters } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export async function ProductListing({
  filters,
  basePath,
  searchParams,
  categories,
}: {
  filters: ProductFilters;
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
  /** Pass to show the category filter (Shop All). */
  categories?: { slug: string; name: string }[];
}) {
  const { products, total, pages } = await getProducts(filters);

  const pageHref = (page: number) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) if (typeof v === "string" && k !== "page") p.set(k, v);
    if (page > 1) p.set("page", String(page));
    return `${basePath}${p.size ? `?${p}` : ""}`;
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[14rem_minmax(0,1fr)]">
      <aside className="hidden lg:block">
        <div className="sticky top-36">
          <Suspense>
            <FilterPanel categories={categories} />
          </Suspense>
        </div>
      </aside>
      <div>
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Suspense>
              <MobileFilters categories={categories} />
            </Suspense>
            <p className="text-xs tracking-[0.14em] text-muted uppercase">
              {total} {total === 1 ? "piece" : "pieces"}
            </p>
          </div>
          <Suspense>
            <SortSelect />
          </Suspense>
        </div>

        {products.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 px-6 py-20 text-center">
            <p className="font-serif text-2xl">No pieces match your filters</p>
            <Link href={basePath} className="text-sm text-gold underline underline-offset-4">
              Clear filters
            </Link>
          </div>
        ) : (
          <ProductGrid products={products} priorityCount={4} />
        )}

        {pages > 1 && (
          <nav aria-label="Pagination" className="mt-14 flex justify-center gap-1.5">
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={pageHref(n)}
                aria-current={n === filters.page ? "page" : undefined}
                className={cn(
                  "flex size-10 items-center justify-center rounded-[3px] border text-sm transition",
                  n === filters.page ? "border-fg bg-fg text-bg" : "border-border hover:border-gold hover:text-gold",
                )}
              >
                {n}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string | null }) {
  return (
    <div className="border-b border-border bg-surface-2/40">
      <div className="container-page py-12 text-center md:py-16">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="text-4xl md:text-5xl">{title}</h1>
        {description && <p className="mx-auto mt-4 max-w-xl text-muted">{description}</p>}
      </div>
    </div>
  );
}
