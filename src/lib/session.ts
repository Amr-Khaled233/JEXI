// Signed JWT session cookies for the admin dashboard (jose). Safe to import from proxy.ts.
import { SignJWT, jwtVerify } from "jose";

export type SessionKind = "admin";

export const SESSION_COOKIES: Record<SessionKind, string> = {
  admin: "jexi_admin",
};

export const SESSION_MAX_AGE: Record<SessionKind, number> = {
  admin: 60 * 60 * 12, // 12 hours
};

// Values that appear in docs/examples. Anyone could forge sessions with them.
const PLACEHOLDER_SECRETS = new Set(["change-me-to-a-long-random-string"]);

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32 || PLACEHOLDER_SECRETS.has(secret)) {
    throw new Error("SESSION_SECRET must be set to your own random string of at least 32 characters (see .env.example)");
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
