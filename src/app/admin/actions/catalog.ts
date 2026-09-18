"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth";
import type { TagKey } from "@/lib/constants";
import { db } from "@/lib/db";
import { toMinor } from "@/lib/money";
import { uniqueSlug } from "@/lib/slug";

export type ActionResult = { error?: string; success?: string } | undefined;

// Site-relative paths ("/samples/a.webp") or https URLs. Rejects protocol-relative "//host" URLs.
const imagePath = z
  .string()
  .max(500)
  .regex(/^(\/(?!\/)|https:\/\/)[^\s<>"'\\]+$/, "Invalid image URL");

function uniqueError(err: unknown, message: string): string | null {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002" ? message : null;
}

// ─── Products ─────────────────────────────────────────────

const productSchema = z
  .object({
    name: z.string().trim().min(2, "Name is required.").max(120),
    description: z.string().trim().max(5000),
    price: z.number().positive("Price must be greater than zero."),
    salePrice: z.number().positive().nullable(),
    categoryIds: z.array(z.string()).max(20),
    tags: z.array(z.enum(["BEST_SELLER", "NEW", "SALE"])),
    published: z.boolean(),
    images: z.array(imagePath).max(10),
    variants: z.array(z.object({ colorId: z.string().min(1), stock: z.number().int().min(0).max(100000) })).min(1, "Add at least one color."),
  })
  .refine((p) => p.salePrice == null || p.salePrice < p.price, { message: "The sale price must be lower than the regular price.", path: ["salePrice"] })
  .refine((p) => !p.published || p.images.length > 0, { message: "Add at least one image before publishing.", path: ["images"] })
  .refine((p) => new Set(p.variants.map((v) => v.colorId)).size === p.variants.length, { message: "Each color can only be added once." });

export type ProductPayload = z.input<typeof productSchema>;

export async function saveProductAction(id: string | null, payload: ProductPayload): Promise<ActionResult> {
  await requireAdmin();
  const parsed = productSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const p = parsed.data;

  // "Price" is the regular price; an optional sale price becomes the selling price
  // and the regular price is shown struck through. The Sale tag follows automatically.
  const onSale = p.salePrice != null;
  const tags: TagKey[] = p.tags.filter((t) => t !== "SALE");
  if (onSale) tags.push("SALE");
  const data = {
    name: p.name,
    description: p.description,
    price: toMinor(onSale ? p.salePrice! : p.price),
    compareAtPrice: onSale ? toMinor(p.price) : null,
    tags,
    published: p.published,
    images: p.images,
  };

  let productId = id;
  if (id) {
    await db.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data: { ...data, categories: { set: p.categoryIds.map((cid) => ({ id: cid })) } } });
      await tx.variant.deleteMany({ where: { productId: id, colorId: { notIn: p.variants.map((v) => v.colorId) } } });
      for (const v of p.variants) {
        await tx.variant.upsert({
          where: { productId_colorId: { productId: id, colorId: v.colorId } },
          create: { productId: id, colorId: v.colorId, stock: v.stock },
          update: { stock: v.stock },
        });
      }
    });
  } else {
    const created = await db.product.create({
      data: {
        ...data,
        slug: await uniqueSlug("product", p.name),
        categories: { connect: p.categoryIds.map((cid) => ({ id: cid })) },
        variants: { create: p.variants.map((v) => ({ colorId: v.colorId, stock: v.stock })) },
      },
    });
    productId = created.id;
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

// ─── Colors ───────────────────────────────────────────────

const colorSchema = z.object({
  name: z.string().trim().min(2, "Color name is required.").max(40),
  hex: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Pick a color."),
});

export type ColorResult = { error?: string; color?: { id: string; name: string; slug: string; hex: string } };

/** Used from the product form to add a new color on the spot. */
export async function createColorAction(input: { name: string; hex: string }): Promise<ColorResult> {
  await requireAdmin();
  const parsed = colorSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    const last = await db.color.aggregate({ _max: { sortOrder: true } });
    const color = await db.color.create({
      data: { name: parsed.data.name, hex: parsed.data.hex.toLowerCase(), slug: await uniqueSlug("color", parsed.data.name), sortOrder: (last._max.sortOrder ?? -1) + 1 },
      select: { id: true, name: true, slug: true, hex: true },
    });
    revalidatePath("/", "layout");
    return { color };
  } catch (err) {
    const msg = uniqueError(err, "A color with this name already exists.");
    if (msg) return { error: msg };
    throw err;
  }
}

export async function saveColorAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = formData.get("id") ? String(formData.get("id")) : null;
  const parsed = colorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    if (id) await db.color.update({ where: { id }, data: { name: parsed.data.name, hex: parsed.data.hex.toLowerCase() } });
    else {
      const res = await createColorAction(parsed.data);
      if (res.error) return { error: res.error };
    }
  } catch (err) {
    const msg = uniqueError(err, "A color with this name already exists.");
    if (msg) return { error: msg };
    throw err;
  }
  revalidatePath("/", "layout");
  return { success: id ? "Color saved." : "Color added." };
}

export async function deleteColorAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id"));
  const inUse = await db.variant.count({ where: { colorId: id } });
  if (inUse > 0) return { error: `This color is used by ${inUse} product ${inUse === 1 ? "variant" : "variants"}. Remove it from those products first.` };
  await db.color.delete({ where: { id } });
  revalidatePath("/", "layout");
  return { success: "Color deleted." };
}

// ─── Gift boxes ───────────────────────────────────────────

const giftBoxSchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(120),
  description: z.string().trim().max(5000),
  coverImage: imagePath.or(z.literal("")),
  price: z.number().positive("Bundle price must be greater than zero."),
  published: z.boolean(),
  items: z
    .array(z.object({ productId: z.string().min(1, "Choose a product for every item."), variantId: z.string().min(1, "Choose a color for every item."), quantity: z.number().int().min(1).max(10) }))
    .min(2, "A gift box needs at least two items."),
});

export type GiftBoxPayload = z.input<typeof giftBoxSchema>;

export async function saveGiftBoxAction(id: string | null, payload: GiftBoxPayload): Promise<ActionResult> {
  await requireAdmin();
  const parsed = giftBoxSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const g = parsed.data;
  if (!g.coverImage) return { error: "Please add a cover image." };

  // Make sure each variant belongs to its product.
  const variants = await db.variant.findMany({ where: { id: { in: g.items.map((i) => i.variantId) } }, select: { id: true, productId: true } });
  const owner = new Map(variants.map((v) => [v.id, v.productId]));
  if (g.items.some((i) => owner.get(i.variantId) !== i.productId)) return { error: "One of the selected colors doesn't match its product." };

  const data = { name: g.name, description: g.description, coverImage: g.coverImage, price: toMinor(g.price), published: g.published };
  if (id) {
    await db.$transaction([db.giftBoxItem.deleteMany({ where: { giftBoxId: id } }), db.giftBox.update({ where: { id }, data: { ...data, items: { create: g.items } } })]);
  } else {
    await db.giftBox.create({ data: { ...data, slug: await uniqueSlug("giftBox", g.name), items: { create: g.items } } });
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
  description: z.string().trim().max(500).optional(),
  image: imagePath.or(z.literal("")).optional(),
});

export async function saveCategoryAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = formData.get("id") ? String(formData.get("id")) : null;
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const c = parsed.data;
  const data = { name: c.name, description: c.description || null, image: c.image || null };

  if (id) await db.category.update({ where: { id }, data });
  else {
    const last = await db.category.aggregate({ _max: { sortOrder: true } });
    await db.category.create({ data: { ...data, slug: await uniqueSlug("category", c.name), sortOrder: (last._max.sortOrder ?? -1) + 1 } });
  }
  revalidatePath("/", "layout");
  return { success: id ? "Category saved." : "Category added." };
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  // Products in the category stay in the store; they're just no longer listed under it.
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
