import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  checkRateLimit,
  getUsageStats,
  RATE_LIMIT_CONFIG,
} from '@/lib/rate-limiter';

describe('lib/rate-limiter', () => {
  beforeEach(() => {
    // Clear the global store before each test
    const key = '__aerosakhi_rateLimitStore';
    (globalThis as Record<string, unknown>)[key] = undefined;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('RATE_LIMIT_CONFIG', () => {
    it('has expected default limit of 30', () => {
      expect(RATE_LIMIT_CONFIG.DEFAULT_LIMIT).toBe(30);
    });

    it('has expected default window of 60000ms', () => {
      expect(RATE_LIMIT_CONFIG.DEFAULT_WINDOW_MS).toBe(60_000);
    });

    it('defines endpoint configs for chat, analyze, stream, usage', () => {
      expect(RATE_LIMIT_CONFIG.ENDPOINTS).toHaveProperty('chat');
      expect(RATE_LIMIT_CONFIG.ENDPOINTS).toHaveProperty('analyze');
      expect(RATE_LIMIT_CONFIG.ENDPOINTS).toHaveProperty('stream');
      expect(RATE_LIMIT_CONFIG.ENDPOINTS).toHaveProperty('usage');
    });
  });

  describe('checkRateLimit', () => {
    it('allows the first request', () => {
      const result = checkRateLimit('1.2.3.4', 'chat');
      expect(result.allowed).toBe(true);
    });

    it('allows requests within the limit', () => {
      const limit = RATE_LIMIT_CONFIG.ENDPOINTS.chat.limit;
      for (let i = 0; i < limit; i++) {
        const result = checkRateLimit('1.2.3.4', 'chat');
        expect(result.allowed).toBe(true);
      }
    });

    it('denies requests exceeding the limit', () => {
      const limit = RATE_LIMIT_CONFIG.ENDPOINTS.chat.limit;
      for (let i = 0; i < limit; i++) {
        checkRateLimit('1.2.3.4', 'chat');
      }
      const result = checkRateLimit('1.2.3.4', 'chat');
      expect(result.allowed).toBe(false);
    });

    it('resets counter after window expires', () => {
      const limit = RATE_LIMIT_CONFIG.ENDPOINTS.chat.limit;
      // Exhaust limit
      for (let i = 0; i < limit; i++) {
        checkRateLimit('1.2.3.4', 'chat');
      }
      expect(checkRateLimit('1.2.3.4', 'chat').allowed).toBe(false);

      // Advance past window
      vi.advanceTimersByTime(RATE_LIMIT_CONFIG.ENDPOINTS.chat.windowMs + 1);

      const result = checkRateLimit('1.2.3.4', 'chat');
      expect(result.allowed).toBe(true);
    });

    it('tracks different IPs independently', () => {
      const limit = RATE_LIMIT_CONFIG.ENDPOINTS.chat.limit;
      // Exhaust limit for IP A
      for (let i = 0; i < limit; i++) {
        checkRateLimit('10.0.0.1', 'chat');
      }
      expect(checkRateLimit('10.0.0.1', 'chat').allowed).toBe(false);

      // IP B should still be allowed
      const result = checkRateLimit('10.0.0.2', 'chat');
      expect(result.allowed).toBe(true);
    });

    it('tracks different endpoints independently', () => {
      const chatLimit = RATE_LIMIT_CONFIG.ENDPOINTS.chat.limit;
      // Exhaust chat limit
      for (let i = 0; i < chatLimit; i++) {
        checkRateLimit('1.2.3.4', 'chat');
      }
      expect(checkRateLimit('1.2.3.4', 'chat').allowed).toBe(false);

      // Analyze endpoint should still be allowed
      const result = checkRateLimit('1.2.3.4', 'analyze');
      expect(result.allowed).toBe(true);
    });

    it('returns correct remaining count', () => {
      const limit = RATE_LIMIT_CONFIG.ENDPOINTS.chat.limit;
      const first = checkRateLimit('1.2.3.4', 'chat');
      expect(first.remaining).toBe(limit - 1);

      const second = checkRateLimit('1.2.3.4', 'chat');
      expect(second.remaining).toBe(limit - 2);
    });

    it('returns X-RateLimit-Limit header', () => {
      const result = checkRateLimit('1.2.3.4', 'chat');
      expect(result.headers['X-RateLimit-Limit']).toBe(
        RATE_LIMIT_CONFIG.ENDPOINTS.chat.limit.toString(),
      );
    });

    it('returns X-RateLimit-Remaining header that decrements', () => {
      const limit = RATE_LIMIT_CONFIG.ENDPOINTS.chat.limit;
      const first = checkRateLimit('1.2.3.4', 'chat');
      expect(first.headers['X-RateLimit-Remaining']).toBe((limit - 1).toString());

      const second = checkRateLimit('1.2.3.4', 'chat');
      expect(second.headers['X-RateLimit-Remaining']).toBe((limit - 2).toString());
    });

    it('returns X-RateLimit-Reset header', () => {
      const result = checkRateLimit('1.2.3.4', 'chat');
      expect(result.headers['X-RateLimit-Reset']).toBeDefined();
      const resetAt = parseInt(result.headers['X-RateLimit-Reset'], 10);
      expect(resetAt).toBeGreaterThan(0);
    });

    it('respects custom limit and window overrides', () => {
      const result1 = checkRateLimit('1.2.3.4', 'custom', 2, 5000);
      expect(result1.allowed).toBe(true);

      const result2 = checkRateLimit('1.2.3.4', 'custom', 2, 5000);
      expect(result2.allowed).toBe(true);

      const result3 = checkRateLimit('1.2.3.4', 'custom', 2, 5000);
      expect(result3.allowed).toBe(false);
    });

    it('remaining never goes below 0', () => {
      const limit = RATE_LIMIT_CONFIG.ENDPOINTS.chat.limit;
      for (let i = 0; i < limit + 5; i++) {
        checkRateLimit('1.2.3.4', 'chat');
      }
      const result = checkRateLimit('1.2.3.4', 'chat');
      expect(result.remaining).toBe(0);
    });
  });

  describe('getUsageStats', () => {
    it('returns correct structure with all endpoints', () => {
      const stats = getUsageStats('1.2.3.4');
      expect(stats).toHaveProperty('totalRequests');
      expect(stats).toHaveProperty('remainingRequests');
      expect(stats).toHaveProperty('windowResetAt');
      expect(stats).toHaveProperty('endpoints');
      expect(Object.keys(stats.endpoints)).toEqual(
        expect.arrayContaining(['chat', 'analyze', 'stream', 'usage']),
      );
    });

    it('reflects requests made via checkRateLimit', () => {
      checkRateLimit('5.5.5.5', 'chat');
      checkRateLimit('5.5.5.5', 'chat');
      checkRateLimit('5.5.5.5', 'analyze');

      const stats = getUsageStats('5.5.5.5');
      expect(stats.totalRequests).toBe(3);
      expect(stats.endpoints.chat.count).toBe(2);
      expect(stats.endpoints.analyze.count).toBe(1);
    });

    it('returns 0 counts for unused IPs', () => {
      const stats = getUsageStats('unused-ip');
      expect(stats.totalRequests).toBe(0);
      expect(stats.endpoints.chat.count).toBe(0);
    });
  });
});
