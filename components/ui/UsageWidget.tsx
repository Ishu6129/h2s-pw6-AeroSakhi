'use client';

import { useState, useEffect, useCallback } from 'react';
import type { UsageStats } from '@/types/aerosakhi';

export function UsageWidget() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [fetchError, setFetchError] = useState('');

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch('/api/usage');
      if (!res.ok) {
        throw new Error(`Failed to fetch usage: ${res.status}`);
      }
      const data = (await res.json()) as UsageStats;
      setStats(data);
      setFetchError('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load usage data.';
      setFetchError(message);
    }
  }, []);

  useEffect(() => {
    void fetchUsage();
    const interval = setInterval(() => {
      void fetchUsage();
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchUsage]);

  if (fetchError) {
    return (
      <div className="usage-widget" role="alert" aria-live="assertive">
        <div className="usage-header">
          <span>Gateway Rate Quota</span>
        </div>
        <p className="error-message">{fetchError}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="usage-widget" role="status" aria-live="polite">
        <div className="usage-header">
          <span>Gateway Rate Quota</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="loading-spinner" />
          <span>Polling telemetry…</span>
        </div>
      </div>
    );
  }

  const totalLimit = Object.values(stats.endpoints).reduce(
    (sum, ep) => sum + ep.limit,
    0,
  );
  const usagePercent = totalLimit > 0
    ? Math.round((stats.totalRequests / totalLimit) * 100)
    : 0;

  return (
    <div className="usage-widget" aria-live="polite">
      <div className="usage-header">
        <span>Gateway Rate Quota</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{stats.remainingRequests} req remaining</span>
      </div>

      <div className="progress-bar" role="progressbar" aria-valuenow={usagePercent} aria-valuemin={0} aria-valuemax={100} aria-label="API usage percentage">
        <div
          className={`progress-bar-fill ${usagePercent > 80 ? 'progress-bar-fill-high' : usagePercent > 50 ? 'progress-bar-fill-med' : 'progress-bar-fill-low'}`}
          style={{ width: `${usagePercent}%` }}
        />
      </div>

      <div className="usage-endpoints" style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {Object.entries(stats.endpoints).map(([name, ep]) => {
          const epPercent = ep.limit > 0 ? Math.min(100, Math.round((ep.count / ep.limit) * 100)) : 0;
          return (
            <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-bright)', fontWeight: 600 }}>/{name}</span>
                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{ep.count}/{ep.limit}</span>
              </div>
              <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.max(epPercent, 6)}%`,
                    background: epPercent > 80 ? 'var(--risk-high)' : epPercent > 50 ? 'var(--risk-med)' : 'var(--accent)',
                    borderRadius: '2px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
