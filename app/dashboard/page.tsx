'use client';

import { useState, useCallback, useMemo } from 'react';
import { ImpactMeter } from '@/components/dashboard/ImpactMeter';
import { AirQualityCard } from '@/components/dashboard/AirQualityCard';
import { Badge } from '@/components/ui/Badge';
import { formatInlineText } from '@/components/ui/FormattedContent';
import type {
  AnalyzeResponse,
  RoutineSuggestion as RoutineSuggestionType,
} from '@/types/aerosakhi';

const ROUTINE_PRESETS = [
  {
    name: 'Urban Apartment (Winter)',
    city: 'New Delhi',
    region: 'NCR',
    country: 'India',
    routines: [
      'Commute 18 km in stop-and-go traffic using petrol car with AC recirculation off',
      'Prepare 3 hot meals daily using unvented LPG cylinder gas stove',
      'Open eastern balcony windows for fresh air ventilation at 7:30 AM during smog peak',
      'Dry laundry on outdoor balcony facing main arterial roadway',
    ],
  },
  {
    name: 'Suburban Single Family',
    city: 'Lahore',
    region: 'Punjab',
    country: 'Pakistan',
    routines: [
      'Operate wood-burning decorative fireplace for 4 hours every evening for living room warmth',
      'Drive SUV for 3 separate short school and grocery pickup trips daily (< 3 km each)',
      'Run portable diesel backup generator twice a week during power outages',
      'Leave exterior doors ajar while pets move between garden and home',
    ],
  },
  {
    name: 'Compact Flat',
    city: 'Beijing',
    region: 'Hebei',
    country: 'China',
    routines: [
      'Walk 15 minutes to metro station without protective filtration mask',
      'Cook high-temperature stir-fry on standard gas range without exhaust hood running',
      'Exercise / outdoor evening jog in city park between 6:30 PM - 7:30 PM',
      'Rely on central building radiator with no standalone HEPA filtration unit',
    ],
  },
] as const;

const DEFAULT_BASELINE: AnalyzeResponse = {
  suggestions: [
    {
      id: 'pres-1',
      category: 'cooking',
      currentRoutine: 'Prepare 3 hot meals daily using unvented LPG cylinder gas stove',
      suggestedAlternative: 'Deploy portable 2000W magnetic induction cooktop with range hood capture',
      emissionReduction: '65% peak indoor PM2.5 reduction',
      healthBenefit: 'Mitigates severe nitrogen dioxide (NO2) and mucosal irritation',
      difficulty: 'easy',
      impact: 'high',
    },
    {
      id: 'pres-2',
      category: 'indoor',
      currentRoutine: 'Open eastern balcony windows for fresh air ventilation at 7:30 AM during smog peak',
      suggestedAlternative: 'Shift ventilation to afternoon 13:00-15:00 thermal inversion erosion window with silicone edge sealing',
      emissionReduction: '55% indoor infiltration cutoff',
      healthBenefit: 'Prevents toxic ground-layer nocturnal smog accumulation in bedrooms',
      difficulty: 'easy',
      impact: 'high',
    },
    {
      id: 'pres-3',
      category: 'transport',
      currentRoutine: 'Commute 18 km in stop-and-go traffic using petrol car with AC recirculation off',
      suggestedAlternative: 'Engage cabin air recirculation mode with aftermarket activated carbon HEPA cabin filter',
      emissionReduction: '70% in-cabin particulate reduction',
      healthBenefit: 'Lowers ultrafine black carbon inhalation during highway congestion',
      difficulty: 'moderate',
      impact: 'moderate',
    },
    {
      id: 'pres-4',
      category: 'lifestyle',
      currentRoutine: 'Dry laundry on outdoor balcony facing main arterial roadway',
      suggestedAlternative: 'Air-dry indoor garments using dehumidifier or enclosed folding drying rack',
      emissionReduction: 'Eliminates secondary soot deposition',
      healthBenefit: 'Stops transdermal and inhalation transfer of settled polycyclic hydrocarbons',
      difficulty: 'easy',
      impact: 'moderate',
    },
  ],
  overallImpact: {
    score: 78,
    level: 'high',
    description: 'Current winter routines generate elevated indoor exposure during morning inversion peaks. Adopting targeted ventilation timing, cooktop induction swap, and cabin filtration will lower particulate exposure by over 55%.',
  },
  airQualityTips: [
    'Run true HEPA (H13) air purifiers continuously on low speed in occupied bedrooms',
    'Apply silicone weather stripping or foam tape to outer balcony door and window frames',
    'Monitor indoor PM2.5 levels to verify air exchange thresholds stay below 15 µg/m³',
  ],
};

export default function DashboardPage() {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [city, setCity] = useState<string>(ROUTINE_PRESETS[0].city);
  const [region, setRegion] = useState<string>(ROUTINE_PRESETS[0].region);
  const [hasChildren, setHasChildren] = useState(true);
  const [hasElderly, setHasElderly] = useState(false);
  const [routinesText, setRoutinesText] = useState(ROUTINE_PRESETS[0].routines.join('\n'));

  const [analysis, setAnalysis] = useState<AnalyzeResponse>(DEFAULT_BASELINE);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [adoptedHabits, setAdoptedHabits] = useState<Record<string, boolean>>({});

  const handleApplyPreset = useCallback((presetIndex: number) => {
    setSelectedPresetIndex(presetIndex);
    const preset = ROUTINE_PRESETS[presetIndex];
    if (!preset) return;

    setCity(preset.city);
    setRegion(preset.region);
    setRoutinesText(preset.routines.join('\n'));
    setError('');
  }, []);

  const handleAnalyse = useCallback(async () => {
    if (!city.trim() || !routinesText.trim()) {
      setError('Please provide a city and at least one routine.');
      return;
    }

    const routines = routinesText
      .split('\n')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    if (routines.length === 0) {
      setError('Please provide at least one routine or lifestyle activity.');
      return;
    }

    setIsAnalysing(true);
    setError('');
    setAdoptedHabits({});

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routines,
          location: {
            city: city.trim(),
            ...(region.trim() ? { region: region.trim() } : {}),
            country: ROUTINE_PRESETS[selectedPresetIndex]?.country ?? 'India',
          },
        }),
      });

      if (!res.ok) {
        const errBody = (await res.json()) as { error?: string };
        throw new Error(errBody.error ?? `Analysis request returned status ${res.status}`);
      }

      const data = (await res.json()) as AnalyzeResponse;
      setAnalysis(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed to execute.';
      setError(message);
    } finally {
      setIsAnalysing(false);
    }
  }, [city, region, routinesText, selectedPresetIndex]);

  const toggleAdoptHabit = useCallback((id: string) => {
    setAdoptedHabits((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  // Filtered suggestions
  const filteredSuggestions = useMemo(() => {
    if (!analysis) return [];
    if (activeCategory === 'all') return analysis.suggestions;
    return analysis.suggestions.filter((s) => s.category === activeCategory);
  }, [analysis, activeCategory]);

  // Categories list
  const categories = useMemo(() => {
    if (!analysis) return [];
    const set = new Set<string>();
    analysis.suggestions.forEach((s) => set.add(s.category));
    return Array.from(set);
  }, [analysis]);

  // Dynamic live score reflecting adopted interventions
  const adoptedCount = useMemo(() => {
    return Object.values(adoptedHabits).filter(Boolean).length;
  }, [adoptedHabits]);

  const liveScore = useMemo(() => {
    if (!analysis) return 0;
    const base = analysis.overallImpact.score;
    // Each adopted habit raises cleanliness score towards 95
    const boost = adoptedCount * 6;
    return Math.min(96, base + boost);
  }, [analysis, adoptedCount]);

  return (
    <main id="main-content">
      <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '3rem' }}>
        {/* ── Page Header ────────────────────────────────────────── */}
        <div className="page-header" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-bright)', marginBottom: '0.25rem' }}>
            <span className="pulse-dot" aria-hidden="true" />
            <span>Environmental Exposure Audit</span>
          </div>
          <h1 className="page-title" style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
            Household Emission & Smog Mitigation Audit
          </h1>
          <p className="page-desc" style={{ fontSize: '0.88rem', margin: '0' }}>
            Audit daily commuting, cooking, and heating routines against winter microclimate thresholds.
          </p>
        </div>

        {/* ── Main Two-Column Layout ─────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 400px) minmax(0, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* ── LEFT: Inputs & Presets (Single Screen Card) ──────── */}
          <div className="card" style={{ padding: '1.35rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            
            {/* Quick Preset Scenarios */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-bright)' }}>
                  Quick Preset Scenarios
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>1-Click Load</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {ROUTINE_PRESETS.map((preset, idx) => {
                  const isSelected = selectedPresetIndex === idx;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyPreset(idx)}
                      style={{
                        textAlign: 'left',
                        background: isSelected ? 'rgba(14, 165, 233, 0.1)' : 'var(--bg-elevated)',
                        border: `1px solid ${isSelected ? 'var(--accent-bright)' : 'var(--border-subtle)'}`,
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.5rem 0.75rem',
                        color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>{preset.name}</span>
                      <span style={{ fontSize: '0.72rem', color: isSelected ? 'var(--accent-bright)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {preset.city}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Household Exposure Profile Form */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem', marginBottom: '0.85rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Household Exposure Profile
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="profile-city" className="form-label" style={{ fontSize: '0.72rem', marginBottom: '0.2rem' }}>
                    Metropolitan Area / City *
                  </label>
                  <input
                    id="profile-city"
                    type="text"
                    className="input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. New Delhi"
                    style={{ padding: '0.45rem 0.65rem', fontSize: '0.82rem' }}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="profile-region" className="form-label" style={{ fontSize: '0.72rem', marginBottom: '0.2rem' }}>
                    State / District
                  </label>
                  <input
                    id="profile-region"
                    type="text"
                    className="input"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="e.g. NCR"
                    style={{ padding: '0.45rem 0.65rem', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              {/* Sensitivities */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem' }}>
                <label className="checkbox-group" style={{ fontSize: '0.75rem' }}>
                  <input
                    type="checkbox"
                    checked={hasChildren}
                    onChange={(e) => setHasChildren(e.target.checked)}
                  />
                  <span>Pediatric (&lt;12)</span>
                </label>

                <label className="checkbox-group" style={{ fontSize: '0.75rem' }}>
                  <input
                    type="checkbox"
                    checked={hasElderly}
                    onChange={(e) => setHasElderly(e.target.checked)}
                  />
                  <span>Senior (65+)</span>
                </label>
              </div>
            </div>

            {/* Daily Lifestyle Routines */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label htmlFor="routines-input" className="form-label" style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', margin: 0 }}>
                  Daily Lifestyle Routines
                </label>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>1 per line</span>
              </div>

              <textarea
                id="routines-input"
                className="textarea"
                value={routinesText}
                onChange={(e) => setRoutinesText(e.target.value)}
                placeholder={'Commute 14 km roundtrip via combustion motorcycle\nPrepare three meals daily using unvented LPG gas stove\nBurn wood briquettes for heating in evenings\nOpen balcony doors for morning ventilation at 7:00 AM'}
                rows={4}
                style={{ fontSize: '0.8rem', lineHeight: '1.45', padding: '0.55rem' }}
              />

              <button
                type="button"
                className="btn-primary"
                onClick={() => void handleAnalyse()}
                disabled={isAnalysing || !routinesText.trim()}
                aria-label={isAnalysing ? 'Calculating emission impact…' : 'Calculate emission and exposure impact'}
                style={{ marginTop: '0.75rem', width: '100%', padding: '0.65rem', fontSize: '0.85rem', fontWeight: 700 }}
              >
                {isAnalysing ? (
                  <>
                    <span className="loading-spinner" style={{ width: '0.9rem', height: '0.9rem' }} />
                    <span>Auditing impact…</span>
                  </>
                ) : (
                  'Audit Daily Routines →'
                )}
              </button>

              {error && (
                <div role="alert" aria-live="assertive" className="error-message" style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Mitigation Scoreboard & Targeted Interventions ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* ── 1. Executive Mitigation Scoreboard ─────────────── */}
            <div className="card" style={{ padding: '1.35rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-bright)' }}>
                    Executive Scoreboard
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                    Mitigation Scoreboard
                  </h2>
                </div>
                {adoptedCount > 0 && (
                  <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--air-pure)', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontWeight: 600 }}>
                    ✓ {adoptedCount} Habit{adoptedCount > 1 ? 's' : ''} Adopted
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1.25rem', alignItems: 'center' }}>
                <ImpactMeter
                  score={liveScore}
                  level={analysis.overallImpact.level}
                  description=""
                />

                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div style={{ background: 'var(--bg-elevated)', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
                        INTERVENTIONS
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.1rem' }}>
                        {analysis.suggestions.length}
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-elevated)', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
                        EST. PM2.5 DELTA
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-bright)', marginTop: '0.1rem' }}>
                        -55%
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-elevated)', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
                        QUICK WINS
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--air-pure)', marginTop: '0.1rem' }}>
                        {analysis.suggestions.filter((s) => s.difficulty === 'easy').length || 2}
                      </div>
                    </div>
                  </div>

                  <p
                    style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}
                    dangerouslySetInnerHTML={{ __html: formatInlineText(analysis.overallImpact.description) }}
                  />
                </div>
              </div>
            </div>

            {/* ── 2. Category Filters & Intervention Cards ─────── */}
            <div className="card" style={{ padding: '1.35rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                    Targeted Interventions
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Showing {filteredSuggestions.length} actions
                  </span>
                </div>

                {/* Filter Pills */}
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }} role="toolbar" aria-label="Filter interventions by category">
                  <button
                    type="button"
                    onClick={() => setActiveCategory('all')}
                    className={`badge ${activeCategory === 'all' ? 'badge-info' : 'badge-default'}`}
                    style={{ cursor: 'pointer', padding: '0.25rem 0.65rem', border: '1px solid var(--border-subtle)', fontSize: '0.72rem' }}
                  >
                    All ({analysis.suggestions.length})
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={`badge ${activeCategory === cat ? 'badge-info' : 'badge-default'}`}
                      style={{ cursor: 'pointer', padding: '0.25rem 0.65rem', textTransform: 'capitalize', border: '1px solid var(--border-subtle)', fontSize: '0.72rem' }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* List of Intervention Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredSuggestions.map((s: RoutineSuggestionType) => {
                  const isAdopted = Boolean(adoptedHabits[s.id]);
                  return (
                    <div
                      key={s.id}
                      style={{
                        background: isAdopted ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-elevated)',
                        border: `1px solid ${isAdopted ? 'rgba(16, 185, 129, 0.35)' : 'var(--border-subtle)'}`,
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem 1.15rem',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                          <Badge label={s.category} variant="info" size="sm" />
                          <Badge label={`Yield: ${s.impact}`} variant={s.impact === 'high' ? 'high' : 'medium'} size="sm" />
                          <Badge label={`Effort: ${s.difficulty}`} variant={s.difficulty === 'easy' ? 'low' : 'medium'} size="sm" />
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleAdoptHabit(s.id)}
                          className={`btn-sm ${isAdopted ? 'btn-primary' : 'btn-secondary'}`}
                          style={{
                            padding: '0.25rem 0.65rem',
                            fontSize: '0.75rem',
                            background: isAdopted ? 'var(--air-pure)' : undefined,
                            borderColor: isAdopted ? 'var(--air-pure)' : undefined,
                          }}
                          aria-pressed={isAdopted}
                        >
                          {isAdopted ? '✓ Habit Adopted' : '+ Commit to Swap'}
                        </button>
                      </div>

                      <div style={{ marginBottom: '0.45rem' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem' }}>
                          Current Habit
                        </span>
                        <div
                          style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textDecoration: isAdopted ? 'line-through' : 'none', opacity: isAdopted ? 0.6 : 0.9 }}
                          dangerouslySetInnerHTML={{ __html: formatInlineText(s.currentRoutine) }}
                        />
                      </div>

                      <div style={{ marginBottom: '0.65rem' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--accent-bright)', display: 'block', marginBottom: '0.15rem' }}>
                          Engineered Alternative
                        </span>
                        <div
                          style={{ color: '#ffffff', fontSize: '0.92rem', fontWeight: 600 }}
                          dangerouslySetInnerHTML={{ __html: formatInlineText(s.suggestedAlternative) }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', background: 'var(--bg-surface)', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <div>
                          <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>
                            Particulate Reduction
                          </span>
                          <span style={{ color: 'var(--air-pure)', fontWeight: 600, fontSize: '0.82rem' }}>
                            ↓ {s.emissionReduction}
                          </span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>
                            Health Defense
                          </span>
                          <span style={{ color: '#cbd5e1', fontWeight: 600, fontSize: '0.82rem' }}>
                            {s.healthBenefit}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── 3. Regional Protective Directives ────────────── */}
            {analysis.airQualityTips.length > 0 && (
              <AirQualityCard
                city={city ?? 'Regional Microclimate'}
                aqi={analysis.overallImpact.score}
                level={analysis.overallImpact.level}
                recommendations={analysis.airQualityTips}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
