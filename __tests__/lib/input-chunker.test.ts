import { describe, it, expect } from 'vitest';
import {
  chunkInput,
  estimateTokens,
  MAX_CONTEXT_TOKENS,
  RESPONSE_BUFFER_TOKENS,
  EFFECTIVE_MAX_TOKENS,
} from '@/lib/input-chunker';

describe('lib/input-chunker', () => {
  describe('constants', () => {
    it('MAX_CONTEXT_TOKENS is 6000', () => {
      expect(MAX_CONTEXT_TOKENS).toBe(6000);
    });

    it('RESPONSE_BUFFER_TOKENS is 2000', () => {
      expect(RESPONSE_BUFFER_TOKENS).toBe(2000);
    });

    it('EFFECTIVE_MAX_TOKENS equals MAX_CONTEXT_TOKENS - RESPONSE_BUFFER_TOKENS', () => {
      expect(EFFECTIVE_MAX_TOKENS).toBe(MAX_CONTEXT_TOKENS - RESPONSE_BUFFER_TOKENS);
      expect(EFFECTIVE_MAX_TOKENS).toBe(4000);
    });
  });

  describe('estimateTokens', () => {
    it('returns 0 for empty string', () => {
      expect(estimateTokens('')).toBe(0);
    });

    it('returns ceil(length / 4) for non-empty strings', () => {
      expect(estimateTokens('abcd')).toBe(1); // 4/4 = 1
      expect(estimateTokens('abcde')).toBe(2); // ceil(5/4) = 2
      expect(estimateTokens('a')).toBe(1); // ceil(1/4) = 1
    });

    it('handles long strings correctly', () => {
      const text = 'a'.repeat(1000);
      expect(estimateTokens(text)).toBe(250); // 1000/4 = 250
    });

    it('handles 8-char string as 2 tokens', () => {
      expect(estimateTokens('12345678')).toBe(2);
    });
  });

  describe('chunkInput', () => {
    it('returns short input as-is without chunking', () => {
      const result = chunkInput('Hello, world!');
      expect(result.wasChunked).toBe(false);
      expect(result.chunks).toEqual(['Hello, world!']);
      expect(result.totalTokens).toBe(estimateTokens('Hello, world!'));
    });

    it('returns empty array for empty string', () => {
      const result = chunkInput('');
      expect(result.chunks).toEqual([]);
      expect(result.wasChunked).toBe(false);
      expect(result.totalTokens).toBe(0);
    });

    it('does not chunk a single word', () => {
      const result = chunkInput('hello');
      expect(result.wasChunked).toBe(false);
      expect(result.chunks).toEqual(['hello']);
    });

    it('chunks long input (wasChunked is true)', () => {
      // Create input longer than EFFECTIVE_MAX_TOKENS * 4 chars
      const longText = Array.from({ length: 100 }, (_, i) =>
        `Paragraph ${i}: ${'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(5)}`,
      ).join('\n\n');

      const result = chunkInput(longText);
      expect(result.wasChunked).toBe(true);
      expect(result.chunks.length).toBeGreaterThan(1);
    });

    it('totalTokens matches estimateTokens of original text', () => {
      const text = 'A'.repeat(20000);
      const result = chunkInput(text);
      expect(result.totalTokens).toBe(estimateTokens(text));
    });

    it('no chunk exceeds maxTokens', () => {
      const longText = Array.from({ length: 200 }, (_, i) =>
        `Section ${i}: This is a moderately long sentence about air quality and pollution effects.`,
      ).join('\n\n');

      const maxTokens = 100;
      const result = chunkInput(longText, maxTokens);

      for (const chunk of result.chunks) {
        expect(estimateTokens(chunk)).toBeLessThanOrEqual(maxTokens);
      }
    });

    it('respects custom maxTokens parameter', () => {
      const text = 'Short sentence one. Short sentence two. Short sentence three. Short sentence four.';
      const result = chunkInput(text, 5); // Very small token limit
      expect(result.chunks.length).toBeGreaterThanOrEqual(1);
    });

    it('chunks at paragraph boundaries when possible', () => {
      const text = 'Paragraph one content here.\n\nParagraph two content here.\n\nParagraph three content here.';
      // With a small maxTokens that fits ~1 paragraph
      const result = chunkInput(text, 10);
      expect(result.chunks.length).toBeGreaterThanOrEqual(2);
    });

    it('handles whitespace-only input without error', () => {
      const result = chunkInput('   \n\n   ');
      expect(result.wasChunked).toBe(false);
    });

    it('handles single very long line by hard splitting', () => {
      const longLine = 'word '.repeat(5000); // ~25000 chars, no newlines
      const result = chunkInput(longLine, 500);
      expect(result.wasChunked).toBe(true);
      expect(result.chunks.length).toBeGreaterThan(1);
    });

    it('preserves content across chunks (no data loss)', () => {
      const paragraphs = Array.from({ length: 20 }, (_, i) => `Paragraph ${i} content.`);
      const text = paragraphs.join('\n\n');
      const result = chunkInput(text, 20);

      // All original paragraphs should appear somewhere in the chunks
      const joined = result.chunks.join(' ');
      for (const p of paragraphs) {
        expect(joined).toContain(p);
      }
    });
  });
});
