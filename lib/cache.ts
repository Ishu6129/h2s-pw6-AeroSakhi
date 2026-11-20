/**
 * @module cache
 * Lightweight LRU (Least Recently Used) response cache with TTL expiration.
 * Prevents redundant LLM calls for identical queries, reducing latency and
 * token consumption. Uses `globalThis` for HMR persistence in development.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  /** Cached value. */
  value: T;
  /** Unix epoch (ms) when this entry expires. */
  expiresAt: number;
  /** Last access timestamp for LRU eviction. */
  lastAccessed: number;
}

interface CacheConfig {
  /** Maximum number of entries in the cache. */
  maxSize: number;
  /** Time-to-live in milliseconds for each entry. */
  ttlMs: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default cache configuration. */
export const CACHE_CONFIG: Readonly<CacheConfig> = {
  maxSize: 100,
  ttlMs: 5 * 60 * 1000, // 5 minutes
} as const;

// ---------------------------------------------------------------------------
// HMR-safe singleton via globalThis
// ---------------------------------------------------------------------------

const GLOBAL_KEY = '__aerosakhi_responseCache';

type CacheStore = Map<string, CacheEntry<string>>;

function getStore(): CacheStore {
  const existing = (globalThis as Record<string, unknown>)[GLOBAL_KEY] as
    | CacheStore
    | undefined;
  if (existing) return existing;
  const store = new Map<string, CacheEntry<string>>();
  (globalThis as Record<string, unknown>)[GLOBAL_KEY] = store;
  return store;
}

// ---------------------------------------------------------------------------
// Cache key generation
// ---------------------------------------------------------------------------

/**
 * Generates a deterministic cache key from the model name and message content.
 * Uses a simple hash to keep keys short and collision-resistant.
 */
export function generateCacheKey(model: string, message: string): string {
  const input = `${model}::${message.trim().toLowerCase()}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return `cache_${hash.toString(36)}`;
}

// ---------------------------------------------------------------------------
// LRU eviction
// ---------------------------------------------------------------------------

/**
 * Evicts the least recently accessed entry when the cache exceeds `maxSize`.
 */
function evictLRU(store: CacheStore, maxSize: number): void {
  while (store.size >= maxSize) {
    let oldestKey = '';
    let oldestTime = Infinity;

    for (const [key, entry] of store) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      store.delete(oldestKey);
    } else {
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Retrieves a cached response for the given key, if it exists and has not expired.
 * Returns `null` on cache miss or expiration.
 */
export function getCachedResponse(key: string): string | null {
  const store = getStore();
  const entry = store.get(key);

  if (!entry) return null;

  const now = Date.now();

  // Expired — remove and return miss
  if (now >= entry.expiresAt) {
    store.delete(key);
    return null;
  }

  // Update last accessed for LRU tracking
  entry.lastAccessed = now;
  return entry.value;
}

/**
 * Stores a response in the cache with the configured TTL.
 * Triggers LRU eviction if the cache exceeds `maxSize`.
 */
export function setCachedResponse(
  key: string,
  value: string,
  ttlMs: number = CACHE_CONFIG.ttlMs,
): void {
  const store = getStore();
  const now = Date.now();

  // Evict if at capacity
  evictLRU(store, CACHE_CONFIG.maxSize);

  store.set(key, {
    value,
    expiresAt: now + ttlMs,
    lastAccessed: now,
  });
}

/**
 * Returns current cache statistics for observability.
 */
export function getCacheStats(): { size: number; maxSize: number; ttlMs: number } {
  const store = getStore();
  return {
    size: store.size,
    maxSize: CACHE_CONFIG.maxSize,
    ttlMs: CACHE_CONFIG.ttlMs,
  };
}
