import type { ChunkResult } from '@/types/aerosakhi';

// ── Token budget constants ──────────────────────────────────────────────────
export const MAX_CONTEXT_TOKENS = 6000;
export const RESPONSE_BUFFER_TOKENS = 2000;
export const EFFECTIVE_MAX_TOKENS: number =
  MAX_CONTEXT_TOKENS - RESPONSE_BUFFER_TOKENS; // 4000

// ── Token estimation ────────────────────────────────────────────────────────

/**
 * Rough token estimate: ~4 characters per token (GPT-family heuristic).
 * Returns 0 for empty / whitespace-only strings.
 */
export function estimateTokens(text: string): number {
  if (text.length === 0) return 0;
  return Math.ceil(text.length / 4);
}

// ── Internal helpers ────────────────────────────────────────────────────────

/**
 * Split `text` by paragraph boundaries (double newline).
 * Preserves trailing newlines inside each segment so they can be
 * re-joined losslessly.
 */
function splitByParagraphs(text: string): string[] {
  return text.split(/\n\n+/).filter((s) => s.length > 0);
}

/**
 * Split `text` by single newline boundaries.
 */
function splitByLines(text: string): string[] {
  return text.split(/\n/).filter((s) => s.length > 0);
}

/**
 * Split `text` by sentence-ending punctuation (. ! ?),
 * keeping the punctuation attached to the preceding sentence.
 */
function splitBySentences(text: string): string[] {
  const parts: string[] = [];
  // Match sequences ending with one of .!? followed by whitespace or end-of-string
  const regex = /[^.!?]*[.!?]+[\s]*/g;
  let match: RegExpExecArray | null;
  let lastIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    parts.push(match[0]);
    lastIndex = regex.lastIndex;
  }

  // Remainder that didn't end with sentence punctuation
  if (lastIndex < text.length) {
    const remainder = text.slice(lastIndex);
    if (remainder.trim().length > 0) {
      parts.push(remainder);
    }
  }

  return parts.filter((s) => s.length > 0);
}

/**
 * Hard-split a single segment into pieces of at most `maxChars` characters.
 * Tries to break on the last whitespace before the limit so we never cut
 * mid-word when possible.
 */
function hardSplit(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];

  const pieces: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxChars) {
      pieces.push(remaining);
      break;
    }

    // Try to break at a whitespace boundary
    let splitIdx = remaining.lastIndexOf(' ', maxChars);
    if (splitIdx <= 0) {
      // No suitable whitespace – hard cut at maxChars
      splitIdx = maxChars;
    }

    pieces.push(remaining.slice(0, splitIdx));
    remaining = remaining.slice(splitIdx).trimStart();
  }

  return pieces;
}

/**
 * Recursively break `segments` so every segment fits within `maxTokens`.
 *
 * Strategy (from coarsest to finest):
 *   1. paragraphs  →  2. lines  →  3. sentences  →  4. hard char split
 */
function breakDown(
  segments: string[],
  maxTokens: number,
  level: number = 0,
): string[] {
  const maxChars = maxTokens * 4;
  const result: string[] = [];

  for (const seg of segments) {
    if (estimateTokens(seg) <= maxTokens) {
      result.push(seg);
      continue;
    }

    let subParts: string[];

    switch (level) {
      case 0:
        subParts = splitByParagraphs(seg);
        break;
      case 1:
        subParts = splitByLines(seg);
        break;
      case 2:
        subParts = splitBySentences(seg);
        break;
      default:
        // Final fallback: hard character split
        subParts = hardSplit(seg, maxChars);
        result.push(...subParts);
        continue;
    }

    // If the splitter didn't actually divide the text, escalate
    if (subParts.length <= 1) {
      result.push(...breakDown([seg], maxTokens, level + 1));
    } else {
      result.push(...breakDown(subParts, maxTokens, level + 1));
    }
  }

  return result;
}

/**
 * Merge consecutive small chunks so we don't produce tiny fragments.
 * We greedily accumulate chunks while they fit within `maxTokens`.
 */
function mergeSmallChunks(chunks: string[], maxTokens: number): string[] {
  if (chunks.length <= 1) return chunks;

  const merged: string[] = [];
  let buffer = '';

  for (const chunk of chunks) {
    const combined = buffer.length > 0 ? `${buffer}\n\n${chunk}` : chunk;

    if (estimateTokens(combined) <= maxTokens) {
      buffer = combined;
    } else {
      if (buffer.length > 0) {
        merged.push(buffer);
      }
      buffer = chunk;
    }
  }

  if (buffer.length > 0) {
    merged.push(buffer);
  }

  return merged;
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Smartly chunk a large input string so each piece fits within `maxTokens`.
 *
 * Splitting priority:
 *   1. Paragraph boundaries (double newline)
 *   2. Line boundaries (single newline)
 *   3. Sentence boundaries (. ! ?)
 *   4. Hard character split (never mid-word when possible)
 *
 * Tiny consecutive chunks are merged back together to stay close to the limit.
 */
export function chunkInput(
  text: string,
  maxTokens: number = EFFECTIVE_MAX_TOKENS,
): ChunkResult {
  const totalTokens = estimateTokens(text);

  // Edge cases: empty / whitespace-only
  if (text.length === 0 || text.trim().length === 0) {
    return {
      chunks: text.length === 0 ? [] : [text],
      totalTokens,
      wasChunked: false,
    };
  }

  // Fits in a single chunk
  if (totalTokens <= maxTokens) {
    return { chunks: [text], totalTokens, wasChunked: false };
  }

  // Hierarchical splitting
  const rawChunks = breakDown([text], maxTokens, 0);

  // Merge tiny fragments
  const chunks = mergeSmallChunks(rawChunks, maxTokens);

  return { chunks, totalTokens, wasChunked: true };
}
