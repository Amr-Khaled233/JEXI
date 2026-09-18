"use server";

import { z } from "zod";
import type { OrderStatusKey } from "@/lib/constants";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export type TrackedOrder = {
  orderNumber: string;
  createdAt: string;
  status: OrderStatusKey;
  total: number;
  items: { name: string; colorName: string | null; quantity: number; image: string | null }[];
  history: { status: OrderStatusKey; createdAt: string }[];
};

export type TrackState = { error?: string; email?: string; orders?: TrackedOrder[] } | undefined;

/**
 * Track Order by email: shows that email's orders and their status on screen.
 * Only order number, date, items, total and status are returned. The customer's
 * name, address and phone are never included, and lookups are rate-limited.
 */
export async function trackOrderAction(_prev: TrackState, formData: FormData): Promise<TrackState> {
  const parsed = z.email().max(200).safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) return { error: "Please enter a valid email address." };
  const email = parsed.data;

  const allowed = (await rateLimit(`track:ip:${await clientIp()}`, 15, 10 * 60_000)) && (await rateLimit(`track:email:${email}`, 10, 10 * 60_000));
  if (!allowed) return { error: "Too many searches. Please try again in a few minutes." };

  const orders = await db.order.findMany({
    where: { email },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      orderNumber: true,
      createdAt: true,
      status: true,
      total: true,
      items: { select: { name: true, colorName: true, quantity: true, image: true } },
      history: { select: { status: true, createdAt: true }, orderBy: { createdAt: "asc" } },
    },
  });

  return {
    email,
    orders: orders.map((o) => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
      history: o.history.map((h) => ({ status: h.status, createdAt: h.createdAt.toISOString() })),
    })),
  };
}
