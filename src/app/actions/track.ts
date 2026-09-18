"use server";

import { after } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isEmailConfigured, sendMail } from "@/lib/email/mailer";
import { brandFromSettings } from "@/lib/email/notifications";
import { customerOrdersEmail } from "@/lib/email/templates";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";

export type TrackState = { error?: string; sentTo?: string } | undefined;

/**
 * Track Order by email only. The order list is emailed to that address rather than
 * shown on screen, so nobody can look up someone else's orders (address, phone)
 * just by knowing their email. The response is identical whether or not orders exist.
 */
export async function trackOrderAction(_prev: TrackState, formData: FormData): Promise<TrackState> {
  const parsed = z.email().max(200).safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) return { error: "Please enter a valid email address." };
  const email = parsed.data;

  const allowed = (await rateLimit(`track:ip:${await clientIp()}`, 8, 10 * 60_000)) && (await rateLimit(`track:email:${email}`, 3, 15 * 60_000));
  if (!allowed) return { error: "Too many requests. Please try again in a few minutes." };

  if (!isEmailConfigured()) {
    return { error: "Order tracking by email is temporarily unavailable. Please contact us on WhatsApp or Instagram." };
  }

  const orders = await db.order.findMany({
    where: { email },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { orderNumber: true, accessToken: true, status: true, total: true, createdAt: true, _count: { select: { items: true } } },
  });

  if (orders.length > 0) {
    const brand = brandFromSettings(await getSettings());
    const message = customerOrdersEmail(
      orders.map((o) => ({ ...o, itemCount: o._count.items })),
      brand,
    );
    // Sent after the response so timing doesn't reveal whether this email has orders.
    after(() => sendMail({ to: email, ...message }));
  }

  return { sentTo: email };
}
