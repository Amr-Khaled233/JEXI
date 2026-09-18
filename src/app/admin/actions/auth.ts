"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { endSession, hashPassword, startSession, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { isEmailConfigured, sendMail } from "@/lib/email/mailer";
import { adminPasswordResetEmail } from "@/lib/email/templates";
import { consumeAdminResetToken, createAdminResetToken, maskEmail, RESET_TOKEN_TTL_MINUTES } from "@/lib/password-reset";
import { rateLimit } from "@/lib/rate-limit";
import { getNotificationEmail } from "@/lib/settings";
import { appUrl } from "@/lib/utils";

export type LoginState = { error?: string } | undefined;

async function clientIp() {
  return (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

export async function adminLoginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  if (!rateLimit(`admin-login:${await clientIp()}`, 6)) return { error: "Too many attempts. Please wait a minute." };

  const admin = await db.adminUser.findUnique({ where: { email } });
  if (!admin || !(await verifyPassword(password, admin.passwordHash))) return { error: "Incorrect email or password." };

  await db.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  await startSession("admin", admin.id, admin.sessionVersion);

  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function adminLogoutAction() {
  await endSession("admin");
  redirect("/admin/login");
}

// ─── Forgot / reset password ──────────────────────────────

export type ForgotState = { error?: string; sentTo?: string } | undefined;

/**
 * Emails a reset link to the store's notification inbox (Admin → Settings →
 * "New-order notification email", falling back to ADMIN_NOTIFICATION_EMAIL, then GMAIL_USER).
 * The response is the same whether or not the email belongs to an admin.
 */
export async function requestAdminPasswordResetAction(_prev: ForgotState, formData: FormData): Promise<ForgotState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Enter your admin email." };
  if (!rateLimit(`admin-forgot:${await clientIp()}`, 5)) return { error: "Too many requests. Please wait a minute." };

  const inbox = await getNotificationEmail();
  if (!isEmailConfigured() || !inbox) {
    return { error: "Email isn't configured on the server yet (GMAIL_USER / GMAIL_APP_PASSWORD), so a reset link can't be sent." };
  }

  const admin = await db.adminUser.findUnique({ where: { email }, select: { id: true, name: true, email: true } });
  if (admin) {
    const token = await createAdminResetToken(admin.id);
    const link = appUrl(`/admin/reset-password?token=${token}`);
    // Sent after the response so timing doesn't reveal whether the account exists.
    after(() => sendMail({ to: inbox, ...adminPasswordResetEmail(admin, link, RESET_TOKEN_TTL_MINUTES) }));
  }

  return { sentTo: maskEmail(inbox) };
}

export type ResetState = { error?: string } | undefined;

export async function resetAdminPasswordAction(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 10) return { error: "Password must be at least 10 characters." };
  if (password !== confirm) return { error: "The two passwords don't match." };
  if (!rateLimit(`admin-reset:${await clientIp()}`, 10)) return { error: "Too many attempts. Please wait a minute." };

  const ok = await consumeAdminResetToken(token, await hashPassword(password));
  if (!ok) return { error: "This reset link is invalid or has expired. Please request a new one." };

  await endSession("admin");
  redirect("/admin/login?reset=1");
}
