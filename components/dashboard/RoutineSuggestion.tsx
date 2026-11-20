'use client';

import { Badge } from '@/components/ui/Badge';
import type { RoutineSuggestion as RoutineSuggestionType } from '@/types/aerosakhi';

interface RoutineSuggestionProps {
  suggestion: RoutineSuggestionType;
}

function impactVariant(impact: string): 'high' | 'medium' | 'low' {
  if (impact === 'high' || impact === 'severe' || impact === 'hazardous') return 'high';
  if (impact === 'moderate') return 'medium';
  return 'low';
}

function difficultyVariant(difficulty: string): 'low' | 'medium' | 'high' {
  if (difficulty === 'easy') return 'low';
  if (difficulty === 'moderate') return 'medium';
  return 'high';
}

export function RoutineSuggestion({ suggestion }: RoutineSuggestionProps) {
  return (
    <article className="suggestion-card" aria-label={`Intervention: ${suggestion.suggestedAlternative}`}>
      <div className="suggestion-header">
        <Badge label={`Category: ${suggestion.category}`} variant="info" />
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <Badge label={`Yield: ${suggestion.impact}`} variant={impactVariant(suggestion.impact)} size="sm" />
          <Badge label={`Effort: ${suggestion.difficulty}`} variant={difficultyVariant(suggestion.difficulty)} size="sm" />
        </div>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
          Baseline Habit
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', textDecoration: 'line-through', opacity: 0.75 }}>
          {suggestion.currentRoutine}
        </div>
      </div>

      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--air-pure)', marginBottom: '0.2rem' }}>
          Recommended Intervention
        </div>
        <div style={{ color: '#ffffff', fontSize: '1.05rem', fontWeight: 600, lineHeight: '1.4' }}>
          {suggestion.suggestedAlternative}
        </div>
      </div>

      <div className="suggestion-benefits">
        <div className="suggestion-benefit">
          <span style={{ color: 'var(--air-pure)', fontWeight: 700 }}>↓</span>
          <div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 600 }}>
              Emission Delta
            </div>
            <div style={{ color: '#e2e8f0', fontWeight: 600 }}>
              {suggestion.emissionReduction}
            </div>
          </div>
        </div>
        <div className="suggestion-benefit">
          <span style={{ color: 'var(--accent-bright)', fontWeight: 700 }}>+</span>
          <div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 600 }}>
              Clinical Health Defense
            </div>
            <div style={{ color: '#e2e8f0', fontWeight: 600 }}>
              {suggestion.healthBenefit}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
