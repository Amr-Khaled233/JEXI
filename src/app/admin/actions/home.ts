"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export type HomeResult = { error?: string; success?: string };

// Buttons can point to a page on this site ("/shop") or a full https link.
const link = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || /^\/(?!\/)[^\s<>"']*$/.test(v) || /^https:\/\/[^\s<>"']+$/.test(v), "Links must start with / (a page on this site) or https://");
const imagePath = z
  .string()
  .max(500)
  .regex(/^(\/(?!\/)|https:\/\/)[^\s<>"'\\]+$/, "Invalid image");
const text = (max: number) => z.string().trim().max(max);

const homeSchema = z.object({
  heroImage: imagePath.nullable(),
  heroTagline: text(160),
  heroPrimaryLabel: text(40),
  heroPrimaryHref: link,
  heroSecondaryLabel: text(40),
  heroSecondaryHref: link,
  showCategories: z.boolean(),
  showBestSellers: z.boolean(),
  bestSellersEyebrow: text(40),
  bestSellersTitle: text(60),
  bestSellerIds: z.array(z.string().min(1).max(64)).max(8, "Pick up to 8 best sellers."),
  showGiftBox: z.boolean(),
  featuredGiftBoxId: z.string().max(64).nullable(),
  showNewArrivals: z.boolean(),
  newArrivalsEyebrow: text(40),
  newArrivalsTitle: text(60),
  newArrivalIds: z.array(z.string().min(1).max(64)).max(8, "Pick up to 8 new arrivals."),
  showPromises: z.boolean(),
});

export type HomePayload = z.input<typeof homeSchema>;

export async function saveHomePageAction(payload: HomePayload): Promise<HomeResult> {
  await requireAdmin();
  const parsed = homeSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const h = parsed.data;
  if (h.heroPrimaryLabel && !h.heroPrimaryHref) return { error: "Add a link for the first button." };
  if (h.heroSecondaryLabel && !h.heroSecondaryHref) return { error: "Add a link for the second button." };

  const data = {
    ...h,
    bestSellersTitle: h.bestSellersTitle || "Best Sellers",
    newArrivalsTitle: h.newArrivalsTitle || "New Arrivals",
    bestSellerIds: [...new Set(h.bestSellerIds)],
    newArrivalIds: [...new Set(h.newArrivalIds)],
  };
  await db.homePage.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
  revalidatePath("/");
  return { success: "Home page saved." };
}
