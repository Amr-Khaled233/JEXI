"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { hashPassword, requireAdmin, requireOwner, startSession, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseMoneyInput, toMinor } from "@/lib/money";

export type ActionResult = { error?: string; success?: string } | undefined;

// ─── Promo codes ──────────────────────────────────────────

const promoSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Code must be at least 3 characters.")
      .max(30)
      .regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, dashes or underscores only."),
    description: z.string().trim().max(200).optional(),
    discountType: z.enum(["PERCENTAGE", "FIXED"]),
    value: z.number().positive("Discount value must be greater than zero."),
    startsAt: z.iso.datetime({ message: "Choose a start date." }),
    endsAt: z.iso.datetime({ message: "Choose an end date." }),
    usageLimit: z.number().int().positive().nullable(),
    perCustomerLimit: z.number().int().positive().nullable(),
    minOrderValue: z.number().positive().nullable(),
    scope: z.enum(["ALL", "CATEGORY", "PRODUCTS"]),
    categoryIds: z.array(z.string()),
    productIds: z.array(z.string()),
    active: z.boolean(),
  })
  .refine((p) => p.discountType !== "PERCENTAGE" || p.value <= 100, { message: "A percentage discount can't exceed 100%." })
  .refine((p) => new Date(p.endsAt) > new Date(p.startsAt), { message: "The end date must be after the start date." })
  .refine((p) => p.scope !== "CATEGORY" || p.categoryIds.length > 0, { message: "Choose at least one category." })
  .refine((p) => p.scope !== "PRODUCTS" || p.productIds.length > 0, { message: "Choose at least one product." });

export type PromoPayload = z.input<typeof promoSchema>;

export async function savePromoCodeAction(id: string | null, payload: PromoPayload): Promise<ActionResult> {
  await requireAdmin();
  const parsed = promoSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const p = parsed.data;

  const data = {
    code: p.code.toUpperCase(),
    description: p.description || null,
    discountType: p.discountType,
    value: p.discountType === "PERCENTAGE" ? Math.round(p.value) : toMinor(p.value),
    startsAt: new Date(p.startsAt),
    endsAt: new Date(p.endsAt),
    usageLimit: p.usageLimit,
    perCustomerLimit: p.perCustomerLimit,
    minOrderValue: p.minOrderValue != null ? toMinor(p.minOrderValue) : null,
    scope: p.scope,
    active: p.active,
  };
  const categories = p.scope === "CATEGORY" ? p.categoryIds.map((cid) => ({ id: cid })) : [];
  const products = p.scope === "PRODUCTS" ? p.productIds.map((pid) => ({ id: pid })) : [];

  try {
    if (id) await db.promoCode.update({ where: { id }, data: { ...data, categories: { set: categories }, products: { set: products } } });
    else await db.promoCode.create({ data: { ...data, categories: { connect: categories }, products: { connect: products } } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return { error: "This code already exists." };
    throw err;
  }
  revalidatePath("/admin/promo-codes");
  redirect("/admin/promo-codes");
}

export async function togglePromoCodeAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const promo = await db.promoCode.findUnique({ where: { id }, select: { active: true } });
  if (!promo) return;
  await db.promoCode.update({ where: { id }, data: { active: !promo.active } });
  revalidatePath("/admin/promo-codes");
}

export async function deletePromoCodeAction(id: string) {
  await requireAdmin();
  await db.promoCode.delete({ where: { id } });
  revalidatePath("/admin/promo-codes");
  redirect("/admin/promo-codes");
}

// ─── Shipping zones ───────────────────────────────────────

export async function updateShippingZoneAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id"));
  const feeRaw = String(formData.get("fee") ?? "").trim();
  const fee = feeRaw === "" ? null : parseMoneyInput(feeRaw);
  if (feeRaw !== "" && fee == null) return { error: "Invalid fee." };
  await db.shippingZone.update({
    where: { id },
    data: {
      enabled: formData.get("enabled") === "on",
      fee,
      estimatedDelivery: String(formData.get("estimatedDelivery") ?? "").trim().slice(0, 60) || null,
    },
  });
  revalidatePath("/admin/shipping");
  return { success: "Saved" };
}

export async function toggleShippingZoneAction(id: string, enabled: boolean) {
  await requireAdmin();
  await db.shippingZone.update({ where: { id }, data: { enabled } });
  revalidatePath("/admin/shipping");
}

export async function setAllShippingZonesAction(formData: FormData) {
  await requireAdmin();
  await db.shippingZone.updateMany({ data: { enabled: formData.get("enabled") === "true" } });
  revalidatePath("/admin/shipping");
}

// ─── Settings ─────────────────────────────────────────────

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((s) => s || null);

const settingsSchema = z.object({
  storeName: z.string().trim().min(1).max(80),
  tagline: optionalText(200),
  announcement: optionalText(160),
  contactEmail: optionalText(200).refine((v) => !v || z.email().safeParse(v).success, "Invalid contact email."),
  contactPhone: optionalText(30),
  whatsapp: optionalText(30),
  instagram: optionalText(60),
  notificationEmail: optionalText(200).refine((v) => !v || z.email().safeParse(v).success, "Invalid notification email."),
  defaultTheme: z.enum(["dark", "light", "system"]),
  lowStockThreshold: z.coerce.number().int().min(0).max(1000),
});

export async function saveSettingsAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const thresholdRaw = String(formData.get("freeShippingThreshold") ?? "").trim();
  const threshold = thresholdRaw ? parseMoneyInput(thresholdRaw) : null;
  if (thresholdRaw && threshold == null) return { error: "Invalid free-shipping threshold." };
  const defaultFee = parseMoneyInput(String(formData.get("defaultShippingFee") ?? "0")) ?? 0;

  await db.storeSettings.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {
      ...parsed.data,
      freeShippingEnabled: formData.get("freeShippingEnabled") === "on",
      freeShippingThreshold: threshold,
      defaultShippingFee: defaultFee,
    },
  });
  revalidatePath("/", "layout");
  return { success: "Settings saved." };
}

// ─── Admin users ──────────────────────────────────────────

const adminSchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(80),
  email: z.email("Invalid email.").transform((e) => e.toLowerCase()),
  password: z.string().min(10, "Password must be at least 10 characters."),
  role: z.enum(["OWNER", "STAFF"]),
});

export async function createAdminAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireOwner();
  } catch {
    return { error: "Only the store owner can add admins." };
  }
  const parsed = adminSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { password, ...rest } = parsed.data;
  if (await db.adminUser.findUnique({ where: { email: rest.email } })) return { error: "An admin with this email already exists." };
  await db.adminUser.create({ data: { ...rest, passwordHash: await hashPassword(password) } });
  revalidatePath("/admin/settings");
  return { success: `${rest.name} can now sign in.` };
}

export async function deleteAdminAction(formData: FormData) {
  const me = await requireOwner();
  const id = String(formData.get("id"));
  if (id === me.id) return;
  await db.adminUser.delete({ where: { id } });
  revalidatePath("/admin/settings");
}

export async function changePasswordAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  if (next.length < 10) return { error: "New password must be at least 10 characters." };
  const admin = await db.adminUser.findUnique({ where: { id: me.id } });
  if (!admin || !(await verifyPassword(current, admin.passwordHash))) return { error: "Current password is incorrect." };
  // Bumping the version signs out every other session; re-issue this one so you stay signed in.
  const updated = await db.adminUser.update({
    where: { id: me.id },
    data: { passwordHash: await hashPassword(next), sessionVersion: { increment: 1 } },
  });
  await startSession("admin", me.id, updated.sessionVersion);
  return { success: "Password updated. Other devices have been signed out." };
}
