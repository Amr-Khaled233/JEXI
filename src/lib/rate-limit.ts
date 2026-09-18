import { headers } from "next/headers";
import { db } from "@/lib/db";

/**
 * Fixed-window rate limiter stored in Postgres, so the limit holds across all
 * serverless instances (an in-memory counter would reset per instance on Vercel).
 * Returns true if the request is allowed.
 */
export async function rateLimit(key: string, limit = 8, windowMs = 60_000): Promise<boolean> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt") VALUES (${key}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count"   = CASE WHEN "RateLimit"."resetAt" < ${now} THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" < ${now} THEN ${resetAt} ELSE "RateLimit"."resetAt" END
    RETURNING "count"`;

  // Occasionally clear out stale counters.
  if (Math.random() < 0.01) {
    await db.rateLimit.deleteMany({ where: { resetAt: { lt: new Date(now.getTime() - 3_600_000) } } });
  }
  return Number(rows[0]?.count ?? 0) <= limit;
}

/** Client IP. On Vercel, x-forwarded-for is set by the platform and can't be spoofed by the client. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}
