"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { checkLogin, endSession, hashPassword, startSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { isEmailConfigured, sendMail } from "@/lib/email/mailer";
import { adminPasswordResetEmail } from "@/lib/email/templates";
import { consumeAdminResetToken, createAdminResetToken, maskEmail, RESET_TOKEN_TTL_MINUTES } from "@/lib/password-reset";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { brandFromSettings } from "@/lib/email/notifications";
import { getNotificationEmail, getSettings } from "@/lib/settings";
import { appUrl } from "@/lib/utils";

export type LoginState = { error?: string } | undefined;

export async function adminLoginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  // Limit per IP and per account, so rotating IPs doesn't allow brute-forcing one admin.
  const allowed = (await rateLimit(`admin-login:ip:${await clientIp()}`, 10)) && (await rateLimit(`admin-login:email:${email}`, 5, 15 * 60_000));
  if (!allowed) return { error: "Too many attempts. Please try again in a few minutes." };

  const admin = await db.adminUser.findUnique({ where: { email } });
  // Always run the comparison (against a dummy hash if there's no account) so timing reveals nothing.
  const passwordOk = await checkLogin(password, admin?.passwordHash);
  if (!admin || !passwordOk) return { error: "Incorrect email or password." };

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
  const allowed = (await rateLimit(`admin-forgot:ip:${await clientIp()}`, 5)) && (await rateLimit(`admin-forgot:email:${email}`, 3, 15 * 60_000));
  if (!allowed) return { error: "Too many requests. Please try again in a few minutes." };

  const inbox = await getNotificationEmail();
  if (!isEmailConfigured() || !inbox) {
    return { error: "Email isn't configured on the server yet (GMAIL_USER / GMAIL_APP_PASSWORD), so a reset link can't be sent." };
  }

  const admin = await db.adminUser.findUnique({ where: { email }, select: { id: true, name: true, email: true } });
  if (admin) {
    const token = await createAdminResetToken(admin.id);
    const link = appUrl(`/admin/reset-password?token=${token}`);
    // Sent after the response so timing doesn't reveal whether the account exists.
    const brand = brandFromSettings(await getSettings());
    after(() => sendMail({ to: inbox, ...adminPasswordResetEmail(admin, link, RESET_TOKEN_TTL_MINUTES, brand) }));
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
  if (!(await rateLimit(`admin-reset:${await clientIp()}`, 10))) return { error: "Too many attempts. Please wait a minute." };

  const ok = await consumeAdminResetToken(token, await hashPassword(password));
  if (!ok) return { error: "This reset link is invalid or has expired. Please request a new one." };

  await endSession("admin");
  redirect("/admin/login?reset=1");
}
