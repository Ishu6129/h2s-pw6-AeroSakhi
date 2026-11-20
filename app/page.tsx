import Link from 'next/link';

export default function HomePage() {
  return (
    <main id="main-content">
      {/* ── Hero Section ────────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="container animate-fade-up">
          <div className="hero-badge-wrapper">
            <div className="hero-pill">
              <span className="pulse-dot" aria-hidden="true" />
              <span>Winter Smog Mitigation & Urban Air Advisory</span>
            </div>
          </div>

          <h1 className="hero-title">
            Actionable Air Intelligence for{' '}
            <span className="gradient-text">Cleaner, Safer Living</span>
          </h1>

          <p className="hero-subtitle">
            AeroSakhi helps households and communities navigate dangerous smog seasons.
            Get location-calibrated low-emission routines, indoor air purification hacks,
            and quantifiable alternatives that safeguard vulnerable family members.
          </p>

          <div className="hero-actions">
            <Link href="/assistant" className="btn-primary">
              Consult Air Advisory →
            </Link>
            <Link href="/dashboard" className="btn-secondary">
              Audit Daily Routines
            </Link>
          </div>

          {/* ── Live Atmospheric Telemetry Bar ──────────────────────────── */}
          <div className="telemetry-strip" aria-label="Reference environmental telemetry">
            <div className="telemetry-item">
              <div className="telemetry-label">WHO 24h Guideline</div>
              <div className="telemetry-value">
                15 <span className="telemetry-unit">µg/m³ PM2.5</span>
              </div>
            </div>
            <div className="telemetry-item">
              <div className="telemetry-label">Typical Winter Peak</div>
              <div className="telemetry-value" style={{ color: '#fb7185' }}>
                350+ <span className="telemetry-unit">AQI Severe</span>
              </div>
            </div>
            <div className="telemetry-item">
              <div className="telemetry-label">HEPA Sealing Efficacy</div>
              <div className="telemetry-value" style={{ color: '#34d399' }}>
                -62% <span className="telemetry-unit">Indoor Exposure</span>
              </div>
            </div>
            <div className="telemetry-item">
              <div className="telemetry-label">Analysis Turnaround</div>
              <div className="telemetry-value">
                &lt; 1.2 <span className="telemetry-unit">sec instant</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Specialized Capabilities ─────────────────────────────────── */}
      <section className="features-section" aria-labelledby="features-heading">
        <div className="container">
          <div className="section-eyebrow">Atmospheric Advisory Stack</div>
          <h2 id="features-heading" className="section-title">
            Engineered for Severe Pollution Seasons
          </h2>
          <p className="section-subtitle">
            Built from clinical epidemiology guidelines and clean-energy practices to give families
            practical, cost-conscious choices.
          </p>

          <div className="features-grid">
            <article className="card feature-card animate-fade-up animate-delay-1">
              <div>
                <span className="feature-tag">01 / ADVISORY</span>
                <h3 className="feature-title">Microclimate Air Intelligence</h3>
                <p className="feature-desc">
                  Ask nuanced questions about toxic smog spikes, safe ventilation windows, mask filtration grades, and respiratory defenses tailored to infants and elderly relatives.
                </p>
              </div>
              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                <Link href="/assistant" style={{ color: 'var(--accent-bright)', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
                  Ask advisory question →
                </Link>
              </div>
            </article>

            <article className="card feature-card animate-fade-up animate-delay-2">
              <div>
                <span className="feature-tag">02 / AUDIT</span>
                <h3 className="feature-title">Routine Emission Auditing</h3>
                <p className="feature-desc">
                  Input your daily transportation, heating, and cooking habits. The engine computes direct emission impacts and suggests high-yield sustainable alternatives.
                </p>
              </div>
              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                <Link href="/dashboard" style={{ color: 'var(--accent-bright)', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
                  Calculate routines →
                </Link>
              </div>
            </article>

            <article className="card feature-card animate-fade-up animate-delay-3">
              <div>
                <span className="feature-tag">03 / LOCALIZATION</span>
                <h3 className="feature-title">Contextual Urban Profiles</h3>
                <p className="feature-desc">
                  Recommendations adapt to your specific city geography, living arrangement (high-rise vs studio), heating fuel availability, and household financial tiers.
                </p>
              </div>
              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Locally calibrated
                </span>
              </div>
            </article>

            <article className="card feature-card animate-fade-up animate-delay-4">
              <div>
                <span className="feature-tag">04 / STREAMING</span>
                <h3 className="feature-title">Zero-Latency Guidance</h3>
                <p className="feature-desc">
                  Server-Sent Event streaming outputs real-time guidance token-by-token with dual-tier routing between high-speed and deep-reasoning neural models.
                </p>
              </div>
              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--air-pure)', fontSize: '0.875rem', fontWeight: 600 }}>
                  ● SSE Stream active
                </span>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ── Mitigation Playbook ────────────────────────────────────────── */}
      <section style={{ padding: '4.5rem 0' }} aria-labelledby="how-heading">
        <div className="container">
          <div className="section-eyebrow">Three-Stage Playbook</div>
          <h2 id="how-heading" className="section-title">
            How AeroSakhi Protects Your Home
          </h2>
          <p className="section-subtitle">
            A structured workflow to diagnose exposure, substitute high-emission habits, and shield your indoor microclimate.
          </p>

          <div className="steps-grid">
            <div className="step-card animate-fade-up animate-delay-1">
              <div className="step-number">01</div>
              <h3 className="feature-title">Define Living Environment</h3>
              <p className="feature-desc">
                Provide your city, living quarters, and household vulnerabilities (e.g. asthma sufferers, toddlers, or elders) for calibrated advisory limits.
              </p>
            </div>

            <div className="step-card animate-fade-up animate-delay-2">
              <div className="step-number">02</div>
              <h3 className="feature-title">Submit Daily Habits</h3>
              <p className="feature-desc">
                Log regular commuting modes, stove fuels, indoor ventilation routines, and heating methods to evaluate particulate and toxic gas emissions.
              </p>
            </div>

            <div className="step-card animate-fade-up animate-delay-3">
              <div className="step-number">03</div>
              <h3 className="feature-title">Deploy Sustainable Swaps</h3>
              <p className="feature-desc">
                Implement graded, high-impact substitutions that cut both personal exposure and municipal smog contributions without unnecessary expense.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Real-World Public Health Data ─────────────────────────────── */}
      <section className="stats-section" aria-labelledby="stats-heading">
        <div className="container">
          <h2 id="stats-heading" className="section-title" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>
            The Measurable Impact of Clean Air Interventions
          </h2>
          <div className="stats-grid">
            <div className="stat-item animate-fade-up animate-delay-1">
              <div className="stat-value" style={{ color: '#38bdf8' }}>60%</div>
              <div className="stat-label">
                Average reduction in indoor PM2.5 through proper room sealing and HEPA filtration.
              </div>
            </div>
            <div className="stat-item animate-fade-up animate-delay-2">
              <div className="stat-value" style={{ color: '#fb7185' }}>7.0M</div>
              <div className="stat-label">
                Annual premature mortalities attributed to ambient and household air pollution globally (WHO).
              </div>
            </div>
            <div className="stat-item animate-fade-up animate-delay-3">
              <div className="stat-value" style={{ color: '#34d399' }}>40%</div>
              <div className="stat-label">
                Lower domestic emissions achieved by transitioning from biomass/LPG to clean induction cooktops.
              </div>
            </div>
            <div className="stat-item animate-fade-up animate-delay-4">
              <div className="stat-value" style={{ color: '#fbbf24' }}>90%+</div>
              <div className="stat-label">
                Of urban populations breathe air exceeding WHO annual safety guidelines during peak smog months.
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
