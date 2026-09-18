"use server";

import { z } from "zod";
import { quoteCart, type Quote } from "@/lib/pricing";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const itemSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("product"), variantId: z.string().min(1).max(64), quantity: z.number().int().min(1).max(99) }),
  z.object({ kind: z.literal("giftbox"), giftBoxId: z.string().min(1).max(64), quantity: z.number().int().min(1).max(99) }),
]);

const quoteSchema = z.object({
  items: z.array(itemSchema).max(50),
  promoCode: z.string().max(40).nullish(),
  governorate: z.string().max(60).nullish(),
  customerEmail: z.string().max(200).nullish(),
  customerPhone: z.string().max(30).nullish(),
});

export async function getCartQuote(input: z.input<typeof quoteSchema>): Promise<Quote | null> {
  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) return null;

  // Stop promo codes from being guessed by brute force. The limit is generous
  // because the cart re-quotes on every change.
  if (parsed.data.promoCode && !(await rateLimit(`promo:${await clientIp()}`, 60))) {
    const quote = await quoteCart({ ...parsed.data, promoCode: null });
    return { ...quote, promo: { code: parsed.data.promoCode.toUpperCase(), applied: false, discount: 0, message: "Too many attempts. Please wait a minute." } };
  }
  return quoteCart(parsed.data);
}
