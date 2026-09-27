import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { deleteOrder, OrderError, placeOrder, updateOrderStatus } from "@/lib/orders";
import { cartOf, customerDetails, makeGiftBox, makeProduct, makeZone, resetStore, shippingDetails, stockOf } from "./fixtures";

beforeEach(resetStore);

const place = (items: Parameters<typeof placeOrder>[0]["items"], extra: Partial<Parameters<typeof placeOrder>[0]> = {}) =>
  placeOrder({ items, customer: customerDetails(), shipping: shippingDetails(), paymentMethod: "COD", ...extra });

describe("placeOrder", () => {
  it("records the totals the server calculated, not whatever the client sent", async () => {
    await makeZone("Cairo", 6000);
    const { variant } = await makeProduct({ price: 95000, stock: 5 });

    const placed = await place(cartOf(variant.id, 2));
    const order = await db.order.findUniqueOrThrow({ where: { id: placed.id }, include: { items: true } });

    expect(order.subtotal).toBe(190000);
    expect(order.shippingFee).toBe(6000);
    expect(order.total).toBe(196000);
    expect(order.items).toHaveLength(1);
    expect(order.items[0].lineTotal).toBe(190000);
  });

  it("takes the items out of stock", async () => {
    await makeZone();
    const { variant } = await makeProduct({ stock: 10 });
    await place(cartOf(variant.id, 3));
    expect(await stockOf(variant.id)).toBe(7);
  });

  it("opens the timeline at Pending", async () => {
    await makeZone();
    const { variant } = await makeProduct();
    const placed = await place(cartOf(variant.id));
    const history = await db.orderStatusHistory.findMany({ where: { orderId: placed.id } });
    expect(history).toHaveLength(1);
    expect(history[0].status).toBe("PENDING");
  });

  it("gives every order its own secret link", async () => {
    await makeZone();
    const { variant } = await makeProduct({ stock: 5 });
    const a = await place(cartOf(variant.id));
    const b = await place(cartOf(variant.id));
    expect(a.accessToken).not.toBe(b.accessToken);
    expect(a.accessToken.length).toBeGreaterThan(20);
    expect(a.orderNumber).not.toBe(b.orderNumber);
  });

  it("refuses to oversell, even when two orders race for the last piece", async () => {
    await makeZone();
    const { variant } = await makeProduct({ stock: 1 });

    const results = await Promise.allSettled([place(cartOf(variant.id)), place(cartOf(variant.id))]);
    const won = results.filter((r) => r.status === "fulfilled");
    const lost = results.filter((r) => r.status === "rejected");

    expect(won).toHaveLength(1);
    expect(lost).toHaveLength(1);
    expect(await stockOf(variant.id)).toBe(0);
  });

  it("refuses a governorate the store does not deliver to", async () => {
    await makeZone("Cairo");
    const { variant } = await makeProduct();
    await expect(place(cartOf(variant.id), { shipping: shippingDetails("Aswan") })).rejects.toThrow(OrderError);
  });

  it("refuses a governorate the admin switched off", async () => {
    await makeZone("Cairo", 6000, false);
    const { variant } = await makeProduct();
    await expect(place(cartOf(variant.id))).rejects.toThrow(/don't deliver/i);
  });

  it("refuses an unpublished product, however it got into the cart", async () => {
    await makeZone();
    const { variant } = await makeProduct({ published: false });
    await expect(place(cartOf(variant.id))).rejects.toThrow(OrderError);
    expect(await stockOf(variant.id)).toBe(10);
  });

  it("takes gift box stock from the pieces inside it", async () => {
    await makeZone();
    const a = await makeProduct({ name: "Ring", stock: 10 });
    const b = await makeProduct({ name: "Charm", stock: 10 });
    const box = await makeGiftBox([
      { productId: a.product.id, variantId: a.variant.id, quantity: 2 },
      { productId: b.product.id, variantId: b.variant.id, quantity: 1 },
    ]);

    await place([{ kind: "giftbox", giftBoxId: box.id, quantity: 2 }]);

    expect(await stockOf(a.variant.id)).toBe(6);
    expect(await stockOf(b.variant.id)).toBe(8);
  });

  it("counts a piece once across a gift box and a separate line", async () => {
    await makeZone();
    const { product, variant } = await makeProduct({ stock: 3 });
    const box = await makeGiftBox([{ productId: product.id, variantId: variant.id, quantity: 2 }]);

    // Two from the box plus two loose is four, and only three exist.
    await expect(place([{ kind: "giftbox", giftBoxId: box.id, quantity: 1 }, ...cartOf(variant.id, 2)])).rejects.toThrow(OrderError);
    expect(await stockOf(variant.id)).toBe(3);
  });

  it("applies a promo code and counts the redemption", async () => {
    await makeZone("Cairo", 6000);
    const { variant } = await makeProduct({ price: 100000, stock: 5 });
    const promo = await db.promoCode.create({
      data: { code: "WELCOME10", discountType: "PERCENTAGE", value: 10, startsAt: new Date("2020-01-01"), endsAt: new Date("2100-01-01") },
    });

    const placed = await place(cartOf(variant.id), { promoCode: "welcome10" });
    const order = await db.order.findUniqueOrThrow({ where: { id: placed.id } });

    expect(order.discount).toBe(10000);
    expect(order.total).toBe(96000);
    expect(order.promoCode).toBe("WELCOME10");
    expect((await db.promoCode.findUniqueOrThrow({ where: { id: promo.id } })).usedCount).toBe(1);
  });

  it("refuses a promo code the customer typed wrong rather than quietly ignoring it", async () => {
    await makeZone();
    const { variant } = await makeProduct();
    await expect(place(cartOf(variant.id), { promoCode: "NOPE" })).rejects.toThrow(OrderError);
    expect(await stockOf(variant.id)).toBe(10);
  });

  it("holds the usage limit when two orders race for the last redemption", async () => {
    await makeZone();
    const { variant } = await makeProduct({ stock: 10 });
    await db.promoCode.create({
      data: { code: "LAST1", discountType: "FIXED", value: 5000, usageLimit: 1, startsAt: new Date("2020-01-01"), endsAt: new Date("2100-01-01") },
    });

    const results = await Promise.allSettled([place(cartOf(variant.id), { promoCode: "LAST1" }), place(cartOf(variant.id), { promoCode: "LAST1" })]);

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((await db.promoCode.findFirstOrThrow({ where: { code: "LAST1" } })).usedCount).toBe(1);
  });
});

describe("updateOrderStatus", () => {
  it("records each step in the timeline", async () => {
    await makeZone();
    const { variant } = await makeProduct();
    const placed = await place(cartOf(variant.id));

    await updateOrderStatus(placed.id, "CONFIRMED");
    await updateOrderStatus(placed.id, "SHIPPED");

    const history = await db.orderStatusHistory.findMany({ where: { orderId: placed.id }, orderBy: { createdAt: "asc" } });
    expect(history.map((h) => h.status)).toEqual(["PENDING", "CONFIRMED", "SHIPPED"]);
  });

  it("marks a cash order paid on delivery", async () => {
    await makeZone();
    const { variant } = await makeProduct();
    const placed = await place(cartOf(variant.id));

    await updateOrderStatus(placed.id, "DELIVERED");
    expect((await db.order.findUniqueOrThrow({ where: { id: placed.id } })).paymentStatus).toBe("PAID");
  });

  it("puts the stock back and releases the promo when an order is cancelled", async () => {
    await makeZone();
    const { variant } = await makeProduct({ stock: 10 });
    await db.promoCode.create({
      data: { code: "BACK10", discountType: "FIXED", value: 5000, startsAt: new Date("2020-01-01"), endsAt: new Date("2100-01-01") },
    });
    const placed = await place(cartOf(variant.id, 3), { promoCode: "BACK10" });
    expect(await stockOf(variant.id)).toBe(7);

    await updateOrderStatus(placed.id, "CANCELLED");

    expect(await stockOf(variant.id)).toBe(10);
    expect((await db.promoCode.findFirstOrThrow({ where: { code: "BACK10" } })).usedCount).toBe(0);
  });

  it("returns gift box pieces to stock on cancellation", async () => {
    await makeZone();
    const { product, variant } = await makeProduct({ stock: 10 });
    const box = await makeGiftBox([{ productId: product.id, variantId: variant.id, quantity: 2 }]);
    const placed = await place([{ kind: "giftbox", giftBoxId: box.id, quantity: 3 }]);
    expect(await stockOf(variant.id)).toBe(4);

    await updateOrderStatus(placed.id, "CANCELLED");
    expect(await stockOf(variant.id)).toBe(10);
  });

  it("treats cancelled as final", async () => {
    await makeZone();
    const { variant } = await makeProduct();
    const placed = await place(cartOf(variant.id));
    await updateOrderStatus(placed.id, "CANCELLED");

    await expect(updateOrderStatus(placed.id, "SHIPPED")).rejects.toThrow(/can't be changed/i);
  });

  it("will not restock twice by cancelling an order that is already cancelled", async () => {
    await makeZone();
    const { variant } = await makeProduct({ stock: 10 });
    const placed = await place(cartOf(variant.id, 4));
    await updateOrderStatus(placed.id, "CANCELLED");

    await expect(updateOrderStatus(placed.id, "CANCELLED")).rejects.toThrow();
    expect(await stockOf(variant.id)).toBe(10);
  });
});

describe("deleteOrder", () => {
  it.each(["PENDING", "CONFIRMED", "SHIPPED"] as const)("returns the stock of a %s order", async (status) => {
    await makeZone();
    const { variant } = await makeProduct({ stock: 10 });
    const placed = await place(cartOf(variant.id, 4));
    if (status !== "PENDING") await updateOrderStatus(placed.id, status);
    expect(await stockOf(variant.id)).toBe(6);

    await deleteOrder(placed.id);

    expect(await stockOf(variant.id)).toBe(10);
    expect(await db.order.findUnique({ where: { id: placed.id } })).toBeNull();
  });

  it("leaves stock alone for a delivered order, because those pieces are gone", async () => {
    await makeZone();
    const { variant } = await makeProduct({ stock: 10 });
    const placed = await place(cartOf(variant.id, 4));
    await updateOrderStatus(placed.id, "DELIVERED");

    await deleteOrder(placed.id);
    expect(await stockOf(variant.id)).toBe(6);
  });

  it("does not return the stock twice for an order that was already cancelled", async () => {
    await makeZone();
    const { variant } = await makeProduct({ stock: 10 });
    const placed = await place(cartOf(variant.id, 4));
    await updateOrderStatus(placed.id, "CANCELLED");
    expect(await stockOf(variant.id)).toBe(10);

    await deleteOrder(placed.id);
    expect(await stockOf(variant.id)).toBe(10);
  });

  it("takes the order's items and timeline with it", async () => {
    await makeZone();
    const { variant } = await makeProduct();
    const placed = await place(cartOf(variant.id));

    await deleteOrder(placed.id);

    expect(await db.orderItem.count({ where: { orderId: placed.id } })).toBe(0);
    expect(await db.orderStatusHistory.count({ where: { orderId: placed.id } })).toBe(0);
  });
});
