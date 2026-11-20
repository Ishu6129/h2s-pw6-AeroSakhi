'use client';

import { memo } from 'react';
import { Badge } from '@/components/ui/Badge';
import { formatInlineText } from '@/components/ui/FormattedContent';

interface AirQualityCardProps {
  city: string;
  aqi: number;
  level: string;
  recommendations: string[];
}

function aqiVariant(level: string): 'low' | 'medium' | 'high' {
  switch (level) {
    case 'low':
      return 'low';
    case 'moderate':
      return 'medium';
    case 'high':
    case 'severe':
    case 'hazardous':
      return 'high';
    default:
      return 'medium';
  }
}

function getAqiColor(level: string): string {
  switch (level) {
    case 'low':
      return 'var(--risk-low)';
    case 'moderate':
      return 'var(--risk-med)';
    case 'high':
    case 'severe':
    case 'hazardous':
      return 'var(--risk-high)';
    default:
      return 'var(--accent-bright)';
  }
}

/**
 * Renders the regional air quality baseline card with computed AQI and protective protocols.
 */
export const AirQualityCard = memo(function AirQualityCard({ city, aqi, level, recommendations }: AirQualityCardProps) {
  const variant = aqiVariant(level);
  const color = getAqiColor(level);

  return (
    <article className="card" aria-label={`Environmental baseline for ${city}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
            Regional Baseline
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: '#f8fafc' }}>
            {city}
          </h3>
        </div>
        <Badge label={`Status: ${level.toUpperCase()}`} variant={variant} />
      </div>

      <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '1.25rem', textAlign: 'center', margin: '1rem 0', border: '1px solid var(--border-subtle)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '3.25rem', fontWeight: 800, color, lineHeight: '1.1' }}>
          {aqi}
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '0.25rem', fontWeight: 600 }}>
          Computed Microclimate AQI
        </div>
      </div>

      {recommendations.length > 0 && (
        <div style={{ marginTop: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Protective Protocols
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recommendations.map((rec, idx) => (
              <li key={idx} style={{ fontSize: '0.875rem', color: '#cbd5e1', display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--air-pure)', fontWeight: 700, fontSize: '0.9rem' }}>✓</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineText(rec) }} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
});
