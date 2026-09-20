import type { OrderStatusKey } from "@/lib/constants";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/email/mailer";
import { adminNewOrderEmail, customerConfirmationEmail, customerStatusEmail, type EmailBrand, type EmailOrder } from "@/lib/email/templates";
import { getNotificationEmail, getSettings, type Settings } from "@/lib/settings";

export function brandFromSettings(settings: Settings): EmailBrand {
  return { storeName: settings.storeName, contactEmail: settings.contactEmail, whatsapp: settings.whatsapp, instagram: settings.instagram };
}

async function loadOrder(orderId: string): Promise<EmailOrder | null> {
  return db.order.findUnique({
    where: { id: orderId },
    include: { items: { select: { name: true, colorName: true, image: true, quantity: true, unitPrice: true, lineTotal: true, contents: true } } },
  });
}

/**
 * New order: only the store is emailed. The customer is emailed once the admin
 * confirms the order (after the shipping fee arrives).
 */
export async function notifyNewOrder(orderId: string) {
  const order = await loadOrder(orderId);
  if (!order) return;
  const [adminTo, settings] = await Promise.all([getNotificationEmail(), getSettings()]);
  if (!adminTo) return;
  await sendMail({ to: adminTo, replyTo: order.email, ...adminNewOrderEmail(order, brandFromSettings(settings)) });
}

export async function notifyStatusChange(orderId: string, status: OrderStatusKey, note?: string | null) {
  const order = await loadOrder(orderId);
  if (!order) return;
  const [settings, zone] = await Promise.all([
    getSettings(),
    db.shippingZone.findUnique({ where: { name: order.governorate }, select: { estimatedDelivery: true } }),
  ]);
  const brand = brandFromSettings(settings);
  // Confirming is the customer's first email, so it carries the full order details.
  const message = status === "CONFIRMED" ? customerConfirmationEmail(order, brand) : customerStatusEmail(order, status, brand, { note, estimatedDelivery: zone?.estimatedDelivery });
  await sendMail({ to: order.email, replyTo: settings.contactEmail ?? undefined, ...message });
}
