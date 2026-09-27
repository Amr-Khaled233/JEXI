import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { MAX_LINE_QUANTITY, quoteCart } from "@/lib/pricing";
import { cartOf, makeGiftBox, makeProduct, makeZone, resetStore } from "./fixtures";

beforeEach(resetStore);

const activePromo = { startsAt: new Date("2020-01-01"), endsAt: new Date("2100-01-01") };

describe("quoteCart", () => {
  it("prices from the database, ignoring anything the client might claim", async () => {
    const { variant } = await makeProduct({ price: 95000, stock: 10 });
    const quote = await quoteCart({ items: cartOf(variant.id, 2) });

    expect(quote.subtotal).toBe(190000);
    expect(quote.itemCount).toBe(2);
    expect(quote.lines[0].unitPrice).toBe(95000);
  });

  it("merges two lines for the same variant instead of listing it twice", async () => {
    const { variant } = await makeProduct({ stock: 10 });
    const quote = await quoteCart({ items: [...cartOf(variant.id, 2), ...cartOf(variant.id, 3)] });

    expect(quote.lines).toHaveLength(1);
    expect(quote.lines[0].quantity).toBe(5);
  });

  it("caps a single line so one visitor cannot reserve the whole shelf", async () => {
    const { variant } = await makeProduct({ stock: 100 });
    const quote = await quoteCart({ items: cartOf(variant.id, 999) });
    expect(quote.lines[0].quantity).toBe(MAX_LINE_QUANTITY);
  });

  it("drops entries that are not real cart items", async () => {
    const { variant } = await makeProduct();
    const junk = [{ kind: "product" as const, variantId: "", quantity: 1 }, { kind: "product" as const, variantId: variant.id, quantity: 0 }];
    const quote = await quoteCart({ items: junk });
    expect(quote.lines).toHaveLength(0);
  });

  it("flags a sold-out item and leaves it out of the subtotal", async () => {
    const { variant } = await makeProduct({ price: 95000, stock: 0 });
    const quote = await quoteCart({ items: cartOf(variant.id) });

    expect(quote.lines[0].available).toBe(false);
    expect(quote.lines[0].issue).toMatch(/sold out/i);
    expect(quote.subtotal).toBe(0);
    expect(quote.issues).toHaveLength(1);
  });

  it("says how many are left when the cart asks for more than there are", async () => {
    const { variant } = await makeProduct({ stock: 2 });
    const quote = await quoteCart({ items: cartOf(variant.id, 5) });
    expect(quote.lines[0].issue).toBe("Only 2 left in stock.");
  });

  it("treats an unpublished product as gone without leaking its name", async () => {
    const { variant } = await makeProduct({ published: false });
    const quote = await quoteCart({ items: cartOf(variant.id) });

    expect(quote.lines[0].available).toBe(false);
    expect(quote.lines[0].name).toBe("");
    expect(quote.lines[0].issue).toMatch(/no longer available/i);
  });

  it("shows the regular price struck through only when it is higher", async () => {
    const { product, variant } = await makeProduct({ price: 80000 });
    await db.product.update({ where: { id: product.id }, data: { compareAtPrice: 100000 } });
    expect((await quoteCart({ items: cartOf(variant.id) })).lines[0].compareAtPrice).toBe(100000);

    await db.product.update({ where: { id: product.id }, data: { compareAtPrice: 50000 } });
    expect((await quoteCart({ items: cartOf(variant.id) })).lines[0].compareAtPrice).toBeNull();
  });

  it("limits a gift box to the fewest boxes its pieces allow", async () => {
    const a = await makeProduct({ name: "Ring", stock: 10 });
    const b = await makeProduct({ name: "Charm", stock: 3 });
    const box = await makeGiftBox([
      { productId: a.product.id, variantId: a.variant.id, quantity: 1 },
      { productId: b.product.id, variantId: b.variant.id, quantity: 2 },
    ]);

    const quote = await quoteCart({ items: [{ kind: "giftbox", giftBoxId: box.id, quantity: 1 }] });
    // Three charms, two per box, so only one box can be made.
    expect(quote.lines[0].maxQuantity).toBe(1);
  });

  it("shows what a gift box would cost bought separately", async () => {
    const a = await makeProduct({ name: "Ring", price: 100000, stock: 10 });
    const box = await makeGiftBox([{ productId: a.product.id, variantId: a.variant.id, quantity: 2 }], 150000);

    const quote = await quoteCart({ items: [{ kind: "giftbox", giftBoxId: box.id, quantity: 1 }] });
    expect(quote.lines[0].compareAtPrice).toBe(200000);
    expect(quote.subtotal).toBe(150000);
  });

  describe("promo codes", () => {
    it("takes a percentage off the subtotal", async () => {
      const { variant } = await makeProduct({ price: 100000, stock: 10 });
      await db.promoCode.create({ data: { code: "SAVE10", discountType: "PERCENTAGE", value: 10, ...activePromo } });

      const quote = await quoteCart({ items: cartOf(variant.id), promoCode: "save10" });
      expect(quote.promo?.applied).toBe(true);
      expect(quote.discount).toBe(10000);
      expect(quote.total).toBe(90000);
    });

    it("explains why a code did not apply instead of silently dropping it", async () => {
      const { variant } = await makeProduct({ stock: 10 });
      const quote = await quoteCart({ items: cartOf(variant.id), promoCode: "MADEUP" });

      expect(quote.promo?.applied).toBe(false);
      expect(quote.promo?.message).toMatch(/doesn't exist/i);
      expect(quote.discount).toBe(0);
    });

    it("holds the minimum order value", async () => {
      const { variant } = await makeProduct({ price: 50000, stock: 10 });
      await db.promoCode.create({ data: { code: "BIG", discountType: "FIXED", value: 10000, minOrderValue: 100000, ...activePromo } });

      const small = await quoteCart({ items: cartOf(variant.id, 1), promoCode: "BIG" });
      expect(small.promo?.applied).toBe(false);
      expect(small.promo?.message).toMatch(/Spend at least EGP 1,000/);

      const big = await quoteCart({ items: cartOf(variant.id, 2), promoCode: "BIG" });
      expect(big.promo?.applied).toBe(true);
    });

    it("matches the per-customer limit however the phone number was typed", async () => {
      const zone = await makeZone();
      const { product, variant } = await makeProduct({ price: 50000, stock: 10 });
      const promo = await db.promoCode.create({ data: { code: "ONCE", discountType: "FIXED", value: 5000, perCustomerLimit: 1, ...activePromo } });
      await db.order.create({
        data: {
          orderNumber: "JX-USED-1",
          accessToken: "t1",
          customerName: "Nour",
          email: "nour@example.com",
          phone: "01012345678",
          governorate: zone.name,
          area: "Maadi",
          address: "12 Road 9",
          subtotal: 50000,
          shippingFee: 0,
          total: 50000,
          promoCodeId: promo.id,
          items: { create: { productId: product.id, variantId: variant.id, name: "x", quantity: 1, unitPrice: 50000, lineTotal: 50000 } },
        },
      });

      const spaced = await quoteCart({ items: cartOf(variant.id), promoCode: "ONCE", customerPhone: "0101 234 5678" });
      expect(spaced.promo?.applied).toBe(false);
      expect(spaced.promo?.message).toMatch(/already used/i);

      const other = await quoteCart({ items: cartOf(variant.id), promoCode: "ONCE", customerPhone: "01199999999" });
      expect(other.promo?.applied).toBe(true);
    });

    it("never discounts more than the cart is worth", async () => {
      const { variant } = await makeProduct({ price: 10000, stock: 10 });
      await db.promoCode.create({ data: { code: "HUGE", discountType: "FIXED", value: 999999, ...activePromo } });

      const quote = await quoteCart({ items: cartOf(variant.id), promoCode: "HUGE" });
      expect(quote.discount).toBe(10000);
      expect(quote.total).toBe(0);
    });
  });

  describe("shipping", () => {
    it("adds the governorate's fee to the total", async () => {
      await makeZone("Cairo", 6000);
      const { variant } = await makeProduct({ price: 95000, stock: 10 });

      const quote = await quoteCart({ items: cartOf(variant.id), governorate: "Cairo" });
      expect(quote.shipping.fee).toBe(6000);
      expect(quote.total).toBe(101000);
    });

    it("flags a governorate the store does not serve", async () => {
      await makeZone("Cairo");
      const { variant } = await makeProduct({ stock: 10 });

      const quote = await quoteCart({ items: cartOf(variant.id), governorate: "Aswan" });
      expect(quote.shipping.available).toBe(false);
      expect(quote.issues.join(" ")).toMatch(/don't currently deliver/i);
    });

    it("measures the free-shipping minimum after the discount", async () => {
      await makeZone("Cairo", 6000);
      await db.storeSettings.update({ where: { id: 1 }, data: { freeShippingEnabled: true, freeShippingThreshold: 100000 } });
      const { variant } = await makeProduct({ price: 110000, stock: 10 });
      await db.promoCode.create({ data: { code: "CUT", discountType: "FIXED", value: 20000, ...activePromo } });

      const plain = await quoteCart({ items: cartOf(variant.id), governorate: "Cairo" });
      expect(plain.shipping.fee).toBe(0);

      // 110,000 less 20,000 is 90,000, which no longer clears the minimum.
      const discounted = await quoteCart({ items: cartOf(variant.id), governorate: "Cairo", promoCode: "CUT" });
      expect(discounted.shipping.fee).toBe(6000);
      expect(discounted.total).toBe(96000);
    });
  });
});
