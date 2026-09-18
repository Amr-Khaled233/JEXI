import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import { PageTitle } from "@/components/admin/ui";
import { getColors } from "@/lib/admin-data";
import { db } from "@/lib/db";
import { fromMinor } from "@/lib/money";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories, colors] = await Promise.all([
    db.product.findUnique({ where: { id }, include: { variants: true, categories: { select: { id: true } } } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    getColors(),
  ]);
  if (!product) notFound();
  const onSale = product.compareAtPrice != null && product.compareAtPrice > product.price;

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
        colors={colors}
        initial={{
          id: product.id,
          name: product.name,
          description: product.description,
          price: String(fromMinor(onSale ? product.compareAtPrice! : product.price)),
          salePrice: onSale ? String(fromMinor(product.price)) : "",
          categoryIds: product.categories.map((c) => c.id),
          tags: product.tags,
          published: product.published,
          images: product.images,
          stock: Object.fromEntries(product.variants.map((v) => [v.colorId, String(v.stock)])),
        }}
      />
    </>
  );
}
