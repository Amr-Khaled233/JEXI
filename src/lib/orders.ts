import { randomBytes, randomInt } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import type { OrderStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { quoteCart, type CartItemInput } from "@/lib/pricing";

/** An error whose message is safe to show to the customer/admin. */
export class OrderError extends Error {}

export type PlaceOrderInput = {
  items: CartItemInput[];
  promoCode?: string | null;
  customer: { name: string; email: string; phone: string };
  shipping: { governorate: string; area: string; address: string; notes?: string | null };
  paymentMethod: "COD";
};

function generateOrderNumber() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `JX${ymd}-${randomInt(10000, 99999)}`;
}

export async function placeOrder(input: PlaceOrderInput) {
  const email = input.customer.email.trim().toLowerCase();
  const phone = input.customer.phone.trim();

  const zone = await db.shippingZone.findUnique({ where: { name: input.shipping.governorate } });
  if (!zone || !zone.enabled) throw new OrderError(`Sorry, we don't deliver to ${input.shipping.governorate} yet.`);

  const quote = await quoteCart({
    items: input.items,
    promoCode: input.promoCode,
    governorate: zone.name,
    customerEmail: email,
    customerPhone: phone,
  });

  if (quote.lines.length === 0) throw new OrderError("Your cart is empty.");
  if (quote.issues.length) throw new OrderError(quote.issues[0]);
  if (input.promoCode?.trim() && !quote.promo?.applied) throw new OrderError(quote.promo?.message ?? "Invalid promo code.");

  // Total units needed per variant (gift boxes draw from their component variants).
  const needed = new Map<string, { qty: number; name: string }>();
  for (const line of quote.lines) {
    if (line.kind === "product" && line.variantId) {
      const cur = needed.get(line.variantId);
      needed.set(line.variantId, { qty: (cur?.qty ?? 0) + line.quantity, name: line.name });
    }
    for (const c of line.contents ?? []) {
      const cur = needed.get(c.variantId);
      needed.set(c.variantId, { qty: (cur?.qty ?? 0) + c.quantity * line.quantity, name: c.name });
    }
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await db.$transaction(async (tx) => {
        for (const [variantId, { qty, name }] of needed) {
          const res = await tx.variant.updateMany({
            where: { id: variantId, stock: { gte: qty } },
            data: { stock: { decrement: qty } },
          });
          if (res.count === 0) throw new OrderError(`Sorry, ${name} just sold out. Please review your cart.`);
        }

        if (quote.promo?.applied && quote.promo.promoId) {
          const updated = await tx.$executeRaw`
            UPDATE "PromoCode" SET "usedCount" = "usedCount" + 1
            WHERE "id" = ${quote.promo.promoId} AND ("usageLimit" IS NULL OR "usedCount" < "usageLimit")`;
          if (updated === 0) throw new OrderError("This promo code has just reached its usage limit.");
        }

        const order = await tx.order.create({
          data: {
            orderNumber: generateOrderNumber(),
            accessToken: randomBytes(24).toString("base64url"),
            customerName: input.customer.name.trim(),
            email,
            phone,
            governorate: zone.name,
            area: input.shipping.area.trim(),
            address: input.shipping.address.trim(),
            notes: input.shipping.notes?.trim() || null,
            paymentMethod: input.paymentMethod,
            subtotal: quote.subtotal,
            discount: quote.discount,
            shippingFee: quote.shipping.fee,
            total: quote.total,
            promoCodeId: quote.promo?.applied ? quote.promo.promoId : null,
            promoCode: quote.promo?.applied ? quote.promo.code : null,
            items: {
              create: quote.lines.map((l) => ({
                productId: l.productId ?? null,
                variantId: l.variantId ?? null,
                giftBoxId: l.giftBoxId ?? null,
                name: l.name,
                color: l.color,
                sku: l.sku,
                image: l.image,
                unitPrice: l.unitPrice,
                quantity: l.quantity,
                lineTotal: l.lineTotal,
                contents: l.contents ? (l.contents as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
              })),
            },
            history: { create: { status: "PENDING", note: "Order placed" } },
          },
          select: { id: true, orderNumber: true, accessToken: true, total: true, email: true, phone: true, customerName: true },
        });

        for (const l of quote.lines) {
          if (l.productId) await tx.product.update({ where: { id: l.productId }, data: { soldCount: { increment: l.quantity } } });
          if (l.giftBoxId) await tx.giftBox.update({ where: { id: l.giftBoxId }, data: { soldCount: { increment: l.quantity } } });
        }

        return order;
      });
    } catch (err) {
      const isOrderNumberClash =
        err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002" && JSON.stringify(err.meta ?? {}).includes("orderNumber");
      if (!isOrderNumberClash) throw err;
    }
  }
  throw new OrderError("We couldn't place your order. Please try again.");
}

/**
 * Change an order's status and record it in the timeline. Cancelling restocks
 * the items and releases the promo-code redemption. Cancelled is final.
 */
export async function updateOrderStatus(orderId: string, status: OrderStatus, note?: string | null, notifiedCustomer = false) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new OrderError("Order not found.");
    if (order.status === status) throw new OrderError("The order already has this status.");
    if (order.status === "CANCELLED") throw new OrderError("Cancelled orders can't be changed.");

    if (status === "CANCELLED") {
      for (const item of order.items) {
        if (item.variantId) {
          await tx.variant.updateMany({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
        }
        if (Array.isArray(item.contents)) {
          for (const c of item.contents as { variantId?: string; quantity?: number }[]) {
            if (c.variantId) {
              await tx.variant.updateMany({
                where: { id: c.variantId },
                data: { stock: { increment: (c.quantity ?? 1) * item.quantity } },
              });
            }
          }
        }
        if (item.productId) {
          await tx.product.updateMany({
            where: { id: item.productId, soldCount: { gte: item.quantity } },
            data: { soldCount: { decrement: item.quantity } },
          });
        }
        if (item.giftBoxId) {
          await tx.giftBox.updateMany({
            where: { id: item.giftBoxId, soldCount: { gte: item.quantity } },
            data: { soldCount: { decrement: item.quantity } },
          });
        }
      }
      if (order.promoCodeId) {
        await tx.promoCode.updateMany({ where: { id: order.promoCodeId, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } });
      }
    }

    return tx.order.update({
      where: { id: orderId },
      data: {
        status,
        // Cash is collected on delivery.
        ...(status === "DELIVERED" && order.paymentMethod === "COD" ? { paymentStatus: "PAID" as const } : {}),
        history: { create: { status, note: note?.trim() || null, notifiedCustomer } },
      },
    });
  });
}
