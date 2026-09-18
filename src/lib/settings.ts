import { cache } from "react";
import { db } from "@/lib/db";

/** Store settings are a single row (id = 1); created with defaults on first read. */
export const getSettings = cache(async () => {
  return db.storeSettings.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
});

export type Settings = Awaited<ReturnType<typeof getSettings>>;

export async function getNotificationEmail(): Promise<string | null> {
  const settings = await getSettings();
  return (
    settings.notificationEmail ||
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    process.env.GMAIL_USER ||
    null
  );
}
