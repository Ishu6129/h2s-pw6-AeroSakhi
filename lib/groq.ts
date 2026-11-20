import Groq from 'groq-sdk';
import type { QueryComplexity } from '@/types/aerosakhi';

// ---------------------------------------------------------------------------
// Model constants (from available models list)
// ---------------------------------------------------------------------------

/** Fast model for simple, low-latency queries. */
export const MODEL_FAST = (process.env.GROQ_MODEL_FAST || 'openai/gpt-oss-20b') as string;

/** Versatile model for complex reasoning and routine analysis. */
export const MODEL_VERSATILE = (process.env.GROQ_MODEL_VERSATILE || 'openai/gpt-oss-120b') as string;

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let groqInstance: Groq | null = null;

/**
 * Returns the singleton Groq client.
 * Throws a descriptive error when the `GROQ_API_KEY` environment variable is
 * not set. Supports optional `GROQ_BASE_URL` for custom gateway endpoints.
 */
export function getGroqClient(): Groq {
  if (groqInstance) {
    return groqInstance;
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error(
      'GROQ_API_KEY environment variable is not set. ' +
        'Please add it to your .env.local file or environment variables to use the Groq API.',
    );
  }

  const baseURL = process.env.GROQ_BASE_URL;

  groqInstance = new Groq({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });
  return groqInstance;
}

// ---------------------------------------------------------------------------
// Model selection
// ---------------------------------------------------------------------------

/**
 * Maps a {@link QueryComplexity} level to the appropriate model identifier.
 */
export function selectModel(complexity: QueryComplexity): string {
  switch (complexity) {
    case 'simple':
      return MODEL_FAST;
    case 'moderate':
      return MODEL_VERSATILE;
    case 'complex':
      return MODEL_VERSATILE;
  }
}

// ---------------------------------------------------------------------------
// Chat completion helpers
// ---------------------------------------------------------------------------

/** Message shape accepted by the chat helpers. */
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Parameters shared by both chat completion helpers. */
interface ChatCompletionParams {
  messages: ChatMessage[];
  model: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Creates a (non-streaming) chat completion and returns the assistant's reply
 * as a plain string.
 *
 * @throws {Error} When the Groq API call fails or the response content is null.
 */
export async function createChatCompletion({
  messages,
  model,
  maxTokens = 2048,
  temperature = 0.7,
}: ChatCompletionParams): Promise<string> {
  const client = getGroqClient();

  try {
    const response = await client.chat.completions.create({
      messages,
      model,
      max_tokens: maxTokens,
      temperature,
      stream: false as const,
    });

    const content = response.choices[0]?.message?.content;

    if (content === null || content === undefined) {
      throw new Error(
        'Groq API returned a response with null content. ' +
          'The model may not have generated any output for the given prompt.',
      );
    }

    return content;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Groq API returned')) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : 'An unknown error occurred';

    throw new Error(`Groq chat completion failed: ${message}`);
  }
}

/**
 * Streams a chat completion, yielding each text chunk as it arrives.
 *
 * @throws {Error} When the Groq streaming API call fails.
 */
export async function* streamChatCompletion({
  messages,
  model,
  maxTokens = 2048,
  temperature = 0.7,
}: ChatCompletionParams): AsyncGenerator<string, void, unknown> {
  const client = getGroqClient();

  try {
    const stream = await client.chat.completions.create({
      messages,
      model,
      max_tokens: maxTokens,
      temperature,
      stream: true as const,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;

      if (delta) {
        yield delta;
      }
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'An unknown error occurred';

    throw new Error(`Groq streaming chat completion failed: ${message}`);
  }
}
