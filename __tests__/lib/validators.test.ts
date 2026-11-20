import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import {
  validateChatRequest,
  validateAnalyzeRequest,
  validateStreamRequest,
  chatRequestSchema,
  analyzeRequestSchema,
  streamRequestSchema,
  MAX_MESSAGE_LENGTH,
  MAX_ROUTINES_COUNT,
  MAX_HISTORY_LENGTH,
} from '@/lib/validators';

describe('lib/validators', () => {
  describe('constants', () => {
    it('MAX_MESSAGE_LENGTH is 5000', () => {
      expect(MAX_MESSAGE_LENGTH).toBe(5000);
    });

    it('MAX_ROUTINES_COUNT is 20', () => {
      expect(MAX_ROUTINES_COUNT).toBe(20);
    });

    it('MAX_HISTORY_LENGTH is 20', () => {
      expect(MAX_HISTORY_LENGTH).toBe(20);
    });
  });

  describe('chatRequestSchema / validateChatRequest', () => {
    it('accepts a valid minimal chat request', () => {
      const result = validateChatRequest({ message: 'Hello' });
      expect(result.message).toBe('Hello');
    });

    it('accepts a full chat request with context and history', () => {
      const result = validateChatRequest({
        message: 'How is the air quality?',
        context: {
          location: { city: 'Delhi' },
          householdSize: 4,
          hasChildren: true,
        },
        history: [
          { role: 'user', content: 'Hi' },
          { role: 'assistant', content: 'Hello!' },
        ],
      });
      expect(result.message).toBe('How is the air quality?');
      expect(result.context?.location.city).toBe('Delhi');
      expect(result.history).toHaveLength(2);
    });

    it('rejects missing message field', () => {
      expect(() => validateChatRequest({})).toThrow(ZodError);
    });

    it('rejects empty message', () => {
      expect(() => validateChatRequest({ message: '' })).toThrow(ZodError);
    });

    it('rejects message exceeding MAX_MESSAGE_LENGTH', () => {
      const longMessage = 'a'.repeat(MAX_MESSAGE_LENGTH + 1);
      expect(() => validateChatRequest({ message: longMessage })).toThrow(ZodError);
    });

    it('rejects history with invalid role', () => {
      expect(() =>
        validateChatRequest({
          message: 'Hello',
          history: [{ role: 'system', content: 'test' }],
        }),
      ).toThrow(ZodError);
    });

    it('rejects history exceeding MAX_HISTORY_LENGTH', () => {
      const longHistory = Array.from({ length: MAX_HISTORY_LENGTH + 1 }, () => ({
        role: 'user' as const,
        content: 'msg',
      }));
      expect(() =>
        validateChatRequest({ message: 'Hi', history: longHistory }),
      ).toThrow(ZodError);
    });

    it('rejects invalid location (empty city)', () => {
      expect(() =>
        validateChatRequest({
          message: 'Hello',
          context: { location: { city: '' } },
        }),
      ).toThrow(ZodError);
    });

    it('exports chatRequestSchema as a Zod schema', () => {
      expect(chatRequestSchema).toBeDefined();
      expect(typeof chatRequestSchema.parse).toBe('function');
    });
  });

  describe('analyzeRequestSchema / validateAnalyzeRequest', () => {
    it('accepts a valid analyze request', () => {
      const result = validateAnalyzeRequest({
        routines: ['Drive to work', 'Cook with gas'],
        location: { city: 'Mumbai' },
      });
      expect(result.routines).toHaveLength(2);
      expect(result.location.city).toBe('Mumbai');
    });

    it('rejects empty routines array', () => {
      expect(() =>
        validateAnalyzeRequest({
          routines: [],
          location: { city: 'Delhi' },
        }),
      ).toThrow(ZodError);
    });

    it('rejects too many routines', () => {
      const tooMany = Array.from({ length: MAX_ROUTINES_COUNT + 1 }, (_, i) => `Routine ${i}`);
      expect(() =>
        validateAnalyzeRequest({
          routines: tooMany,
          location: { city: 'Delhi' },
        }),
      ).toThrow(ZodError);
    });

    it('accepts optional preferences', () => {
      const result = validateAnalyzeRequest({
        routines: ['Walk to work'],
        location: { city: 'Bangalore' },
        preferences: ['eco-friendly'],
      });
      expect(result.preferences).toEqual(['eco-friendly']);
    });

    it('exports analyzeRequestSchema as a Zod schema', () => {
      expect(analyzeRequestSchema).toBeDefined();
      expect(typeof analyzeRequestSchema.parse).toBe('function');
    });
  });

  describe('streamRequestSchema / validateStreamRequest', () => {
    it('accepts a valid stream request', () => {
      const result = validateStreamRequest({ message: 'Tell me about PM2.5' });
      expect(result.message).toBe('Tell me about PM2.5');
    });

    it('rejects empty message', () => {
      expect(() => validateStreamRequest({ message: '' })).toThrow(ZodError);
    });

    it('rejects message exceeding max length', () => {
      const longMessage = 'x'.repeat(MAX_MESSAGE_LENGTH + 1);
      expect(() => validateStreamRequest({ message: longMessage })).toThrow(ZodError);
    });

    it('accepts optional context', () => {
      const result = validateStreamRequest({
        message: 'Hello',
        context: { location: { city: 'Chennai' } },
      });
      expect(result.context?.location.city).toBe('Chennai');
    });

    it('exports streamRequestSchema as a Zod schema', () => {
      expect(streamRequestSchema).toBeDefined();
      expect(typeof streamRequestSchema.parse).toBe('function');
    });
  });
});
