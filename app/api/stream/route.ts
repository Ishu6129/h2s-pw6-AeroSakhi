import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { validateStreamRequest } from '@/lib/validators';
import { checkRateLimit } from '@/lib/rate-limiter';
import { classifyQuery } from '@/lib/pollution-classifier';
import { selectModel, streamChatCompletion } from '@/lib/groq';
import { getStreamingPrompt } from '@/lib/prompt-templates';
import type { StreamEvent } from '@/types/aerosakhi';

export const dynamic = 'force-dynamic';

function extractIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return 'anonymous';
}

function encodeSSE(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(request: NextRequest): Promise<Response> {
  const ip = extractIp(request);

  // ── Rate limit ──────────────────────────────────────────────────────
  const rateLimit = checkRateLimit(ip, 'stream');
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...rateLimit.headers },
      },
    );
  }

  // ── Validate ────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON in request body.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  let parsed: ReturnType<typeof validateStreamRequest>;
  try {
    parsed = validateStreamRequest(body);
  } catch (err) {
    const details = err instanceof ZodError ? err.errors : 'Invalid request data.';
    return new Response(
      JSON.stringify({ error: 'Validation failed.', details }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // ── Classify & select model ─────────────────────────────────────────
  const classification = classifyQuery(parsed.message);
  const model = selectModel(classification.complexity);

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: getStreamingPrompt(parsed.context) },
    { role: 'user', content: parsed.message },
  ];

  // ── Stream via SSE ──────────────────────────────────────────────────
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const generator = streamChatCompletion({ messages, model });

        for await (const token of generator) {
          const event: StreamEvent = { type: 'token', content: token };
          controller.enqueue(encoder.encode(encodeSSE(event)));
        }

        const doneEvent: StreamEvent = { type: 'done', model };
        controller.enqueue(encoder.encode(encodeSSE(doneEvent)));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Streaming failed.';
        const errorEvent: StreamEvent = { type: 'error', error: message };
        controller.enqueue(encoder.encode(encodeSSE(errorEvent)));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      ...rateLimit.headers,
    },
  });
}
