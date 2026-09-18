"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { endSession, startSession, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export type LoginState = { error?: string } | undefined;

export async function adminLoginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`admin-login:${ip}`, 6)) return { error: "Too many attempts. Please wait a minute." };

  const admin = await db.adminUser.findUnique({ where: { email } });
  if (!admin || !(await verifyPassword(password, admin.passwordHash))) return { error: "Incorrect email or password." };

  await db.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  await startSession("admin", admin.id);

  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function adminLogoutAction() {
  await endSession("admin");
  redirect("/admin/login");
}
