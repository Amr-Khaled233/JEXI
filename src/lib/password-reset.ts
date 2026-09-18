import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";

export const RESET_TOKEN_TTL_MINUTES = 30;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** Create a single-use reset token for an admin, replacing any unused ones. Returns the raw token (only ever sent by email). */
export async function createAdminResetToken(adminId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await db.$transaction([
    db.adminPasswordReset.deleteMany({ where: { adminId, usedAt: null } }),
    db.adminPasswordReset.create({
      data: { adminId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60_000) },
    }),
  ]);
  return token;
}

/** Look up a token that is unused and not expired. */
export async function findValidResetToken(token: string) {
  if (!token || token.length > 200) return null;
  const reset = await db.adminPasswordReset.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { admin: { select: { id: true, name: true, email: true } } },
  });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) return null;
  return reset;
}

/**
 * Set the new password, burn the token, and bump the session version so every
 * existing session for this admin is signed out. Returns false if the token is invalid.
 */
export async function consumeAdminResetToken(token: string, passwordHash: string): Promise<boolean> {
  const reset = await findValidResetToken(token);
  if (!reset) return false;
  const claimed = await db.adminPasswordReset.updateMany({ where: { id: reset.id, usedAt: null }, data: { usedAt: new Date() } });
  if (claimed.count === 0) return false; // used concurrently
  await db.$transaction([
    db.adminUser.update({ where: { id: reset.adminId }, data: { passwordHash, sessionVersion: { increment: 1 } } }),
    db.adminPasswordReset.deleteMany({ where: { adminId: reset.adminId, usedAt: null } }),
  ]);
  return true;
}

