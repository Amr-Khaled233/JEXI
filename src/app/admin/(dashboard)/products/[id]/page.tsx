import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import { PageTitle } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { fromMinor } from "@/lib/money";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    db.product.findUnique({ where: { id }, include: { variants: true, categories: { select: { id: true } } } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();

  return (
    <>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1.5 text-xs tracking-[0.14em] text-muted uppercase hover:text-gold">
        <ArrowLeft className="size-3.5" /> Products
      </Link>
      <PageTitle
        title={product.name}
        action={
          product.published ? (
            <Link href={`/product/${product.slug}`} target="_blank" className="inline-flex items-center gap-1.5 text-sm text-gold hover:underline">
              View in store <ExternalLink className="size-3.5" />
            </Link>
          ) : undefined
        }
      />
      <ProductForm
        categories={categories}
        initial={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          description: product.description,
          price: String(fromMinor(product.price)),
          compareAtPrice: product.compareAtPrice != null ? String(fromMinor(product.compareAtPrice)) : "",
          categoryIds: product.categories.map((c) => c.id),
          tags: product.tags,
          published: product.published,
          images: product.images,
          variants: Object.fromEntries(product.variants.map((v) => [v.color, { stock: String(v.stock), sku: v.sku ?? "" }])),
        }}
      />
    </>
  );
}
