import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { evaluatePromo, type PromoResult } from "@/lib/promo";
import { getSettings } from "@/lib/settings";
import { computeShipping, type ShippingQuote } from "@/lib/shipping";

type DbClient = typeof db | Prisma.TransactionClient;

export const MAX_LINE_QUANTITY = 20;

export type CartItemInput =
  | { kind: "product"; variantId: string; quantity: number }
  | { kind: "giftbox"; giftBoxId: string; quantity: number };

export type QuoteInput = {
  items: CartItemInput[];
  promoCode?: string | null;
  governorate?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
};

export type GiftBoxContent = {
  productId: string;
  variantId: string;
  name: string;
  /** Color name, e.g. "Gold". */
  color: string;
  quantity: number;
};

export type QuoteLine = {
  key: string;
  kind: "product" | "giftbox";
  name: string;
  href: string;
  image: string | null;
  colorName: string | null;
  colorHex: string | null;
  unitPrice: number;
  /** Strikethrough price: the regular price for products on sale, the "bought separately" value for gift boxes. */
  compareAtPrice: number | null;
  quantity: number;
  lineTotal: number;
  maxQuantity: number;
  available: boolean;
  issue: string | null;
  productId?: string;
  variantId?: string;
  giftBoxId?: string;
  contents?: GiftBoxContent[];
};

export type Quote = {
  lines: QuoteLine[];
  itemCount: number;
  subtotal: number;
  discount: number;
  shipping: ShippingQuote;
  total: number;
  promo: PromoResult | null;
  issues: string[];
};

export function lineKey(item: CartItemInput) {
  return item.kind === "product" ? `p:${item.variantId}` : `g:${item.giftBoxId}`;
}

/** Merge duplicates, clamp quantities and drop malformed entries. */
function normalizeItems(items: CartItemInput[]): CartItemInput[] {
  const merged = new Map<string, CartItemInput>();
  for (const raw of items ?? []) {
    if (!raw || (raw.kind !== "product" && raw.kind !== "giftbox")) continue;
    const id = raw.kind === "product" ? raw.variantId : raw.giftBoxId;
    if (typeof id !== "string" || !id) continue;
    const qty = Math.floor(Number(raw.quantity));
    if (!Number.isFinite(qty) || qty < 1) continue;
    const key = lineKey(raw);
    const existing = merged.get(key);
    const quantity = Math.min(MAX_LINE_QUANTITY, (existing?.quantity ?? 0) + qty);
    merged.set(key, { ...raw, quantity });
  }
  return [...merged.values()];
}

/**
 * The single source of truth for cart totals. Prices, stock, promo codes and
 * shipping are always read from the database, never trusted from the client.
 */
export async function quoteCart(input: QuoteInput, client: DbClient = db): Promise<Quote> {
  const settings = await getSettings();
  const items = normalizeItems(input.items);

  const variantIds = items.flatMap((i) => (i.kind === "product" ? [i.variantId] : []));
  const giftBoxIds = items.flatMap((i) => (i.kind === "giftbox" ? [i.giftBoxId] : []));

  const [variants, giftBoxes] = await Promise.all([
    variantIds.length ? client.variant.findMany({ where: { id: { in: variantIds } }, include: { product: true, color: true } }) : [],
    giftBoxIds.length
      ? client.giftBox.findMany({
          where: { id: { in: giftBoxIds } },
          include: { items: { include: { product: true, variant: { include: { color: true } } } } },
        })
      : [],
  ]);
  const variantById = new Map(variants.map((v) => [v.id, v]));
  const giftBoxById = new Map(giftBoxes.map((g) => [g.id, g]));

  const lines: QuoteLine[] = [];
  for (const item of items) {
    const key = lineKey(item);
    if (item.kind === "product") {
      const v = variantById.get(item.variantId);
      if (!v || !v.product.published) {
        lines.push(unavailableLine(key, "product", "This item is no longer available."));
        continue;
      }
      const p = v.product;
      const issue = v.stock <= 0 ? "Sold out in this color." : v.stock < item.quantity ? `Only ${v.stock} left in stock.` : null;
      lines.push({
        key,
        kind: "product",
        name: p.name,
        href: `/product/${p.slug}`,
        image: p.images[0] ?? null,
        colorName: v.color.name,
        colorHex: v.color.hex,
        unitPrice: p.price,
        compareAtPrice: p.compareAtPrice != null && p.compareAtPrice > p.price ? p.compareAtPrice : null,
        quantity: item.quantity,
        lineTotal: p.price * item.quantity,
        maxQuantity: Math.max(0, Math.min(v.stock, MAX_LINE_QUANTITY)),
        available: v.stock > 0,
        issue,
        productId: p.id,
        variantId: v.id,
      });
    } else {
      const g = giftBoxById.get(item.giftBoxId);
      if (!g || !g.published || g.items.length === 0) {
        lines.push(unavailableLine(key, "giftbox", "This gift box is no longer available."));
        continue;
      }
      const maxBoxes = Math.min(...g.items.map((i) => Math.floor(i.variant.stock / Math.max(1, i.quantity))));
      const separateValue = g.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
      const issue = maxBoxes <= 0 ? "This gift box is sold out." : maxBoxes < item.quantity ? `Only ${maxBoxes} left in stock.` : null;
      lines.push({
        key,
        kind: "giftbox",
        name: g.name,
        href: `/gift-boxes/${g.slug}`,
        image: g.coverImage,
        colorName: null,
        colorHex: null,
        unitPrice: g.price,
        compareAtPrice: separateValue > g.price ? separateValue : null,
        quantity: item.quantity,
        lineTotal: g.price * item.quantity,
        maxQuantity: Math.max(0, Math.min(maxBoxes, MAX_LINE_QUANTITY)),
        available: maxBoxes > 0,
        issue,
        giftBoxId: g.id,
        contents: g.items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          name: i.product.name,
          color: i.variant.color.name,
          quantity: i.quantity,
        })),
      });
    }
  }

  const billable = lines.filter((l) => l.available);
  const subtotal = billable.reduce((sum, l) => sum + l.lineTotal, 0);

  let promo: PromoResult | null = null;
  if (input.promoCode?.trim()) {
    promo = billable.length
      ? await evaluatePromo(input.promoCode, subtotal, { email: input.customerEmail, phone: input.customerPhone }, client)
      : { code: input.promoCode.trim().toUpperCase(), applied: false, discount: 0, message: "Add items to use a promo code." };
  }
  const discount = promo?.applied ? Math.min(promo.discount, subtotal) : 0;

  const governorate = input.governorate?.trim() || null;
  const zone = governorate ? await client.shippingZone.findUnique({ where: { name: governorate } }) : null;
  const shipping = computeShipping(settings, zone, subtotal - discount, governorate);

  const issues = lines.filter((l) => l.issue).map((l) => (l.name ? `${l.name}: ${l.issue}` : l.issue!));
  if (!shipping.available) issues.push(`We don't currently deliver to ${shipping.zone}.`);

  return {
    lines,
    itemCount: billable.reduce((n, l) => n + l.quantity, 0),
    subtotal,
    discount,
    shipping,
    total: subtotal - discount + shipping.fee,
    promo,
    issues,
  };
}

function unavailableLine(key: string, kind: "product" | "giftbox", issue: string): QuoteLine {
  return {
    key,
    kind,
    name: "",
    href: "#",
    image: null,
    colorName: null,
    colorHex: null,
    unitPrice: 0,
    compareAtPrice: null,
    quantity: 0,
    lineTotal: 0,
    maxQuantity: 0,
    available: false,
    issue,
  };
}
