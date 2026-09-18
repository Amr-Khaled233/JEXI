import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/product-form";
import { PageTitle } from "@/components/admin/ui";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  return (
    <>
      <PageTitle title="New product" />
      <ProductForm
        categories={categories}
        initial={{
          name: "",
          slug: "",
          sku: "",
          description: "",
          price: "",
          compareAtPrice: "",
          categoryIds: [],
          tags: ["NEW"],
          published: false,
          images: [],
          variants: { GOLD: { stock: "0", sku: "" } },
        }}
      />
    </>
  );
}
