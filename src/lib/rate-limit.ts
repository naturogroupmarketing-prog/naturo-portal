/**
 * Rate limiter — works with or without Redis.
 *
 * If UPSTASH_REDIS_REST_URL is set → uses Upstash Redis (production).
 * Otherwise → uses in-memory store (development).
 */

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number; // epoch ms when the window resets
}

// ─── In-Memory Store (Development) ──────────────────────

interface MemoryEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, MemoryEntry>();

// Clean up expired entries every 60 seconds
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore) {
      if (entry.resetAt < now) {
        memoryStore.delete(key);
      }
    }
  }, 60000);
}

function memoryRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: maxRequests - 1, reset: now + windowMs };
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return { success: false, remaining: 0, reset: entry.resetAt };
  }

  return {
    success: true,
    remaining: maxRequests - entry.count,
    reset: entry.resetAt,
  };
}

// ─── Upstash Redis Store (Production) ───────────────────

let upstashLimiter: {
  limit: (key: string) => Promise<{ success: boolean; remaining: number; reset: number }>;
} | null = null;

async function getUpstashLimiter(maxRequests: number, windowSec: number) {
  if (upstashLimiter) return upstashLimiter;

  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    upstashLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowSec} s`),
      analytics: true,
    });

    return upstashLimiter;
  } catch {
    return null;
  }
}

// ─── Public API ─────────────────────────────────────────

export interface RateLimitConfig {
  /** Max requests per window */
  maxRequests: number;
  /** Window duration in seconds */
  windowSec: number;
}

/** Default rate limits for different endpoints */
export const RATE_LIMITS = {
  /** API routes — generous for normal use */
  api: { maxRequests: 60, windowSec: 60 } as RateLimitConfig,
  /** AI chat — more restrictive to control Anthropic costs */
  aiChat: { maxRequests: 10, windowSec: 60 } as RateLimitConfig,
  /** File uploads */
  upload: { maxRequests: 20, windowSec: 60 } as RateLimitConfig,
  /** Auth attempts */
  auth: { maxRequests: 5, windowSec: 300 } as RateLimitConfig,
  /** Server actions (mutations) */
  action: { maxRequests: 30, windowSec: 60 } as RateLimitConfig,
};

/**
 * Check rate limit for a given identifier (user ID, IP, etc.).
 *
 * @param identifier - Unique identifier for the rate limit (e.g., userId or IP)
 * @param config - Rate limit configuration
 * @returns Whether the request is allowed
 */
export async function rateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMITS.api
): Promise<RateLimitResult> {
  const key = `rl:${identifier}`;

  // Use Upstash in production
  if (process.env.UPSTASH_REDIS_REST_URL) {
    const limiter = await getUpstashLimiter(
      config.maxRequests,
      config.windowSec
    );
    if (limiter) {
      const result = await limiter.limit(key);
      return {
        success: result.success,
        remaining: result.remaining,
        reset: result.reset,
      };
    }
  }

  // Fallback to in-memory
  return memoryRateLimit(key, config.maxRequests, config.windowSec * 1000);
}

/**
 * Get rate limit headers for HTTP responses.
 */
export function rateLimitHeaders(result: RateLimitResult) {
  return {
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": new Date(result.reset).toISOString(),
    ...(result.success ? {} : { "Retry-After": Math.ceil((result.reset - Date.now()) / 1000).toString() }),
  };
}
