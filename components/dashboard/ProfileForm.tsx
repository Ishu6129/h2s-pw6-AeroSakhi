'use client';

import { useState, useCallback, type FormEvent } from 'react';
import type { UserProfile, Location } from '@/types/aerosakhi';

interface ProfileFormProps {
  onSubmit: (profile: UserProfile) => void;
  initialProfile?: UserProfile | null;
}

export function ProfileForm({ onSubmit, initialProfile }: ProfileFormProps) {
  const [city, setCity] = useState(initialProfile?.location.city ?? '');
  const [region, setRegion] = useState(initialProfile?.location.region ?? '');
  const [country, setCountry] = useState(initialProfile?.location.country ?? '');
  const [householdSize, setHouseholdSize] = useState(
    initialProfile?.householdSize?.toString() ?? '',
  );
  const [hasChildren, setHasChildren] = useState(initialProfile?.hasChildren ?? false);
  const [hasElderly, setHasElderly] = useState(initialProfile?.hasElderly ?? false);
  const [livingSpace, setLivingSpace] = useState(initialProfile?.livingSpace ?? '');
  const [budget, setBudget] = useState(initialProfile?.budget ?? '');

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!city.trim()) return;

      const location: Location = {
        city: city.trim(),
        ...(region.trim() ? { region: region.trim() } : {}),
        ...(country.trim() ? { country: country.trim() } : {}),
      };

      const profile: UserProfile = {
        location,
        ...(householdSize ? { householdSize: parseInt(householdSize, 10) } : {}),
        hasChildren,
        hasElderly,
        ...(livingSpace ? { livingSpace: livingSpace as UserProfile['livingSpace'] } : {}),
        ...(budget ? { budget: budget as UserProfile['budget'] } : {}),
      };

      onSubmit(profile);
    },
    [city, region, country, householdSize, hasChildren, hasElderly, livingSpace, budget, onSubmit],
  );

  return (
    <form onSubmit={handleSubmit} aria-label="Household environmental profile form">
      <fieldset>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <legend style={{ padding: 0 }}>Household Exposure Profile</legend>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Calibrates recommendations</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.75rem' }}>
          {/* Location */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="profile-city" className="form-label">
                Metropolitan Area / City *
              </label>
              <input
                id="profile-city"
                type="text"
                className="input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. New Delhi, Lahore, Beijing"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="profile-region" className="form-label">
                State / District
              </label>
              <input
                id="profile-region"
                type="text"
                className="input"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. NCR, Punjab, Hebei"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="profile-country" className="form-label">
                Country
              </label>
              <input
                id="profile-country"
                type="text"
                className="input"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. India"
              />
            </div>
            <div className="form-group">
              <label htmlFor="profile-household" className="form-label">
                Occupants in Home
              </label>
              <input
                id="profile-household"
                type="number"
                className="input"
                value={householdSize}
                onChange={(e) => setHouseholdSize(e.target.value)}
                min={1}
                max={20}
                placeholder="e.g. 4"
              />
            </div>
          </div>

          {/* Selects */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="profile-living-space" className="form-label">
                Dwelling Architecture
              </label>
              <select
                id="profile-living-space"
                className="select"
                value={livingSpace}
                onChange={(e) => setLivingSpace(e.target.value)}
              >
                <option value="">Select Architecture…</option>
                <option value="apartment">Multi-Story Apartment (High Infiltration)</option>
                <option value="house">Independent House (Ground Exposure)</option>
                <option value="studio">Studio / Compact Flat</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="profile-budget" className="form-label">
                Mitigation Budget Tier
              </label>
              <select
                id="profile-budget"
                className="select"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              >
                <option value="">Select Tier…</option>
                <option value="low">Frugal / DIY Air Sealing</option>
                <option value="medium">Standard (HEPA Purifier + Carbon Filters)</option>
                <option value="high">Comprehensive (Smart ERV / HVAC Sealing)</option>
              </select>
            </div>
          </div>

          {/* Vulnerability Checkboxes */}
          <div style={{ background: 'var(--bg-elevated)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
              Respiratory Vulnerability Flags
            </span>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              <label htmlFor="profile-children" className="checkbox-group">
                <input
                  id="profile-children"
                  type="checkbox"
                  checked={hasChildren}
                  onChange={(e) => setHasChildren(e.target.checked)}
                />
                <span>Pediatric Occupants (&lt;12 yrs)</span>
              </label>
              <label htmlFor="profile-elderly" className="checkbox-group">
                <input
                  id="profile-elderly"
                  type="checkbox"
                  checked={hasElderly}
                  onChange={(e) => setHasElderly(e.target.checked)}
                />
                <span>Senior Occupants (65+ yrs)</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={!city.trim()}
            aria-label="Save household profile"
          >
            Save Household Profile
          </button>
        </div>
      </fieldset>
    </form>
  );
}
