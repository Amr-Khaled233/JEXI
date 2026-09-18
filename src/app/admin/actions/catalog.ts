"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth";
import { COLOR_KEYS, TAG_KEYS } from "@/lib/constants";
import { db } from "@/lib/db";
import { toMinor } from "@/lib/money";
import { slugify } from "@/lib/utils";

export type ActionResult = { error?: string; success?: string } | undefined;

function uniqueError(err: unknown, labels: Record<string, string>): string | null {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    const target = JSON.stringify(err.meta ?? {});
    for (const [field, label] of Object.entries(labels)) if (target.includes(field)) return `${label} is already in use.`;
    return "A record with these details already exists.";
  }
  return null;
}

// Site-relative paths ("/samples/a.webp") or https URLs. Rejects protocol-relative "//host" URLs.
const imagePath = z
  .string()
  .max(500)
  .regex(/^(\/(?!\/)|https:\/\/)[^\s<>"'\\]+$/, "Invalid image URL");

// ─── Products ─────────────────────────────────────────────

const productSchema = z
  .object({
    name: z.string().trim().min(2, "Name is required.").max(120),
    slug: z.string().trim().max(80).optional(),
    sku: z.string().trim().min(1, "SKU is required.").max(40),
    description: z.string().trim().max(5000),
    price: z.number().positive("Price must be greater than zero."),
    compareAtPrice: z.number().positive().nullable(),
    categoryIds: z.array(z.string()).max(20),
    tags: z.array(z.enum(TAG_KEYS as [string, ...string[]])),
    published: z.boolean(),
    images: z.array(imagePath).max(10),
    variants: z
      .array(z.object({ color: z.enum(COLOR_KEYS as [string, ...string[]]), stock: z.number().int().min(0).max(100000), sku: z.string().trim().max(40).optional() }))
      .min(1, "Add at least one color variant."),
  })
  .refine((p) => p.compareAtPrice == null || p.compareAtPrice > p.price, { message: "Compare-at price must be higher than the price.", path: ["compareAtPrice"] })
  .refine((p) => !p.published || p.images.length > 0, { message: "Add at least one image before publishing.", path: ["images"] });

export type ProductPayload = z.input<typeof productSchema>;

export async function saveProductAction(id: string | null, payload: ProductPayload): Promise<ActionResult> {
  await requireAdmin();
  const parsed = productSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const p = parsed.data;
  const slug = slugify(p.slug || p.name);
  if (!slug) return { error: "Please enter a valid URL slug." };

  const data = {
    name: p.name,
    slug,
    sku: p.sku.toUpperCase(),
    description: p.description,
    price: toMinor(p.price),
    compareAtPrice: p.compareAtPrice != null ? toMinor(p.compareAtPrice) : null,
    tags: p.tags as ("BEST_SELLER" | "NEW" | "SALE")[],
    published: p.published,
    images: p.images,
  };
  const variants = p.variants.map((v) => ({ color: v.color as "GOLD" | "SILVER" | "ROSE_GOLD", stock: v.stock, sku: v.sku ? v.sku.toUpperCase() : null }));

  let productId = id;
  try {
    if (id) {
      await db.$transaction(async (tx) => {
        await tx.product.update({ where: { id }, data: { ...data, categories: { set: p.categoryIds.map((cid) => ({ id: cid })) } } });
        await tx.variant.deleteMany({ where: { productId: id, color: { notIn: variants.map((v) => v.color) } } });
        for (const v of variants) {
          await tx.variant.upsert({
            where: { productId_color: { productId: id, color: v.color } },
            create: { productId: id, ...v },
            update: { stock: v.stock, sku: v.sku },
          });
        }
      });
    } else {
      const created = await db.product.create({
        data: { ...data, categories: { connect: p.categoryIds.map((cid) => ({ id: cid })) }, variants: { create: variants } },
      });
      productId = created.id;
    }
  } catch (err) {
    const msg = uniqueError(err, { slug: "This URL slug", sku: "This SKU" });
    if (msg) return { error: msg };
    throw err;
  }

  revalidatePath("/", "layout");
  redirect(`/admin/products?saved=${productId}`);
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.product.delete({ where: { id } });
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function toggleProductPublishedAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const product = await db.product.findUnique({ where: { id }, select: { published: true, images: true } });
  if (!product || (!product.published && product.images.length === 0)) return;
  await db.product.update({ where: { id }, data: { published: !product.published } });
  revalidatePath("/", "layout");
}

// ─── Gift boxes ───────────────────────────────────────────

const giftBoxSchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(120),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().max(5000),
  coverImage: imagePath.or(z.literal("")),
  price: z.number().positive("Bundle price must be greater than zero."),
  published: z.boolean(),
  items: z
    .array(z.object({ productId: z.string().min(1), variantId: z.string().min(1, "Choose a color for every item."), quantity: z.number().int().min(1).max(10) }))
    .min(2, "A gift box needs at least two items."),
});

export type GiftBoxPayload = z.input<typeof giftBoxSchema>;

export async function saveGiftBoxAction(id: string | null, payload: GiftBoxPayload): Promise<ActionResult> {
  await requireAdmin();
  const parsed = giftBoxSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const g = parsed.data;
  if (!g.coverImage) return { error: "Please add a cover image." };
  const slug = slugify(g.slug || g.name);

  // Make sure each variant belongs to its product.
  const variants = await db.variant.findMany({ where: { id: { in: g.items.map((i) => i.variantId) } }, select: { id: true, productId: true } });
  const owner = new Map(variants.map((v) => [v.id, v.productId]));
  if (g.items.some((i) => owner.get(i.variantId) !== i.productId)) return { error: "One of the selected colors doesn't match its product." };

  const data = { name: g.name, slug, description: g.description, coverImage: g.coverImage, price: toMinor(g.price), published: g.published };
  try {
    if (id) {
      await db.$transaction([
        db.giftBoxItem.deleteMany({ where: { giftBoxId: id } }),
        db.giftBox.update({ where: { id }, data: { ...data, items: { create: g.items } } }),
      ]);
    } else {
      await db.giftBox.create({ data: { ...data, items: { create: g.items } } });
    }
  } catch (err) {
    const msg = uniqueError(err, { slug: "This URL slug" });
    if (msg) return { error: msg };
    throw err;
  }
  revalidatePath("/", "layout");
  redirect("/admin/gift-boxes");
}

export async function deleteGiftBoxAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.giftBox.delete({ where: { id } });
  revalidatePath("/", "layout");
  redirect("/admin/gift-boxes");
}

// ─── Categories ───────────────────────────────────────────

const categorySchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(60),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().max(500).optional(),
  image: imagePath.or(z.literal("")).optional(),
});

export async function saveCategoryAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = formData.get("id") ? String(formData.get("id")) : null;
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const c = parsed.data;
  const data = { name: c.name, slug: slugify(c.slug || c.name), description: c.description || null, image: c.image || null };

  try {
    if (id) await db.category.update({ where: { id }, data });
    else {
      const last = await db.category.aggregate({ _max: { sortOrder: true } });
      await db.category.create({ data: { ...data, sortOrder: (last._max.sortOrder ?? -1) + 1 } });
    }
  } catch (err) {
    const msg = uniqueError(err, { slug: "This URL slug" });
    if (msg) return { error: msg };
    throw err;
  }
  revalidatePath("/", "layout");
  return { success: id ? "Category saved." : "Category added." };
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  await db.category.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/", "layout");
}

export async function moveCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const dir = formData.get("dir") === "up" ? -1 : 1;
  const all = await db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true } });
  const i = all.findIndex((c) => c.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= all.length) return;
  [all[i], all[j]] = [all[j], all[i]];
  await db.$transaction(all.map((c, index) => db.category.update({ where: { id: c.id }, data: { sortOrder: index } })));
  revalidatePath("/", "layout");
}
