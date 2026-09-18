// Signed JWT session cookies (jose). Safe to import from proxy.ts.
import { SignJWT, jwtVerify } from "jose";

export type SessionKind = "admin" | "customer";

export const SESSION_COOKIES: Record<SessionKind, string> = {
  admin: "jexi_admin",
  customer: "jexi_customer",
};

export const SESSION_MAX_AGE: Record<SessionKind, number> = {
  admin: 60 * 60 * 12, // 12 hours
  customer: 60 * 60 * 24 * 30, // 30 days
};

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to a random string of at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

/** `version` lets a password change/reset revoke every session signed before it. */
export async function signSession(kind: SessionKind, userId: string, version = 0): Promise<string> {
  return new SignJWT({ kind, v: version })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE[kind]}s`)
    .sign(secretKey());
}

export async function verifySessionClaims(token: string | undefined, kind: SessionKind): Promise<{ userId: string; version: number } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (payload.kind !== kind || typeof payload.sub !== "string") return null;
    return { userId: payload.sub, version: typeof payload.v === "number" ? payload.v : 0 };
  } catch {
    return null;
  }
}

export async function verifySession(token: string | undefined, kind: SessionKind): Promise<string | null> {
  return (await verifySessionClaims(token, kind))?.userId ?? null;
}
