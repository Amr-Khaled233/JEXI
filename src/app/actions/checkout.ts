"use server";

import { after } from "next/server";
import { z } from "zod";
import { getCustomer } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyNewOrder } from "@/lib/email/notifications";
import { OrderError, placeOrder } from "@/lib/orders";
import { getPaymentProvider } from "@/lib/payments";
import { isValidEgyptianMobile, normalizePhone } from "@/lib/utils";

const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(100),
  email: z.email("Please enter a valid email address.").max(200),
  phone: z
    .string()
    .trim()
    .refine(isValidEgyptianMobile, "Please enter a valid Egyptian mobile number (e.g. 01012345678)."),
  governorate: z.string().trim().min(1, "Please choose your governorate."),
  area: z.string().trim().min(2, "Please enter your area / city.").max(100),
  address: z.string().trim().min(5, "Please enter your street address, building and apartment.").max(300),
  notes: z.string().trim().max(500).optional(),
  paymentMethod: z.literal("COD"),
  promoCode: z.string().trim().max(40).nullish(),
  saveAddress: z.boolean().optional(),
  items: z
    .array(
      z.discriminatedUnion("kind", [
        z.object({ kind: z.literal("product"), variantId: z.string().min(1), quantity: z.number().int().min(1).max(20) }),
        z.object({ kind: z.literal("giftbox"), giftBoxId: z.string().min(1), quantity: z.number().int().min(1).max(20) }),
      ]),
    )
    .min(1, "Your bag is empty.")
    .max(50),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;

export type CheckoutResult =
  | { ok: true; orderNumber: string; token: string; redirectUrl: string | null }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function placeOrderAction(input: CheckoutInput): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors };
  }
  const data = parsed.data;

  const provider = getPaymentProvider(data.paymentMethod);
  if (!provider) return { ok: false, error: "This payment method isn't available." };

  const customer = await getCustomer();
  const phone = normalizePhone(data.phone);

  try {
    const order = await placeOrder({
      items: data.items,
      promoCode: data.promoCode,
      customerId: customer?.id ?? null,
      customer: { name: data.name, email: data.email, phone },
      shipping: { governorate: data.governorate, area: data.area, address: data.address, notes: data.notes },
      paymentMethod: data.paymentMethod,
    });

    if (customer && data.saveAddress) {
      const exists = await db.address.findFirst({
        where: { customerId: customer.id, governorate: data.governorate, area: data.area, address: data.address },
      });
      if (!exists) {
        const count = await db.address.count({ where: { customerId: customer.id } });
        await db.address.create({
          data: {
            customerId: customer.id,
            fullName: data.name,
            phone,
            governorate: data.governorate,
            area: data.area,
            address: data.address,
            isDefault: count === 0,
          },
        });
      }
    }

    // Emails go out after the response is sent, so checkout stays fast.
    after(() => notifyNewOrder(order.id));

    const { redirectUrl } = await provider.initiate(order);
    return { ok: true, orderNumber: order.orderNumber, token: order.accessToken, redirectUrl };
  } catch (err) {
    if (err instanceof OrderError) return { ok: false, error: err.message };
    console.error("Checkout failed", err);
    return { ok: false, error: "Something went wrong placing your order. Please try again." };
  }
}
