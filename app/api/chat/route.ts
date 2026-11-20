import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { validateChatRequest } from '@/lib/validators';
import { checkRateLimit } from '@/lib/rate-limiter';
import { classifyQuery } from '@/lib/pollution-classifier';
import { chunkInput } from '@/lib/input-chunker';
import { createChatCompletion, selectModel } from '@/lib/groq';
import { getSystemPrompt } from '@/lib/prompt-templates';
import { generateCacheKey, getCachedResponse, setCachedResponse } from '@/lib/cache';
import type { ChatResponse } from '@/types/aerosakhi';

export const dynamic = 'force-dynamic';

function extractIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return 'anonymous';
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = extractIp(request);

  // ── Rate limit ──────────────────────────────────────────────────────
  const rateLimit = checkRateLimit(ip, 'chat');
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429, headers: rateLimit.headers },
    );
  }

  // ── Validate input ──────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body.' },
      { status: 400, headers: rateLimit.headers },
    );
  }

  let parsed: ReturnType<typeof validateChatRequest>;
  try {
    parsed = validateChatRequest(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed.', details: err.errors },
        { status: 400, headers: rateLimit.headers },
      );
    }
    return NextResponse.json(
      { error: 'Invalid request data.' },
      { status: 400, headers: rateLimit.headers },
    );
  }

  try {
    // ── Classify & route ────────────────────────────────────────────
    const classification = classifyQuery(parsed.message);
    const model = selectModel(classification.complexity);

    // ── Check cache (skip if conversation has history) ──────────────
    const hasHistory = parsed.history && parsed.history.length > 0;
    const cacheKey = hasHistory ? '' : generateCacheKey(model, parsed.message);

    if (!hasHistory && cacheKey) {
      const cached = getCachedResponse(cacheKey);
      if (cached) {
        const response: ChatResponse = {
          message: cached,
          model,
          complexity: classification.complexity,
        };
        return NextResponse.json(response, {
          status: 200,
          headers: { ...rateLimit.headers, 'X-Cache': 'HIT' },
        });
      }
    }

    // ── Chunk if needed ─────────────────────────────────────────────
    const { chunks } = chunkInput(parsed.message);
    const userContent = chunks.length > 1
      ? chunks.join('\n\n---\n\n')
      : parsed.message;

    // ── Build messages ──────────────────────────────────────────────
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: getSystemPrompt(parsed.context) },
    ];

    if (parsed.history) {
      for (const h of parsed.history) {
        messages.push({ role: h.role, content: h.content });
      }
    }

    messages.push({ role: 'user', content: userContent });

    // ── Call LLM ────────────────────────────────────────────────────
    const reply = await createChatCompletion({ messages, model });

    // ── Cache the response ──────────────────────────────────────────
    if (!hasHistory && cacheKey) {
      setCachedResponse(cacheKey, reply);
    }

    const response: ChatResponse = {
      message: reply,
      model,
      complexity: classification.complexity,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: { ...rateLimit.headers, 'X-Cache': 'MISS' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An internal error occurred.';
    return NextResponse.json(
      { error: message },
      { status: 500, headers: rateLimit.headers },
    );
  }
}
