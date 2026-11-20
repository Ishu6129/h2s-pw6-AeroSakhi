import { describe, it, expect } from 'vitest';
import {
  classifyQuery,
  COMPLEXITY_PATTERNS,
} from '@/lib/pollution-classifier';

describe('lib/pollution-classifier', () => {
  describe('COMPLEXITY_PATTERNS', () => {
    it('defines patterns for all three complexity levels', () => {
      expect(COMPLEXITY_PATTERNS).toHaveProperty('complex');
      expect(COMPLEXITY_PATTERNS).toHaveProperty('moderate');
      expect(COMPLEXITY_PATTERNS).toHaveProperty('simple');
    });

    it('each level has at least one pattern', () => {
      expect(COMPLEXITY_PATTERNS.complex.length).toBeGreaterThan(0);
      expect(COMPLEXITY_PATTERNS.moderate.length).toBeGreaterThan(0);
      expect(COMPLEXITY_PATTERNS.simple.length).toBeGreaterThan(0);
    });
  });

  describe('classifyQuery', () => {
    // ── Simple queries ──────────────────────────────────────────────
    it('classifies a greeting as simple', () => {
      const result = classifyQuery('Hello');
      expect(result.complexity).toBe('simple');
      expect(result.model).toBe('fast');
    });

    it('classifies "thank you" as simple', () => {
      const result = classifyQuery('thank you');
      expect(result.complexity).toBe('simple');
    });

    it('classifies quick tip request as simple', () => {
      const result = classifyQuery('give me a quick tip');
      expect(result.complexity).toBe('simple');
    });

    // ── Moderate queries ────────────────────────────────────────────
    it('classifies purifier recommendation as moderate', () => {
      const result = classifyQuery('Which air purifier should I buy for my home?');
      expect(['moderate', 'complex']).toContain(result.complexity);
      expect(result.model).toBe('versatile');
    });

    it('classifies seasonal advice query as moderate or complex', () => {
      const result = classifyQuery('What should I do during winter smog season?');
      expect(['moderate', 'complex']).toContain(result.complexity);
    });

    it('classifies cooking question as moderate', () => {
      const result = classifyQuery('Is induction cooking better than gas stove?');
      expect(['moderate', 'complex']).toContain(result.complexity);
    });

    // ── Complex queries ─────────────────────────────────────────────
    it('classifies health impact question as complex', () => {
      const result = classifyQuery(
        'What are the long-term respiratory health effects of PM2.5 exposure on children with asthma?',
      );
      expect(result.complexity).toBe('complex');
      expect(result.model).toBe('versatile');
    });

    it('classifies multi-factor comparison as complex', () => {
      const result = classifyQuery(
        'Compare the air quality policies of Delhi and Beijing and their effectiveness over the last decade',
      );
      expect(result.complexity).toBe('complex');
    });

    it('classifies chemical compound query as complex', () => {
      const result = classifyQuery(
        'How does NO2 interact with volatile organic compounds to form ground-level ozone?',
      );
      expect(result.complexity).toBe('complex');
    });

    it('classifies policy question as complex', () => {
      const result = classifyQuery(
        'What government regulations exist for controlling industrial emissions in India?',
      );
      expect(result.complexity).toBe('complex');
    });

    // ── Edge cases ──────────────────────────────────────────────────
    it('returns simple with 0 confidence for empty string', () => {
      const result = classifyQuery('');
      expect(result.complexity).toBe('simple');
      expect(result.confidence).toBe(0);
      expect(result.categories).toEqual([]);
    });

    it('handles whitespace-only input', () => {
      const result = classifyQuery('   ');
      expect(result.complexity).toBe('simple');
      expect(result.confidence).toBe(0);
    });

    it('handles special characters gracefully', () => {
      const result = classifyQuery('!@#$%^&*()');
      expect(result.complexity).toBe('simple');
    });

    // ── Model routing ───────────────────────────────────────────────
    it('routes simple queries to fast model', () => {
      const result = classifyQuery('hi');
      expect(result.model).toBe('fast');
    });

    it('routes complex queries to versatile model', () => {
      const result = classifyQuery(
        'Provide a comprehensive step-by-step strategy for reducing asthma triggers caused by PM2.5 for elderly family members',
      );
      expect(result.model).toBe('versatile');
    });

    // ── Categories ──────────────────────────────────────────────────
    it('detects health category', () => {
      const result = classifyQuery('How does pollution affect respiratory health?');
      expect(result.categories).toContain('health');
    });

    it('detects transport category', () => {
      const result = classifyQuery('Should I cycle or drive to work?');
      expect(result.categories).toContain('transport');
    });

    it('detects indoor category', () => {
      const result = classifyQuery('How to improve indoor air quality with plants?');
      expect(result.categories).toContain('indoor');
    });

    // ── Confidence ──────────────────────────────────────────────────
    it('confidence is between 0 and 1', () => {
      const result = classifyQuery('What is the current AQI?');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('confidence increases with more pattern matches', () => {
      const simple = classifyQuery('hello');
      const complex = classifyQuery(
        'Compare the long-term cardiovascular and respiratory health effects of chronic PM2.5 exposure in children vs elderly across multiple cities',
      );
      expect(complex.confidence).toBeGreaterThanOrEqual(simple.confidence);
    });
  });
});
