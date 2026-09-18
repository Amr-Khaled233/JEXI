import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/product-form";
import { PageTitle } from "@/components/admin/ui";
import { getColors } from "@/lib/admin-data";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const [categories, colors] = await Promise.all([db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }), getColors()]);
  return (
    <>
      <PageTitle title="New product" />
      <ProductForm
        categories={categories}
        colors={colors}
        initial={{
          name: "",
          description: "",
          price: "",
          salePrice: "",
          categoryIds: [],
          tags: ["NEW"],
          published: false,
          images: [],
          stock: colors[0] ? { [colors[0].id]: "0" } : {},
        }}
      />
    </>
  );
}
