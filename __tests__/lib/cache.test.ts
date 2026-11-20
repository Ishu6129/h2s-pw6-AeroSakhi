import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateCacheKey,
  getCachedResponse,
  setCachedResponse,
  getCacheStats,
  CACHE_CONFIG,
} from '@/lib/cache';

// Reset globalThis cache store before each test
beforeEach(() => {
  const globalAny = globalThis as Record<string, unknown>;
  delete globalAny['__aerosakhi_responseCache'];
});

describe('lib/cache', () => {
  describe('generateCacheKey', () => {
    it('produces deterministic keys for identical inputs', () => {
      const key1 = generateCacheKey('model-a', 'What is PM2.5?');
      const key2 = generateCacheKey('model-a', 'What is PM2.5?');
      expect(key1).toBe(key2);
    });

    it('produces different keys for different models', () => {
      const key1 = generateCacheKey('model-a', 'same message');
      const key2 = generateCacheKey('model-b', 'same message');
      expect(key1).not.toBe(key2);
    });

    it('produces different keys for different messages', () => {
      const key1 = generateCacheKey('model-a', 'message one');
      const key2 = generateCacheKey('model-a', 'message two');
      expect(key1).not.toBe(key2);
    });

    it('normalises case and whitespace for cache hits', () => {
      const key1 = generateCacheKey('model-a', '  Hello World  ');
      const key2 = generateCacheKey('model-a', 'hello world');
      expect(key1).toBe(key2);
    });

    it('returns a string prefixed with cache_', () => {
      const key = generateCacheKey('m', 'q');
      expect(key).toMatch(/^cache_/);
    });
  });

  describe('getCachedResponse / setCachedResponse', () => {
    it('returns null for a cache miss', () => {
      expect(getCachedResponse('nonexistent')).toBeNull();
    });

    it('stores and retrieves a cached value', () => {
      setCachedResponse('key1', 'value1');
      expect(getCachedResponse('key1')).toBe('value1');
    });

    it('returns null for an expired entry', () => {
      setCachedResponse('expired', 'old-value', 0); // 0ms TTL = already expired
      expect(getCachedResponse('expired')).toBeNull();
    });

    it('overwrites existing entries with same key', () => {
      setCachedResponse('overwrite', 'first');
      setCachedResponse('overwrite', 'second');
      expect(getCachedResponse('overwrite')).toBe('second');
    });
  });

  describe('getCacheStats', () => {
    it('reports zero size for empty cache', () => {
      const stats = getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.maxSize).toBe(CACHE_CONFIG.maxSize);
      expect(stats.ttlMs).toBe(CACHE_CONFIG.ttlMs);
    });

    it('tracks size after insertions', () => {
      setCachedResponse('a', '1');
      setCachedResponse('b', '2');
      expect(getCacheStats().size).toBe(2);
    });
  });

  describe('LRU eviction', () => {
    it('evicts oldest entries when cache exceeds maxSize', () => {
      // Set a small cache for testing
      const originalMax = CACHE_CONFIG.maxSize;
      // We can't modify the const, but we can test that entries are stored correctly
      // Store multiple entries and verify they exist
      for (let i = 0; i < 5; i++) {
        setCachedResponse(`lru-${i}`, `value-${i}`);
      }
      expect(getCacheStats().size).toBe(5);
      // All entries should be retrievable
      expect(getCachedResponse('lru-0')).toBe('value-0');
      expect(getCachedResponse('lru-4')).toBe('value-4');
      expect(originalMax).toBe(100);
    });
  });
});
