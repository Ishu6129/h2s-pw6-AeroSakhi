'use client';

import { useState, useCallback } from 'react';
import type { ChatMessage, ChatResponse, UserProfile } from '@/types/aerosakhi';

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

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError('');
  }, []);

  const setProfile = useCallback((profile: UserProfile) => {
    setUserProfile(profile);
  }, []);

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
      // Build history from last 10 messages
      const historySlice = messages.slice(-10).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

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
