import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { SESSION_COOKIES, SESSION_MAX_AGE, signSession, verifySession, verifySessionClaims, type SessionKind } from "@/lib/session";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function startSession(kind: SessionKind, userId: string, version = 0) {
  const token = await signSession(kind, userId, version);
  (await cookies()).set(SESSION_COOKIES[kind], token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE[kind],
  });
}

export async function endSession(kind: SessionKind) {
  (await cookies()).delete(SESSION_COOKIES[kind]);
}

async function sessionUserId(kind: SessionKind) {
  const token = (await cookies()).get(SESSION_COOKIES[kind])?.value;
  return verifySession(token, kind);
}

// ─── Admin ────────────────────────────────────────────────

export async function getAdmin() {
  const token = (await cookies()).get(SESSION_COOKIES.admin)?.value;
  const claims = await verifySessionClaims(token, "admin");
  if (!claims) return null;
  const admin = await db.adminUser.findUnique({
    where: { id: claims.userId },
    select: { id: true, name: true, email: true, role: true, sessionVersion: true },
  });
  // Sessions issued before the last password change/reset are no longer valid.
  if (!admin || admin.sessionVersion !== claims.version) return null;
  const { sessionVersion: _v, ...rest } = admin;
  return rest;
}

export type AdminSession = NonNullable<Awaited<ReturnType<typeof getAdmin>>>;

/** Use in every admin page and server action — the proxy alone is not a security boundary. */
export async function requireAdmin(): Promise<AdminSession> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function requireOwner(): Promise<AdminSession> {
  const admin = await requireAdmin();
  if (admin.role !== "OWNER") throw new Error("Only the store owner can do this.");
  return admin;
}

// ─── Customer ─────────────────────────────────────────────

export async function getCustomer() {
  const id = await sessionUserId("customer");
  if (!id) return null;
  return db.customer.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, phone: true },
  });
}

export type CustomerSession = NonNullable<Awaited<ReturnType<typeof getCustomer>>>;

export async function requireCustomer(): Promise<CustomerSession> {
  const customer = await getCustomer();
  if (!customer) redirect("/account/login");
  return customer;
}
