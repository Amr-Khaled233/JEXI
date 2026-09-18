import { db } from "@/lib/db";

/** Products (with variants) offered as choices in the gift box builder. */
export async function getGiftBoxProductOptions() {
  return db.product.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, price: true, variants: { select: { id: true, color: true, stock: true }, orderBy: { color: "asc" } } },
  });
}
