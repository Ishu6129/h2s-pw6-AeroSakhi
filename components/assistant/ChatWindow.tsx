'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from '@/hooks/useChat';
import { useStreamingResponse } from '@/hooks/useStreamingResponse';
import { ChatMessage } from '@/components/assistant/ChatMessage';
import { ChatInput } from '@/components/assistant/ChatInput';
import { Badge } from '@/components/ui/Badge';
import { FormattedContent } from '@/components/ui/FormattedContent';

type TabId = 'chat' | 'stream';

const PROMPT_SUGGESTIONS = [
  'How do I protect an asthmatic child during a severe AQI 350+ spike?',
  'Which indoor plants genuinely reduce particulate and formaldehyde levels?',
  'Top 3 cost-effective ways to draft-seal urban apartment windows against winter smog',
  'HEPA H13 vs activated carbon: what should I look for in an air purifier?',
] as const;

export function ChatWindow() {
  const [activeTab, setActiveTab] = useState<TabId>('chat');
  const [streamInput, setStreamInput] = useState('');

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  } = useChat();

  const {
    streamContent,
    isStreaming,
    streamError,
    currentModel,
    startStream,
    clearStream,
  } = useStreamingResponse();

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamContent]);

  const handleStreamSubmit = useCallback(() => {
    const trimmed = streamInput.trim();
    if (!trimmed || isStreaming) return;
    void startStream(trimmed);
    setStreamInput('');
  }, [streamInput, isStreaming, startStream]);

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
  }, []);

  const handleSelectSuggestion = useCallback((promptText: string) => {
    if (activeTab === 'chat') {
      void sendMessage(promptText);
    } else {
      void startStream(promptText);
    }
  }, [activeTab, sendMessage, startStream]);

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* ── Mode Tabs ────────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Advisory Mode"
        className="tab-list"
      >
        <button
          role="tab"
          id="tab-chat"
          className="tab"
          aria-selected={activeTab === 'chat'}
          aria-controls="panel-chat"
          onClick={() => handleTabChange('chat')}
        >
          Consultation Thread
        </button>
        <button
          role="tab"
          id="tab-stream"
          className="tab"
          aria-selected={activeTab === 'stream'}
          aria-controls="panel-stream"
          onClick={() => handleTabChange('stream')}
        >
          Telemetry Live Stream
        </button>
      </div>

      {/* ── Chat Panel ───────────────────────────────────────────── */}
      <div
        role="tabpanel"
        id="panel-chat"
        aria-labelledby="tab-chat"
        hidden={activeTab !== 'chat'}
        style={{ padding: '1.25rem' }}
      >
        {/* Messages */}
        <div className="chat-container">
          {messages.length === 0 && (
            <div style={{ textAlign: 'left', padding: '1.5rem 0.5rem' }}>
              <div style={{ display: 'inline-block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-bright)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
                Operational Advisory Console
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.5rem', color: '#f8fafc' }}>
                How can AeroSakhi assist your household today?
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginBottom: '1.25rem', maxWidth: '580px' }}>
                Inquire about winter smog defense, personalized respiratory shielding, ventilation timing, or heating fuel trade-offs.
              </p>

              {/* Quick Action Checklist */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.95rem 1.15rem', marginBottom: '1.15rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-bright)', marginBottom: '0.55rem' }}>
                  Quick Action Checklist
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem', fontSize: '0.82rem', color: '#cbd5e1' }}>
                  <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--air-pure)', fontWeight: 700 }}>1.</span>
                    <span>Check local AQI spikes before morning outdoor activities</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--air-pure)', fontWeight: 700 }}>2.</span>
                    <span>Seal window gaps during inversion hours (04:00-10:00)</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--air-pure)', fontWeight: 700 }}>3.</span>
                    <span>Run HEPA on high during cooking, low at night</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--air-pure)', fontWeight: 700 }}>4.</span>
                    <span>Fit certified N95 / FFP2 masks for children on commutes</span>
                  </div>
                </div>
              </div>

              {/* Health Note Disclaimer */}
              <div style={{ background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.28)', borderRadius: 'var(--radius-md)', padding: '0.65rem 0.95rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.55rem' }}>
                <span style={{ fontSize: '1rem', lineHeight: '1.2' }}>⚠️</span>
                <span style={{ fontSize: '0.8rem', color: '#fef3c7', lineHeight: '1.45' }}>
                  <strong style={{ color: '#fbbf24' }}>Health Note:</strong> Environmental recommendations are informational and calibrated against WHO guidelines. They do not substitute for clinical medical care during severe respiratory distress.
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Recommended Inquiries:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                  {PROMPT_SUGGESTIONS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleSelectSuggestion(prompt)}
                      style={{
                        textAlign: 'left',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.65rem 0.85rem',
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-default)';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      {prompt} →
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
            />
          ))}

          {isLoading && (
            <div role="status" aria-live="polite" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', width: 'fit-content', border: '1px solid var(--border-subtle)' }}>
              <span className="loading-spinner" />
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Analyzing environmental parameters…</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Error */}
        {error && (
          <div role="alert" aria-live="assertive" className="error-message" style={{ margin: '0.75rem 0' }}>
            {error}
          </div>
        )}

        {/* Input + Clear */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginTop: '0.5rem' }}>
          <ChatInput onSend={sendMessage} isLoading={isLoading} />
          {messages.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={clearMessages}
                aria-label="Clear chat history"
              >
                Reset Session
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Stream Panel ─────────────────────────────────────────── */}
      <div
        role="tabpanel"
        id="panel-stream"
        aria-labelledby="tab-stream"
        hidden={activeTab !== 'stream'}
        style={{ padding: '1.25rem' }}
      >
        <div style={{ marginBottom: '1.25rem' }}>
          <label htmlFor="stream-input" className="form-label">
            Instant Telemetry Query
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <input
              id="stream-input"
              type="text"
              className="input"
              value={streamInput}
              onChange={(e) => setStreamInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleStreamSubmit();
              }}
              placeholder="e.g. When is the safest window to ventilate an apartment during smog?"
              disabled={isStreaming}
            />
            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={handleStreamSubmit}
              disabled={!streamInput.trim() || isStreaming}
              aria-label={isStreaming ? 'Streaming in progress…' : 'Start live response'}
            >
              {isStreaming ? 'Streaming…' : 'Stream'}
            </button>
          </div>
        </div>

        {/* Streaming output */}
        <div
          className="card-compact"
          style={{
            minHeight: '220px',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {streamContent || isStreaming ? (
            <div aria-live="polite" aria-atomic={false}>
              <FormattedContent
                content={streamContent}
                isStreaming={isStreaming}
                variant="card"
                showCopyButton={true}
              />
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>
              <p>Telemetry stream will generate output character-by-character in real time.</p>
            </div>
          )}

          {currentModel && !isStreaming && (
            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <Badge label={`Verified Engine: ${currentModel}`} variant="info" size="sm" />
            </div>
          )}
        </div>

        {/* Stream error */}
        {streamError && (
          <div role="alert" aria-live="assertive" className="error-message" style={{ marginTop: '0.75rem' }}>
            {streamError}
          </div>
        )}

        {/* Clear stream */}
        {(streamContent || streamError) && !isStreaming && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={clearStream}
              aria-label="Clear streaming output"
            >
              Clear Buffer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
