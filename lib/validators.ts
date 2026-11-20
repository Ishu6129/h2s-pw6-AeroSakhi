import { z } from 'zod';
import type { ChatRequest, AnalyzeRequest, StreamRequest } from '@/types/aerosakhi';

// ── Constants ───────────────────────────────────────────────────────────────────

export const MAX_MESSAGE_LENGTH = 5000;
export const MAX_ROUTINES_COUNT = 20;
export const MAX_HISTORY_LENGTH = 20;

// ── Schemas ─────────────────────────────────────────────────────────────────────

export const locationSchema = z.object({
  city: z.string().min(1).max(100),
  region: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
});

export const userProfileSchema = z.object({
  location: locationSchema,
  householdSize: z.number().int().min(1).max(20).optional(),
  hasChildren: z.boolean().optional(),
  hasElderly: z.boolean().optional(),
  livingSpace: z.enum(['apartment', 'house', 'studio']).optional(),
  budget: z.enum(['low', 'medium', 'high']).optional(),
});

export const chatRequestSchema = z.object({
  message: z.string().min(1).max(MAX_MESSAGE_LENGTH),
  context: userProfileSchema.optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(MAX_MESSAGE_LENGTH),
      }),
    )
    .max(MAX_HISTORY_LENGTH)
    .optional(),
});

export const analyzeRequestSchema = z.object({
  routines: z.array(z.string().min(1).max(500)).min(1).max(MAX_ROUTINES_COUNT),
  location: locationSchema,
  preferences: z.array(z.string().max(200)).max(10).optional(),
});

export const streamRequestSchema = z.object({
  message: z.string().min(1).max(MAX_MESSAGE_LENGTH),
  context: userProfileSchema.optional(),
});

// ── Validation Functions ────────────────────────────────────────────────────────

export function validateChatRequest(data: unknown): ChatRequest {
  return chatRequestSchema.parse(data);
}

export function validateAnalyzeRequest(data: unknown): AnalyzeRequest {
  return analyzeRequestSchema.parse(data);
}

export function validateStreamRequest(data: unknown): StreamRequest {
  return streamRequestSchema.parse(data);
}
