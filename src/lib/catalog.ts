import { cache } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { COLOR_KEYS, PRODUCTS_PER_PAGE, TAG_KEYS, type ColorKey, type TagKey } from "@/lib/constants";
import { db } from "@/lib/db";
import { toMinor } from "@/lib/money";

export const productCardSelect = {
  id: true,
  name: true,
  slug: true,
  price: true,
  compareAtPrice: true,
  images: true,
  tags: true,
  createdAt: true,
  variants: { select: { id: true, color: true, stock: true }, orderBy: { color: "asc" } },
} satisfies Prisma.ProductSelect;

export type ProductCardData = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

export const getNavCategories = cache(async () =>
  db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, slug: true, image: true, description: true } }),
);

// ─── Filters ──────────────────────────────────────────────

export const SORTS = {
  featured: "Featured",
  newest: "Newest",
  "best-selling": "Best selling",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
} as const;
export type SortKey = keyof typeof SORTS;

export type ProductFilters = {
  categories: string[];
  colors: ColorKey[];
  tags: TagKey[];
  min: number | null; // EGP
  max: number | null; // EGP
  sort: SortKey;
  q: string;
  page: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

function list(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return (Array.isArray(v) ? v : v.split(",")).map((s) => s.trim()).filter(Boolean);
}

function num(v: string | string[] | undefined): number | null {
  const s = Array.isArray(v) ? v[0] : v;
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function parseFilters(sp: SearchParams): ProductFilters {
  const sort = (Array.isArray(sp.sort) ? sp.sort[0] : sp.sort) as SortKey;
  return {
    categories: list(sp.category),
    colors: list(sp.color).filter((c): c is ColorKey => (COLOR_KEYS as string[]).includes(c)),
    tags: list(sp.tag).filter((t): t is TagKey => (TAG_KEYS as string[]).includes(t)),
    min: num(sp.min),
    max: num(sp.max),
    sort: sort in SORTS ? sort : "featured",
    q: (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim().slice(0, 80) ?? "",
    page: Math.max(1, Math.floor(num(sp.page) ?? 1)),
  };
}

export async function getProducts(filters: ProductFilters) {
  const where: Prisma.ProductWhereInput = { published: true };
  const and: Prisma.ProductWhereInput[] = [];

  if (filters.categories.length) and.push({ categories: { some: { slug: { in: filters.categories } } } });
  if (filters.colors.length) and.push({ variants: { some: { color: { in: filters.colors } } } });
  if (filters.tags.length) and.push({ tags: { hasSome: filters.tags } });
  if (filters.min != null) and.push({ price: { gte: toMinor(filters.min) } });
  if (filters.max != null) and.push({ price: { lte: toMinor(filters.max) } });
  if (filters.q) {
    and.push({
      OR: [
        { name: { contains: filters.q, mode: "insensitive" } },
        { description: { contains: filters.q, mode: "insensitive" } },
        { sku: { contains: filters.q, mode: "insensitive" } },
      ],
    });
  }
  if (and.length) where.AND = and;

  const orderBy: Prisma.ProductOrderByWithRelationInput[] = {
    featured: [{ soldCount: "desc" as const }, { createdAt: "desc" as const }],
    newest: [{ createdAt: "desc" as const }],
    "best-selling": [{ soldCount: "desc" as const }],
    "price-asc": [{ price: "asc" as const }],
    "price-desc": [{ price: "desc" as const }],
  }[filters.sort];

  const [total, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: [...orderBy, { id: "asc" }],
      select: productCardSelect,
      skip: (filters.page - 1) * PRODUCTS_PER_PAGE,
      take: PRODUCTS_PER_PAGE,
    }),
  ]);

  return { products, total, pages: Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE)) };
}

export async function getTaggedProducts(tag: TagKey, take = 8) {
  return db.product.findMany({
    where: { published: true, tags: { has: tag } },
    orderBy: tag === "BEST_SELLER" ? [{ soldCount: "desc" }] : [{ createdAt: "desc" }],
    select: productCardSelect,
    take,
  });
}

export const getProductBySlug = cache(async (slug: string) =>
  db.product.findFirst({
    where: { slug, published: true },
    include: {
      categories: { select: { id: true, name: true, slug: true } },
      variants: { orderBy: { color: "asc" } },
    },
  }),
);

export async function getRelatedProducts(productId: string, categoryIds: string[], take = 4) {
  const related = await db.product.findMany({
    where: { published: true, id: { not: productId }, categories: { some: { id: { in: categoryIds } } } },
    orderBy: { soldCount: "desc" },
    select: productCardSelect,
    take,
  });
  if (related.length >= take) return related;
  const fill = await db.product.findMany({
    where: { published: true, id: { notIn: [productId, ...related.map((r) => r.id)] } },
    orderBy: { soldCount: "desc" },
    select: productCardSelect,
    take: take - related.length,
  });
  return [...related, ...fill];
}

// ─── Gift boxes ───────────────────────────────────────────

const giftBoxInclude = {
  items: {
    include: {
      product: { select: { id: true, name: true, slug: true, price: true, images: true, published: true } },
      variant: { select: { id: true, color: true, stock: true } },
    },
  },
} satisfies Prisma.GiftBoxInclude;

export type GiftBoxWithItems = Prisma.GiftBoxGetPayload<{ include: typeof giftBoxInclude }>;

export function giftBoxValue(box: GiftBoxWithItems) {
  const separate = box.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const savings = Math.max(0, separate - box.price);
  const stock = box.items.length ? Math.min(...box.items.map((i) => Math.floor(i.variant.stock / Math.max(1, i.quantity)))) : 0;
  return { separate, savings, savingsPercent: separate > 0 ? Math.round((savings / separate) * 100) : 0, stock };
}

export async function getGiftBoxes(take?: number) {
  return db.giftBox.findMany({ where: { published: true }, orderBy: [{ soldCount: "desc" }, { createdAt: "desc" }], include: giftBoxInclude, take });
}

export const getGiftBoxBySlug = cache(async (slug: string) =>
  db.giftBox.findFirst({ where: { slug, published: true }, include: giftBoxInclude }),
);
