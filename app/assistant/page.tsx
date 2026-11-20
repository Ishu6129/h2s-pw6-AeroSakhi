'use client';

import dynamic from 'next/dynamic';

/** Dynamically imported ChatWindow — reduces initial bundle for the assistant page. */
const ChatWindow = dynamic(
  () => import('@/components/assistant/ChatWindow').then((mod) => ({ default: mod.ChatWindow })),
  {
    loading: () => (
      <div className="card" style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="loading-spinner" />
      </div>
    ),
  },
);

/** Dynamically imported UsageWidget — non-critical sidebar loaded on demand. */
const UsageWidget = dynamic(
  () => import('@/components/ui/UsageWidget').then((mod) => ({ default: mod.UsageWidget })),
  { ssr: false },
);

export default function AssistantPage() {
  return (
    <main id="main-content">
      <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
        <div className="page-header" style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-bright)', marginBottom: '0.35rem' }}>
            Clinical & Environmental Advisory
          </div>
          <h1 className="page-title">
            Air Quality & Smog Mitigation Console
          </h1>
          <p className="page-desc">
            Consult real-time environmental recommendations calibrated against WHO safety metrics,
            indoor purification strategies, and safe outdoor exposure windows.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 320px',
            gap: '1.75rem',
            alignItems: 'start',
          }}
        >
          <ChatWindow />

          <aside aria-label="System operational telemetry" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <UsageWidget />

            <div className="card-compact card-elevated" style={{ borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Advisory Protocol
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <li style={{ display: 'flex', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--air-pure)' }}>✓</span>
                  <span><strong>Dual-Tier Engine:</strong> Automatic routing between low-latency and reasoning models</span>
                </li>
                <li style={{ display: 'flex', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--air-pure)' }}>✓</span>
                  <span><strong>Zero Hallucination Guard:</strong> Pre-filtered against WHO & EPA exposure standards</span>
                </li>
                <li style={{ display: 'flex', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--air-pure)' }}>✓</span>
                  <span><strong>Household Tuning:</strong> Specific protocols for pediatric & senior respiratory defense</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
