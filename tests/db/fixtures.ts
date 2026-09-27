import { db } from "@/lib/db";

/**
 * A small catalogue built fresh for each test file. Everything is created here
 * rather than seeded, so a test can read a price or a stock level from the same
 * object it passed in and never depend on the seed data staying put.
 */
export async function resetStore() {
  // Children first: orders reference variants, gift boxes reference both.
  await db.orderItem.deleteMany();
  await db.orderStatusHistory.deleteMany();
  await db.order.deleteMany();
  await db.giftBoxItem.deleteMany();
  await db.giftBox.deleteMany();
  await db.variant.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  await db.color.deleteMany();
  await db.promoCode.deleteMany();
  await db.rateLimit.deleteMany();
  // Free shipping defaults to on in the schema, so switch it off explicitly:
  // a test that wants it can turn it back on.
  const settings = { freeShippingEnabled: false, freeShippingThreshold: null, freeShippingStartsAt: null, freeShippingEndsAt: null, paymentPhone: null };
  await db.storeSettings.upsert({ where: { id: 1 }, create: { id: 1, ...settings }, update: settings });
  await db.shippingZone.deleteMany();
}

export async function makeZone(name = "Cairo", fee: number | null = 6000, enabled = true) {
  return db.shippingZone.create({ data: { name, fee, enabled, estimatedDelivery: "1 to 3 business days" } });
}

export async function makeProduct(opts: { name?: string; price?: number; stock?: number; published?: boolean } = {}) {
  const name = opts.name ?? "Aurelia Pendant Necklace";
  const category = await db.category.create({ data: { name: `Cat ${name}`, slug: `cat-${slug(name)}` } });
  const color = await db.color.create({ data: { name: `Gold ${name}`, slug: `gold-${slug(name)}`, hex: "#d4af37" } });
  const product = await db.product.create({
    data: {
      name,
      slug: slug(name),
      price: opts.price ?? 95000,
      published: opts.published ?? true,
      categories: { connect: { id: category.id } },
      variants: { create: { colorId: color.id, stock: opts.stock ?? 10 } },
    },
    include: { variants: true },
  });
  return { product, variant: product.variants[0], color, category };
}

/** A gift box that draws `quantity` units of `variantId` per box sold. */
export async function makeGiftBox(items: { productId: string; variantId: string; quantity: number }[], price = 150000) {
  return db.giftBox.create({
    data: {
      name: "Gift Box",
      slug: `gift-box-${Date.now()}`,
      coverImage: "/uploads/box.jpg",
      price,
      published: true,
      items: { create: items },
    },
  });
}

export function cartOf(variantId: string, quantity = 1) {
  return [{ kind: "product" as const, variantId, quantity }];
}

export function customerDetails(overrides: Partial<{ name: string; email: string; phone: string }> = {}) {
  return { name: "Nour Hassan", email: "nour@example.com", phone: "01012345678", ...overrides };
}

export function shippingDetails(governorate = "Cairo") {
  return { governorate, area: "Maadi", address: "12 Road 9" };
}

export async function stockOf(variantId: string) {
  return (await db.variant.findUniqueOrThrow({ where: { id: variantId } })).stock;
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
