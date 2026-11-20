'use client';

import { useState, useCallback, useRef } from 'react';
import type { UserProfile, StreamEvent } from '@/types/aerosakhi';

interface UseStreamingResponseReturn {
  streamContent: string;
  isStreaming: boolean;
  streamError: string;
  currentModel: string;
  startStream: (message: string, context?: UserProfile) => Promise<void>;
  clearStream: () => void;
}

export function useStreamingResponse(): UseStreamingResponseReturn {
  const [streamContent, setStreamContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState('');
  const [currentModel, setCurrentModel] = useState('');

  const abortRef = useRef<AbortController | null>(null);

  const clearStream = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setStreamContent('');
    setIsStreaming(false);
    setStreamError('');
    setCurrentModel('');
  }, []);

  const startStream = useCallback(async (
    message: string,
    context?: UserProfile,
  ): Promise<void> => {
    // Abort any existing stream
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setStreamContent('');
    setStreamError('');
    setIsStreaming(true);
    setCurrentModel('');

    try {
      const res = await fetch('/api/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context: context ?? undefined }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = (await res.json()) as { error?: string };
        throw new Error(errBody.error ?? `Stream request failed with status ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable.');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          const jsonStr = trimmed.slice(6);
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr) as StreamEvent;

            if (event.type === 'token' && event.content) {
              setStreamContent((prev) => prev + event.content);
            } else if (event.type === 'done') {
              setCurrentModel(event.model ?? '');
              setIsStreaming(false);
            } else if (event.type === 'error') {
              setStreamError(event.error ?? 'Unknown streaming error.');
              setIsStreaming(false);
            }
          } catch {
            // Skip malformed SSE lines
          }
        }
      }
    } catch (err) {
      // Don't set error for intentional aborts
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      const message = err instanceof Error ? err.message : 'Streaming failed.';
      setStreamError(message);
    } finally {
      setIsStreaming(false);
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, []);

  return {
    streamContent,
    isStreaming,
    streamError,
    currentModel,
    startStream,
    clearStream,
  };
}
