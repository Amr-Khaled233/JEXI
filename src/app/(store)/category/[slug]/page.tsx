import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader, ProductListing } from "@/components/store/product-listing";
import { db } from "@/lib/db";
import { parseFilters } from "@/lib/catalog";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function getCategory(slug: string) {
  return db.category.findUnique({ where: { slug } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategory((await params).slug);
  return { title: category?.name ?? "Category", description: category?.description ?? undefined };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const category = await getCategory(slug);
  if (!category) notFound();

  const filters = { ...parseFilters(sp), categories: [category.slug] };

  return (
    <>
      <PageHeader eyebrow="Collection" title={category.name} description={category.description} />
      <div className="container-page py-10 md:py-14">
        <ProductListing filters={filters} basePath={`/category/${category.slug}`} searchParams={sp} />
      </div>
    </>
  );
}
