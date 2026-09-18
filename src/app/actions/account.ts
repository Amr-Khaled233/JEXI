"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { endSession, hashPassword, requireCustomer, startSession, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { isValidEgyptianMobile, normalizePhone } from "@/lib/utils";

export type FormState = { error?: string; fieldErrors?: Record<string, string>; success?: string } | undefined;

function safeNext(value: FormDataEntryValue | null, fallback = "/account") {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[String(issue.path[0])] ??= issue.message;
  return out;
}

async function clientIp() {
  return (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

const registerSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(100),
  email: z.email("Please enter a valid email.").transform((e) => e.toLowerCase()),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || isValidEgyptianMobile(v), "Please enter a valid Egyptian mobile number."),
  password: z.string().min(8, "Use at least 8 characters.").max(200),
});

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const { name, email, phone, password } = parsed.data;

  if (!rateLimit(`register:${await clientIp()}`, 5)) return { error: "Too many attempts. Please try again in a minute." };
  if (await db.customer.findUnique({ where: { email } })) {
    return { fieldErrors: { email: "An account with this email already exists. Try signing in." } };
  }

  const customer = await db.customer.create({
    data: { name, email, phone: phone ? normalizePhone(phone) : null, passwordHash: await hashPassword(password) },
  });
  // Attach any guest orders placed with this email.
  await db.order.updateMany({ where: { email, customerId: null }, data: { customerId: customer.id } });

  await startSession("customer", customer.id);
  redirect(safeNext(formData.get("next")));
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Please enter your email and password." };
  if (!rateLimit(`login:${await clientIp()}:${email}`, 8)) return { error: "Too many attempts. Please try again in a minute." };

  const customer = await db.customer.findUnique({ where: { email } });
  if (!customer || !(await verifyPassword(password, customer.passwordHash))) {
    return { error: "Incorrect email or password." };
  }
  await startSession("customer", customer.id);
  redirect(safeNext(formData.get("next")));
}

export async function logoutAction() {
  await endSession("customer");
  redirect("/");
}

const addressSchema = z.object({
  label: z.string().trim().max(40).optional(),
  fullName: z.string().trim().min(2, "Required").max(100),
  phone: z.string().trim().refine(isValidEgyptianMobile, "Enter a valid Egyptian mobile number."),
  governorate: z.string().trim().min(1, "Required"),
  area: z.string().trim().min(2, "Required").max(100),
  address: z.string().trim().min(5, "Required").max(300),
});

export async function addAddressAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const customer = await requireCustomer();
  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const count = await db.address.count({ where: { customerId: customer.id } });
  if (count >= 10) return { error: "You can save up to 10 addresses." };
  await db.address.create({
    data: { ...parsed.data, label: parsed.data.label || null, phone: normalizePhone(parsed.data.phone), customerId: customer.id, isDefault: count === 0 },
  });
  revalidatePath("/account");
  return { success: "Address saved." };
}

export async function deleteAddressAction(formData: FormData) {
  const customer = await requireCustomer();
  const id = String(formData.get("id"));
  const address = await db.address.findFirst({ where: { id, customerId: customer.id } });
  if (!address) return;
  await db.address.delete({ where: { id } });
  if (address.isDefault) {
    const next = await db.address.findFirst({ where: { customerId: customer.id }, orderBy: { createdAt: "desc" } });
    if (next) await db.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }
  revalidatePath("/account");
}

export async function setDefaultAddressAction(formData: FormData) {
  const customer = await requireCustomer();
  const id = String(formData.get("id"));
  const address = await db.address.findFirst({ where: { id, customerId: customer.id } });
  if (!address) return;
  await db.$transaction([
    db.address.updateMany({ where: { customerId: customer.id }, data: { isDefault: false } }),
    db.address.update({ where: { id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/account");
}
