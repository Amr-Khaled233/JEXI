import type { OrderStatusKey } from "@/lib/constants";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/email/mailer";
import { adminNewOrderEmail, customerConfirmationEmail, customerStatusEmail, type EmailOrder } from "@/lib/email/templates";
import { getNotificationEmail, getSettings } from "@/lib/settings";

async function loadOrder(orderId: string): Promise<EmailOrder | null> {
  return db.order.findUnique({
    where: { id: orderId },
    include: { items: { select: { name: true, color: true, quantity: true, unitPrice: true, lineTotal: true, contents: true } } },
  });
}

/** Admin alert + customer confirmation. Called via after() so checkout isn't slowed down. */
export async function notifyNewOrder(orderId: string) {
  const order = await loadOrder(orderId);
  if (!order) return;
  const [adminTo, settings] = await Promise.all([getNotificationEmail(), getSettings()]);

  await Promise.all([
    adminTo ? sendMail({ to: adminTo, replyTo: order.email, ...adminNewOrderEmail(order) }) : null,
    sendMail({ to: order.email, replyTo: settings.contactEmail ?? undefined, ...customerConfirmationEmail(order) }),
  ]);
}

export async function notifyStatusChange(orderId: string, status: OrderStatusKey, note?: string | null) {
  const order = await loadOrder(orderId);
  if (!order) return;
  const settings = await getSettings();
  await sendMail({ to: order.email, replyTo: settings.contactEmail ?? undefined, ...customerStatusEmail(order, status, note) });
}
