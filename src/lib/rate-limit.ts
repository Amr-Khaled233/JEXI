// Minimal in-memory fixed-window limiter for login forms. Per server instance —
// swap for Redis/Upstash if you run multiple instances.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit = 8, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 5000) {
      for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
    }
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}
