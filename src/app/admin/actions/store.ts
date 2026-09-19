"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { hashPassword, requireAdmin, requireOwner } from "@/lib/auth";
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
    active: z.boolean(),
  })
  .refine((p) => p.discountType !== "PERCENTAGE" || p.value <= 100, { message: "A percentage discount can't exceed 100%." })
  .refine((p) => new Date(p.endsAt) > new Date(p.startsAt), { message: "The end date must be after the start date." })
;

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
    active: p.active,
  };

  try {
    if (id) await db.promoCode.update({ where: { id }, data });
    else await db.promoCode.create({ data });
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

const socialHandle = optionalText(200).refine(
  (v) => !v || /^(@?[\w.-]{1,100}|https:\/\/[^\s<>"']+)$/.test(v),
  "Enter a username (like jexi.accessories) or a full https link.",
);

const settingsSchema = z.object({
  storeName: z.string().trim().min(1).max(80),
  tagline: optionalText(200),
  announcement: optionalText(160),
  contactEmail: optionalText(200).refine((v) => !v || z.email().safeParse(v).success, "Invalid contact email."),
  contactPhone: optionalText(30),
  whatsapp: optionalText(30),
  instagram: socialHandle,
  facebook: socialHandle,
  tiktok: socialHandle,
  notificationEmail: optionalText(200).refine((v) => !v || z.email().safeParse(v).success, "Invalid notification email."),
  defaultTheme: z.enum(["dark", "light", "system"]),
  lowStockThreshold: z.coerce.number().int().min(0).max(1000),
});

export async function saveSettingsAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // New-order alerts contain customer details, so only the Owner decides where they go.
  const current = await db.storeSettings.findUnique({ where: { id: 1 }, select: { notificationEmail: true } });
  if (me.role !== "OWNER" && parsed.data.notificationEmail !== (current?.notificationEmail ?? null)) {
    return { error: "Only the store owner can change the notification email." };
  }

  await db.storeSettings.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {
      ...parsed.data,
      showInstagram: formData.get("showInstagram") === "on",
      showFacebook: formData.get("showFacebook") === "on",
      showTiktok: formData.get("showTiktok") === "on",
    },
  });
  revalidatePath("/", "layout");
  return { success: "Settings saved." };
}

// ─── Free shipping ────────────────────────────────────────

const freeShippingSchema = z
  .object({
    enabled: z.boolean(),
    startsAt: z.iso.datetime().nullable(),
    endsAt: z.iso.datetime().nullable(),
    minimum: z.number().positive("The minimum order must be greater than zero.").nullable(),
  })
  .refine((f) => !f.startsAt || !f.endsAt || new Date(f.endsAt) > new Date(f.startsAt), { message: "The end date must be after the start date." });

export type FreeShippingPayload = z.input<typeof freeShippingSchema>;

export async function saveFreeShippingAction(payload: FreeShippingPayload): Promise<ActionResult> {
  await requireAdmin();
  const parsed = freeShippingSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const f = parsed.data;
  await db.storeSettings.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {
      freeShippingEnabled: f.enabled,
      freeShippingStartsAt: f.startsAt ? new Date(f.startsAt) : null,
      freeShippingEndsAt: f.endsAt ? new Date(f.endsAt) : null,
      freeShippingThreshold: f.minimum != null ? toMinor(f.minimum) : null,
    },
  });
  revalidatePath("/", "layout");
  return { success: "Free shipping saved." };
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
