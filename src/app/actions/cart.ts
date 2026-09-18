"use server";

import { z } from "zod";
import { quoteCart, type Quote } from "@/lib/pricing";

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
  return quoteCart(parsed.data);
}
