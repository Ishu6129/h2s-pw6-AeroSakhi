'use client';

import { useState, useCallback, type KeyboardEvent, type FormEvent } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const MAX_CHARS = 5000;

export function ChatInput({ onSend, isLoading, disabled = false }: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const trimmed = text.trim();
      if (!trimmed || isLoading || disabled) return;
      onSend(trimmed);
      setText('');
    },
    [text, isLoading, disabled, onSend],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const trimmed = text.trim();
        if (!trimmed || isLoading || disabled) return;
        onSend(trimmed);
        setText('');
      }
    },
    [text, isLoading, disabled, onSend],
  );

  const charsRemaining = MAX_CHARS - text.length;

  return (
    <form onSubmit={handleSubmit} aria-label="Chat input form">
      <fieldset disabled={disabled || isLoading} style={{ border: 'none', padding: 0 }}>
        <legend className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          Send a message to AeroSakhi
        </legend>

        <div className="form-group">
          <label htmlFor="chat-input" className="form-label">
            Inquiry or Household Scenario
          </label>
          <textarea
            id="chat-input"
            className="textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. We have a 4-year-old child in an east-facing Delhi apartment during November. What is the most effective purification routine?"
            rows={3}
            maxLength={MAX_CHARS}
            aria-describedby="char-count"
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.75rem',
          }}
        >
          <span
            id="char-count"
            style={{
              fontSize: '0.78rem',
              color: charsRemaining < 200 ? 'var(--risk-high)' : 'var(--text-muted)',
            }}
          >
            {charsRemaining} characters remaining • Shift+Enter for newline
          </span>

          <button
            type="submit"
            className="btn-primary btn-sm"
            disabled={!text.trim() || isLoading || disabled}
            aria-label={isLoading ? 'Sending inquiry…' : 'Submit inquiry'}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner" style={{ width: '0.9rem', height: '0.9rem' }} />
                <span>Processing…</span>
              </>
            ) : (
              'Submit Inquiry'
            )}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
