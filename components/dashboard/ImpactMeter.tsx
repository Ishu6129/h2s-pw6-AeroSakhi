'use client';

import { memo } from 'react';

interface ImpactMeterProps {
  score: number;
  level: string;
  description: string;
}

function levelColor(level: string): string {
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

/** Circular SVG gauge visualising the overall mitigation impact score. */
export const ImpactMeter = memo(function ImpactMeter({ score, level, description }: ImpactMeterProps) {
  const color = levelColor(level);
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="impact-meter" role="meter" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label={`Mitigation index: ${score} out of 100`}>
      <div className="impact-meter-circle">
        <svg width="130" height="130" viewBox="0 0 130 130" aria-hidden="true">
          <circle
            cx="65"
            cy="65"
            r="52"
            fill="none"
            stroke="var(--bg-elevated)"
            strokeWidth="8"
          />
          <circle
            cx="65"
            cy="65"
            r="52"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 65 65)"
            style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
          />
        </svg>
        <div className="impact-meter-score">
          <span style={{ color }}>{score}</span>
          <span className="impact-meter-label">Index / 100</span>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '0.25rem' }}>
        <div style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.85rem', color, marginBottom: '0.35rem' }}>
          Severity: {level}
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '320px', lineHeight: '1.5' }}>
          {description}
        </p>
      </div>
    </div>
  );
});
