// Shared, client-safe constants. String unions mirror the Prisma enums.

export type TagKey = "BEST_SELLER" | "NEW" | "SALE";
export type OrderStatusKey = "PENDING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

/** A product color, managed from the dashboard. */
export type ColorInfo = { id: string; name: string; slug: string; hex: string };

function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift: number) => {
    const v = (n >> shift) & 255;
    return Math.round(amount >= 0 ? v + (255 - v) * amount : v * (1 + amount));
  };
  return `rgb(${ch(16)} ${ch(8)} ${ch(0)})`;
}

/** A soft metallic swatch built from one hex color. */
export function swatchBackground(hex: string) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return "#888888";
  return `linear-gradient(135deg, ${shade(hex, 0.45)}, ${hex} 55%, ${shade(hex, -0.3)})`;
}

export const TAGS: Record<TagKey, { label: string }> = {
  BEST_SELLER: { label: "Best Seller" },
  NEW: { label: "New" },
  SALE: { label: "Sale" },
};
export const TAG_KEYS = Object.keys(TAGS) as TagKey[];

export const ORDER_STATUSES: Record<OrderStatusKey, { label: string; description: string }> = {
  PENDING: { label: "Pending", description: "We've received your order and are preparing it." },
  SHIPPED: { label: "Shipped", description: "Your order is on its way to you." },
  DELIVERED: { label: "Delivered", description: "Your order has been delivered." },
  CANCELLED: { label: "Cancelled", description: "This order was cancelled." },
};
export const ORDER_STATUS_KEYS = Object.keys(ORDER_STATUSES) as OrderStatusKey[];
/** The happy-path progression shown on the tracking line. */
export const ORDER_FLOW: OrderStatusKey[] = ["PENDING", "SHIPPED", "DELIVERED"];

/** All 27 Egyptian governorates with a sensible default delivery estimate. */
export const GOVERNORATES: { name: string; eta: string }[] = [
  { name: "Cairo", eta: "1 to 3 business days" },
  { name: "Giza", eta: "1 to 3 business days" },
  { name: "Alexandria", eta: "2 to 4 business days" },
  { name: "Qalyubia", eta: "2 to 4 business days" },
  { name: "Sharqia", eta: "2 to 4 business days" },
  { name: "Dakahlia", eta: "2 to 4 business days" },
  { name: "Gharbia", eta: "2 to 4 business days" },
  { name: "Monufia", eta: "2 to 4 business days" },
  { name: "Beheira", eta: "2 to 4 business days" },
  { name: "Kafr El Sheikh", eta: "2 to 4 business days" },
  { name: "Damietta", eta: "2 to 4 business days" },
  { name: "Port Said", eta: "2 to 4 business days" },
  { name: "Ismailia", eta: "2 to 4 business days" },
  { name: "Suez", eta: "2 to 4 business days" },
  { name: "North Sinai", eta: "4 to 7 business days" },
  { name: "South Sinai", eta: "4 to 7 business days" },
  { name: "Faiyum", eta: "3 to 5 business days" },
  { name: "Beni Suef", eta: "3 to 5 business days" },
  { name: "Minya", eta: "3 to 5 business days" },
  { name: "Assiut", eta: "3 to 6 business days" },
  { name: "Sohag", eta: "3 to 6 business days" },
  { name: "Qena", eta: "3 to 6 business days" },
  { name: "Luxor", eta: "3 to 6 business days" },
  { name: "Aswan", eta: "4 to 7 business days" },
  { name: "Red Sea", eta: "4 to 7 business days" },
  { name: "New Valley", eta: "5 to 8 business days" },
  { name: "Matrouh", eta: "4 to 7 business days" },
];

export const PRODUCTS_PER_PAGE = 24;
