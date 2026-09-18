import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";

type DbClient = typeof db | Prisma.TransactionClient;

export type PromoStatus = "ACTIVE" | "SCHEDULED" | "EXPIRED" | "EXHAUSTED" | "INACTIVE";

export const PROMO_STATUS_LABELS: Record<PromoStatus, string> = {
  ACTIVE: "Active",
  SCHEDULED: "Scheduled",
  EXPIRED: "Expired",
  EXHAUSTED: "Limit reached",
  INACTIVE: "Inactive",
};

/**
 * Effective status. Codes auto-expire after `endsAt` and auto-disable once
 * `usedCount` reaches `usageLimit` — no background job needed.
 */
export function promoStatus(
  p: { active: boolean; startsAt: Date; endsAt: Date; usageLimit: number | null; usedCount: number },
  now = new Date(),
): PromoStatus {
  if (!p.active) return "INACTIVE";
  if (p.usageLimit != null && p.usedCount >= p.usageLimit) return "EXHAUSTED";
  if (now > p.endsAt) return "EXPIRED";
  if (now < p.startsAt) return "SCHEDULED";
  return "ACTIVE";
}

export type PromoLine = {
  kind: "product" | "giftbox";
  productId?: string;
  categoryIds: string[];
  lineTotal: number;
};

export type PromoResult = {
  code: string;
  applied: boolean;
  discount: number;
  message: string;
  promoId?: string;
};

type PromoWithScope = Prisma.PromoCodeGetPayload<{ include: { categories: { select: { id: true } }; products: { select: { id: true } } } }>;

export function calculateDiscount(promo: PromoWithScope, lines: PromoLine[]) {
  const categoryIds = new Set(promo.categories.map((c) => c.id));
  const productIds = new Set(promo.products.map((p) => p.id));

  const eligible = lines.filter((line) => {
    if (promo.scope === "ALL") return true;
    if (line.kind !== "product") return false; // scoped codes apply to individual pieces only
    if (promo.scope === "CATEGORY") return line.categoryIds.some((id) => categoryIds.has(id));
    return line.productId != null && productIds.has(line.productId);
  });
  const eligibleSubtotal = eligible.reduce((sum, l) => sum + l.lineTotal, 0);

  const discount =
    promo.discountType === "PERCENTAGE"
      ? Math.round((eligibleSubtotal * Math.min(promo.value, 100)) / 100)
      : Math.min(promo.value, eligibleSubtotal);

  return { eligibleSubtotal, discount };
}

export async function evaluatePromo(
  rawCode: string,
  lines: PromoLine[],
  subtotal: number,
  customer?: { email?: string | null; phone?: string | null },
  client: DbClient = db,
): Promise<PromoResult> {
  const code = rawCode.trim().toUpperCase();
  const fail = (message: string): PromoResult => ({ code, applied: false, discount: 0, message });
  if (!code) return fail("Enter a promo code.");

  const promo = await client.promoCode.findUnique({
    where: { code },
    include: { categories: { select: { id: true } }, products: { select: { id: true } } },
  });
  if (!promo) return fail("This promo code doesn't exist.");

  switch (promoStatus(promo)) {
    case "INACTIVE":
      return fail("This promo code is not active.");
    case "SCHEDULED":
      return fail("This promo code isn't active yet.");
    case "EXPIRED":
      return fail("This promo code has expired.");
    case "EXHAUSTED":
      return fail("This promo code has reached its usage limit.");
  }

  if (promo.minOrderValue != null && subtotal < promo.minOrderValue) {
    return fail(`Spend at least ${formatMoney(promo.minOrderValue)} to use this code.`);
  }

  const email = customer?.email?.trim().toLowerCase();
  const phone = customer?.phone?.trim();
  if (promo.perCustomerLimit != null && (email || phone)) {
    const used = await client.order.count({
      where: {
        promoCodeId: promo.id,
        status: { not: "CANCELLED" },
        OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
      },
    });
    if (used >= promo.perCustomerLimit) return fail("You've already used this promo code the maximum number of times.");
  }

  const { eligibleSubtotal, discount } = calculateDiscount(promo, lines);
  if (eligibleSubtotal === 0 || discount === 0) return fail("This code doesn't apply to the items in your cart.");

  const what = promo.discountType === "PERCENTAGE" ? `${promo.value}% off` : `${formatMoney(promo.value)} off`;
  const scope = promo.scope === "ALL" ? "" : " eligible items";
  return { code, applied: true, discount, promoId: promo.id, message: `${what}${scope} applied.` };
}
