import type { RateLimitResult, UsageStats } from '@/types/aerosakhi';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type RateLimitEntry = { count: number; resetAt: number };
type RateLimitStore = Map<string, RateLimitEntry>;

// ---------------------------------------------------------------------------
// HMR-safe singleton store via globalThis
// ---------------------------------------------------------------------------
const GLOBAL_KEY = '__aerosakhi_rateLimitStore';

function getStore(): RateLimitStore {
  const existing = (globalThis as Record<string, unknown>)[GLOBAL_KEY] as
    | RateLimitStore
    | undefined;
  if (existing) return existing;
  const store = new Map<string, RateLimitEntry>();
  (globalThis as Record<string, unknown>)[GLOBAL_KEY] = store;
  return store;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
export const RATE_LIMIT_CONFIG = {
  DEFAULT_LIMIT: 30,
  DEFAULT_WINDOW_MS: 60_000,
  ENDPOINTS: {
    chat: { limit: 20, windowMs: 60_000 },
    analyze: { limit: 15, windowMs: 60_000 },
    stream: { limit: 25, windowMs: 60_000 },
    usage: { limit: 60, windowMs: 60_000 },
  },
} as const;

// ---------------------------------------------------------------------------
// Rate-limit check (sliding window)
// ---------------------------------------------------------------------------
export function checkRateLimit(
  ip: string,
  endpoint: string,
  limit?: number,
  windowMs?: number,
): RateLimitResult {
  const endpointConfig =
    RATE_LIMIT_CONFIG.ENDPOINTS[
      endpoint as keyof typeof RATE_LIMIT_CONFIG.ENDPOINTS
    ];

  const effectiveLimit =
    limit ?? endpointConfig?.limit ?? RATE_LIMIT_CONFIG.DEFAULT_LIMIT;
  const effectiveWindowMs =
    windowMs ?? endpointConfig?.windowMs ?? RATE_LIMIT_CONFIG.DEFAULT_WINDOW_MS;

  const store = getStore();
  const key = `${ip}:${endpoint}`;
  const now = Date.now();

  let entry = store.get(key);

  // If the window has expired (or no entry exists), reset the bucket.
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + effectiveWindowMs };
    store.set(key, entry);
  }

  // Increment the request count.
  entry.count += 1;

  const allowed = entry.count <= effectiveLimit;
  const remaining = Math.max(0, effectiveLimit - entry.count);
  const { resetAt } = entry;

  return {
    allowed,
    remaining,
    resetAt,
    headers: {
      'X-RateLimit-Limit': effectiveLimit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': resetAt.toString(),
    },
  };
}

// ---------------------------------------------------------------------------
// Usage statistics for a given IP
// ---------------------------------------------------------------------------
export function getUsageStats(ip: string): UsageStats {
  const store = getStore();
  const now = Date.now();

  let totalRequests = 0;
  let remainingRequests = 0;
  let windowResetAt = 0;

  const endpoints: Record<string, { count: number; limit: number }> = {};

  for (const [name, cfg] of Object.entries(RATE_LIMIT_CONFIG.ENDPOINTS)) {
    const key = `${ip}:${name}`;
    const entry = store.get(key);

    const count = entry && now < entry.resetAt ? entry.count : 0;
    const limit = cfg.limit;

    totalRequests += count;
    remainingRequests += Math.max(0, limit - count);

    if (entry && entry.resetAt > windowResetAt) {
      windowResetAt = entry.resetAt;
    }

    endpoints[name] = { count, limit };
  }

  return {
    totalRequests,
    remainingRequests,
    windowResetAt,
    endpoints,
  };
}
