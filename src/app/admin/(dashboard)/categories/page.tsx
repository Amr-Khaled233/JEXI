import type { Metadata } from "next";
import { CategoriesManager } from "@/components/admin/categories-manager";
import { ColorsManager } from "@/components/admin/colors-manager";
import { PageTitle } from "@/components/admin/ui";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Categories & Colors" };

export default async function CategoriesPage() {
  const [categories, colors] = await Promise.all([
    db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { products: true } } } }),
    db.color.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { variants: true } } } }),
  ]);

  return (
    <>
      <PageTitle title="Categories" description="The order here is the order of the store menu." />
      <CategoriesManager
        categories={categories.map((c) => ({ id: c.id, name: c.name, description: c.description, image: c.image, productCount: c._count.products }))}
      />

      <div className="mt-16">
        <PageTitle title="Colors" description="The colors products can be offered in." />
        <ColorsManager colors={colors.map((c) => ({ id: c.id, name: c.name, hex: c.hex, variantCount: c._count.variants }))} />
      </div>
    </>
  );
}
