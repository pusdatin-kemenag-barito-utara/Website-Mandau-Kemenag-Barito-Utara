interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

/**
 * In-memory sliding window rate limiter.
 * @param key Unique key to track (e.g. `login:192.168.1.1`)
 * @param limit Max allowed attempts (default: 5)
 * @param windowMs Time window in milliseconds (default: 15 minutes)
 */
export function checkRateLimit(
  key: string,
  limit = 5,
  windowMs = 15 * 60 * 1000,
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  // Clean expired entries periodically if map grows large
  if (rateLimitMap.size > 10000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (v.resetTime < now) {
        rateLimitMap.delete(k);
      }
    }
  }

  if (!record || record.resetTime < now) {
    // New or expired window
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetMs: windowMs,
    };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetMs: record.resetTime - now,
    };
  }

  record.count += 1;
  rateLimitMap.set(key, record);

  return {
    allowed: true,
    remaining: limit - record.count,
    resetMs: record.resetTime - now,
  };
}

/**
 * Reset rate limit for a specific key upon successful action (e.g. successful login)
 */
export function clearRateLimit(key: string): void {
  rateLimitMap.delete(key);
}
