// Shared, client-safe constants. String unions mirror the Prisma enums.

export type ColorKey = "GOLD" | "SILVER" | "ROSE_GOLD";
export type TagKey = "BEST_SELLER" | "NEW" | "SALE";
export type OrderStatusKey = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export const COLORS: Record<ColorKey, { label: string; swatch: string }> = {
  GOLD: { label: "Gold", swatch: "linear-gradient(135deg,#f3d98b,#c9a24a 55%,#9c7a2e)" },
  SILVER: { label: "Silver", swatch: "linear-gradient(135deg,#f4f4f4,#c3c5c8 55%,#8e9195)" },
  ROSE_GOLD: { label: "Rose Gold / Copper", swatch: "linear-gradient(135deg,#f3c3b0,#c4826b 55%,#98583f)" },
};
export const COLOR_KEYS = Object.keys(COLORS) as ColorKey[];

export const TAGS: Record<TagKey, { label: string }> = {
  BEST_SELLER: { label: "Best Seller" },
  NEW: { label: "New" },
  SALE: { label: "Sale" },
};
export const TAG_KEYS = Object.keys(TAGS) as TagKey[];

export const ORDER_STATUSES: Record<OrderStatusKey, { label: string; description: string }> = {
  PENDING: { label: "Pending", description: "We've received your order and will confirm it shortly." },
  CONFIRMED: { label: "Confirmed", description: "Your order is confirmed and queued for preparation." },
  PROCESSING: { label: "Processing", description: "Your pieces are being prepared and packed." },
  SHIPPED: { label: "Shipped", description: "Your order is on its way to you." },
  DELIVERED: { label: "Delivered", description: "Your order has been delivered. Enjoy!" },
  CANCELLED: { label: "Cancelled", description: "This order was cancelled." },
};
export const ORDER_STATUS_KEYS = Object.keys(ORDER_STATUSES) as OrderStatusKey[];
/** The happy-path progression shown on timelines. */
export const ORDER_FLOW: OrderStatusKey[] = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

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
