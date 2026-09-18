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

/** Admin alert + customer confirmation. Called via after() so checkout isn't slowed down. */
export async function notifyNewOrder(orderId: string) {
  const order = await loadOrder(orderId);
  if (!order) return;
  const [adminTo, settings] = await Promise.all([getNotificationEmail(), getSettings()]);
  const brand = brandFromSettings(settings);

  await Promise.all([
    adminTo ? sendMail({ to: adminTo, replyTo: order.email, ...adminNewOrderEmail(order, brand) }) : null,
    sendMail({ to: order.email, replyTo: settings.contactEmail ?? undefined, ...customerConfirmationEmail(order, brand) }),
  ]);
}

export async function notifyStatusChange(orderId: string, status: OrderStatusKey, note?: string | null) {
  const order = await loadOrder(orderId);
  if (!order) return;
  const [settings, zone] = await Promise.all([
    getSettings(),
    db.shippingZone.findUnique({ where: { name: order.governorate }, select: { estimatedDelivery: true } }),
  ]);
  await sendMail({
    to: order.email,
    replyTo: settings.contactEmail ?? undefined,
    ...customerStatusEmail(order, status, brandFromSettings(settings), { note, estimatedDelivery: zone?.estimatedDelivery }),
  });
}
