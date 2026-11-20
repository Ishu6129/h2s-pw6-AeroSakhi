import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('lib/groq', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV, GROQ_API_KEY: 'test-api-key-12345' };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  describe('MODEL constants', () => {
    it('MODEL_FAST defaults to openai/gpt-oss-20b', async () => {
      const { MODEL_FAST } = await import('@/lib/groq');
      expect(MODEL_FAST).toBe('openai/gpt-oss-20b');
    });

    it('MODEL_VERSATILE defaults to openai/gpt-oss-120b', async () => {
      const { MODEL_VERSATILE } = await import('@/lib/groq');
      expect(MODEL_VERSATILE).toBe('openai/gpt-oss-120b');
    });
  });

  describe('getGroqClient', () => {
    it('returns a client object when GROQ_API_KEY is set', async () => {
      const { getGroqClient } = await import('@/lib/groq');
      const client = getGroqClient();
      expect(client).toBeDefined();
      expect(client).toHaveProperty('chat');
    });

    it('throws descriptive error when GROQ_API_KEY is missing', async () => {
      delete process.env.GROQ_API_KEY;
      const { getGroqClient } = await import('@/lib/groq');
      expect(() => getGroqClient()).toThrow('GROQ_API_KEY');
    });

    it('returns the same singleton instance on repeated calls', async () => {
      const { getGroqClient } = await import('@/lib/groq');
      const first = getGroqClient();
      const second = getGroqClient();
      expect(first).toBe(second);
    });

    it('error message mentions .env.local', async () => {
      delete process.env.GROQ_API_KEY;
      const { getGroqClient } = await import('@/lib/groq');
      try {
        getGroqClient();
        expect.fail('should have thrown');
      } catch (err) {
        expect((err as Error).message).toContain('.env.local');
      }
    });
  });

  describe('selectModel', () => {
    it('returns MODEL_FAST for simple complexity', async () => {
      const { selectModel, MODEL_FAST } = await import('@/lib/groq');
      expect(selectModel('simple')).toBe(MODEL_FAST);
    });

    it('returns MODEL_VERSATILE for moderate complexity', async () => {
      const { selectModel, MODEL_VERSATILE } = await import('@/lib/groq');
      expect(selectModel('moderate')).toBe(MODEL_VERSATILE);
    });

    it('returns MODEL_VERSATILE for complex complexity', async () => {
      const { selectModel, MODEL_VERSATILE } = await import('@/lib/groq');
      expect(selectModel('complex')).toBe(MODEL_VERSATILE);
    });
  });

  describe('createChatCompletion', () => {
    it('calls groq client with correct parameters', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [{ message: { content: 'Test response' } }],
      });

      vi.doMock('groq-sdk', () => ({
        default: vi.fn().mockImplementation(() => ({
          chat: { completions: { create: mockCreate } },
        })),
      }));

      const { createChatCompletion, MODEL_FAST } = await import('@/lib/groq');

      const result = await createChatCompletion({
        messages: [{ role: 'user', content: 'Hi' }],
        model: MODEL_FAST,
      });

      expect(result).toBe('Test response');
    });

    it('throws when response content is null', async () => {
      vi.doMock('groq-sdk', () => ({
        default: vi.fn().mockImplementation(() => ({
          chat: {
            completions: {
              create: vi.fn().mockResolvedValue({
                choices: [{ message: { content: null } }],
              }),
            },
          },
        })),
      }));

      const { createChatCompletion, MODEL_FAST } = await import('@/lib/groq');

      await expect(
        createChatCompletion({
          messages: [{ role: 'user', content: 'Hi' }],
          model: MODEL_FAST,
        }),
      ).rejects.toThrow('null content');
    });

    it('wraps API errors with descriptive message', async () => {
      vi.doMock('groq-sdk', () => ({
        default: vi.fn().mockImplementation(() => ({
          chat: {
            completions: {
              create: vi.fn().mockRejectedValue(new Error('API rate limited')),
            },
          },
        })),
      }));

      const { createChatCompletion, MODEL_FAST } = await import('@/lib/groq');

      await expect(
        createChatCompletion({
          messages: [{ role: 'user', content: 'Hi' }],
          model: MODEL_FAST,
        }),
      ).rejects.toThrow('Groq chat completion failed');
    });
  });
});
