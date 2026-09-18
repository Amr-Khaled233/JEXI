import { db } from "@/lib/db";

/** Products (with variants) offered as choices in the gift box builder. */
export async function getGiftBoxProductOptions() {
  return db.product.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, price: true, variants: { select: { id: true, stock: true, color: { select: { name: true, hex: true } } }, orderBy: { color: { sortOrder: "asc" } } } },
  });
}

export async function getColors() {
  return db.color.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, slug: true, hex: true } });
}
