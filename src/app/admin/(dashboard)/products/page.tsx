import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { toggleProductPublishedAction } from "@/app/admin/actions/catalog";
import { EmptyState, PageTitle, Table } from "@/components/admin/ui";
import { ColorSwatch } from "@/components/color-swatch";
import { Price } from "@/components/price";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/field";
import { TAGS } from "@/lib/constants";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; status?: string }> }) {
  const { q = "", category = "", status = "" } = await searchParams;
  const where: Prisma.ProductWhereInput = {
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }] } : {}),
    ...(category ? { categories: { some: { id: category } } } : {}),
    ...(status === "published" ? { published: true } : status === "draft" ? { published: false } : {}),
  };

  const [products, categories, settings] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { variants: { orderBy: { color: "asc" } }, categories: { select: { name: true } } },
    }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    getSettings(),
  ]);

  return (
    <>
      <PageTitle title="Products" description={`${products.length} products`} action={{ href: "/admin/products/new", label: "Add product" }} />

      <form className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem_10rem_auto]">
        <Input name="q" defaultValue={q} placeholder="Search name or SKU" className="h-10" aria-label="Search products" />
        <Select name="category" defaultValue={category} className="h-10" aria-label="Category">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select name="status" defaultValue={status} className="h-10" aria-label="Status">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </Select>
        <button type="submit" className="h-10 rounded-[3px] border border-border px-4 text-xs tracking-[0.14em] uppercase hover:border-gold hover:text-gold">
          Filter
        </button>
      </form>

      {products.length === 0 ? (
        <EmptyState>
          No products found. <Link href="/admin/products/new" className="text-gold underline">Add your first product</Link>.
        </EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Tags</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 hover:text-gold">
                    <span className="relative aspect-4/5 w-10 shrink-0 overflow-hidden rounded-[2px] bg-surface-2">
                      {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="40px" className="object-cover" />}
                    </span>
                    <span>
                      <span className="font-medium">{p.name}</span>
                      <span className="block text-xs text-muted">
                        {p.sku} · {p.categories.map((c) => c.name).join(", ") || "No category"}
                      </span>
                    </span>
                  </Link>
                </td>
                <td>
                  <Price price={p.price} compareAt={p.compareAtPrice} size="sm" />
                </td>
                <td>
                  <div className="flex flex-col gap-1">
                    {p.variants.map((v) => (
                      <span key={v.id} className="inline-flex items-center gap-1.5 text-xs">
                        <ColorSwatch color={v.color} className="size-3" />
                        <span className={v.stock === 0 ? "text-danger" : v.stock <= settings.lowStockThreshold ? "text-warning" : ""}>{v.stock}</span>
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {p.tags.map((t) => (
                      <Badge key={t} tone={t === "SALE" ? "gold" : "neutral"}>
                        {TAGS[t].label}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td>
                  <form action={toggleProductPublishedAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit" title={p.published ? "Click to unpublish" : "Click to publish"} className="cursor-pointer">
                      <Badge tone={p.published ? "success" : "neutral"}>{p.published ? "Published" : "Draft"}</Badge>
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
