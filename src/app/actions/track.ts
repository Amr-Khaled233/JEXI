"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/utils";

export type TrackState = { error?: string } | undefined;

export async function trackOrderAction(_prev: TrackState, formData: FormData): Promise<TrackState> {
  const orderNumber = String(formData.get("orderNumber") ?? "").trim().toUpperCase();
  const contact = String(formData.get("contact") ?? "").trim();
  if (!orderNumber || !contact) return { error: "Please enter your order number and the email or phone used at checkout." };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`track:${ip}`, 10)) return { error: "Too many attempts. Please wait a minute and try again." };

  const order = await db.order.findUnique({ where: { orderNumber }, select: { orderNumber: true, accessToken: true, email: true, phone: true } });
  const matches =
    order && (contact.includes("@") ? order.email === contact.toLowerCase() : normalizePhone(order.phone) === normalizePhone(contact));

  if (!order || !matches) return { error: "We couldn't find an order with those details. Please check and try again." };

  redirect(`/order/${encodeURIComponent(order.orderNumber)}?t=${order.accessToken}`);
}
