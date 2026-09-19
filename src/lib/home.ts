import { cache } from "react";
import { db } from "@/lib/db";
import { getGiftBoxes, getTaggedProducts, productCardSelect, type ProductCardData } from "@/lib/catalog";
import type { TagKey } from "@/lib/constants";

/** Home page settings (single row, id = 1), created with defaults on first read. */
export const getHomePage = cache(async () => db.homePage.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} }));

export type HomePageSettings = Awaited<ReturnType<typeof getHomePage>>;

/**
 * The products for a home page row: the admin's picks in their chosen order,
 * or (when none are picked) the products carrying the given tag.
 */
export async function getHomeProducts(ids: string[], fallbackTag: TagKey): Promise<ProductCardData[]> {
  if (ids.length === 0) return getTaggedProducts(fallbackTag, 8);
  const products = await db.product.findMany({ where: { id: { in: ids }, published: true }, select: productCardSelect });
  const byId = new Map(products.map((p) => [p.id, p]));
  return ids.map((id) => byId.get(id)).filter((p): p is ProductCardData => !!p);
}

/** The gift box featured on the home page: the admin's pick, or the best-selling one. */
export async function getFeaturedGiftBox(id: string | null) {
  if (id) {
    const [box] = (await getGiftBoxes()).filter((b) => b.id === id);
    if (box) return box;
  }
  return (await getGiftBoxes(1))[0] ?? null;
}
