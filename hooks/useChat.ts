'use client';

/**
 * @module useChat
 * @description React hook for managing AI chat state, message history, and
 * conversation lifecycle with the AeroSakhi chat API.
 */

import { useState, useCallback } from 'react';
import type { ChatMessage, ChatResponse, UserProfile } from '@/types/aerosakhi';

/** Return type for the {@link useChat} hook. */
interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string;
  userProfile: UserProfile | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  setProfile: (profile: UserProfile) => void;
  clearError: () => void;
}

/**
 * Narrows a {@link ChatMessage} role to the subset accepted by the chat API
 * history array (`'user' | 'assistant'`).  System messages are excluded.
 */
function isHistoryRole(role: string): role is 'user' | 'assistant' {
  return role === 'user' || role === 'assistant';
}

/**
 * Generates a collision-resistant ID using `crypto.randomUUID` when
 * available, falling back to a timestamp+random string on older runtimes.
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Manages chat message state, user profile context, and API communication
 * for the AeroSakhi conversational AI assistant.
 *
 * @returns Chat state and action handlers.
 */
export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  /** Clears the current error message. */
  const clearError = useCallback(() => {
    setError('');
  }, []);

  /** Resets all messages and clears any active error. */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError('');
  }, []);

  /** Updates the active user profile used for personalised recommendations. */
  const setProfile = useCallback((profile: UserProfile) => {
    setUserProfile(profile);
  }, []);

  /**
   * Sends a user message to `/api/chat`, appends both the user message and
   * the assistant reply to the message list, and handles loading/error state.
   *
   * @param content - The raw user-typed message string.
   */
  const sendMessage = useCallback(async (content: string): Promise<void> => {
    if (!content.trim()) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setError('');

    try {
      // Filter to only user/assistant roles — system messages are excluded from history
      const historySlice = messages
        .filter((m) => isHistoryRole(m.role))
        .slice(-10)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          context: userProfile ?? undefined,
          history: historySlice.length > 0 ? historySlice : undefined,
        }),
      });

      if (!res.ok) {
        const errBody = (await res.json()) as { error?: string };
        throw new Error(errBody.error ?? `Request failed with status ${res.status}`);
      }

      const data = (await res.json()) as ChatResponse;

      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: data.message,
        timestamp: Date.now(),
        model: data.model,
        complexity: data.complexity,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [messages, userProfile]);

  return {
    messages,
    isLoading,
    error,
    userProfile,
    sendMessage,
    clearMessages,
    setProfile,
    clearError,
  };
}
