'use client';

import { memo } from 'react';
import { Badge } from '@/components/ui/Badge';
import { FormattedContent } from '@/components/ui/FormattedContent';

interface ChatMessageProps {
  message: {
    role: string;
    content: string;
    model?: string;
    complexity?: string;
  };
}

/**
 * Individual chat message bubble displaying user queries or AI responses with metadata badges.
 */
export const ChatMessage = memo(function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}
      role="article"
      aria-label={`${isUser ? 'Your query' : 'AeroSakhi advisory response'}`}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: isUser ? 'rgba(255,255,255,0.8)' : 'var(--accent-bright)' }}>
          {isUser ? 'You' : 'AeroSakhi Advisory'}
        </span>
      </div>

      {isUser ? (
        <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
      ) : (
        <FormattedContent content={message.content} variant="bubble" />
      )}

      {!isUser && (message.model || message.complexity) && (
        <div className="chat-bubble-meta">
          {message.model && (
            <Badge
              label={`Engine: ${message.model}`}
              variant="info"
              size="sm"
            />
          )}
          {message.complexity && (
            <Badge
              label={`Tier: ${message.complexity}`}
              variant="default"
              size="sm"
            />
          )}
        </div>
      )}
    </div>
  );
});
