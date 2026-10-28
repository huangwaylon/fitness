// Fixed-window in-memory rate limiter (single process, two users: good enough).
interface Bucket { count: number; resetAt: number }
const buckets = new Map<string, Bucket>();

export const LIMITS = {
  pair: { max: 5, windowMs: 10 * 60_000 },
  ingest: { max: 60, windowMs: 60_000 },
  api: { max: 120, windowMs: 60_000 }
} as const;

/** Returns true if allowed (and counts the hit). */
export function hit(key: string, limit: { max: number; windowMs: number }, nowMs = Date.now()): boolean {
  let b = buckets.get(key);
  if (!b || b.resetAt <= nowMs) {
    b = { count: 0, resetAt: nowMs + limit.windowMs };
    buckets.set(key, b);
  }
  b.count++;
  if (buckets.size > 10_000) for (const [k, v] of buckets) if (v.resetAt <= nowMs) buckets.delete(k);
  return b.count <= limit.max;
}

export function resetRateLimits(): void {
  buckets.clear();
}
