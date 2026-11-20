import { describe, it, expect } from 'vitest';
import {
  PROMPT_VERSION,
  getSystemPrompt,
  getAnalysisPrompt,
  getStreamingPrompt,
} from '@/lib/prompt-templates';

describe('lib/prompt-templates', () => {
  describe('PROMPT_VERSION', () => {
    it('is a non-empty string', () => {
      expect(typeof PROMPT_VERSION).toBe('string');
      expect(PROMPT_VERSION.length).toBeGreaterThan(0);
    });

    it('follows semver format', () => {
      expect(PROMPT_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('getSystemPrompt', () => {
    it('returns a non-empty string without context', () => {
      const prompt = getSystemPrompt();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('mentions AeroSakhi', () => {
      const prompt = getSystemPrompt();
      expect(prompt.toLowerCase()).toContain('aerosakhi');
    });

    it('contains air quality related keywords', () => {
      const prompt = getSystemPrompt().toLowerCase();
      expect(
        prompt.includes('air quality') ||
        prompt.includes('pollution') ||
        prompt.includes('emission'),
      ).toBe(true);
    });

    it('includes location when context is provided', () => {
      const prompt = getSystemPrompt({
        location: { city: 'Delhi', country: 'India' },
      });
      expect(prompt).toContain('Delhi');
    });

    it('includes household details when provided', () => {
      const prompt = getSystemPrompt({
        location: { city: 'Mumbai' },
        hasChildren: true,
        hasElderly: true,
      });
      expect(prompt.toLowerCase()).toContain('children');
      expect(prompt.toLowerCase()).toContain('elderly');
    });

    it('is at least 400 characters long', () => {
      const prompt = getSystemPrompt();
      expect(prompt.length).toBeGreaterThanOrEqual(400);
    });
  });

  describe('getAnalysisPrompt', () => {
    it('includes routines in the output', () => {
      const prompt = getAnalysisPrompt(
        ['Drive to work', 'Cook with gas'],
        { city: 'Delhi' },
      );
      expect(prompt).toContain('Drive to work');
      expect(prompt).toContain('Cook with gas');
    });

    it('includes the location city', () => {
      const prompt = getAnalysisPrompt(
        ['Walk to office'],
        { city: 'Bangalore', country: 'India' },
      );
      expect(prompt).toContain('Bangalore');
    });

    it('includes preferences when provided', () => {
      const prompt = getAnalysisPrompt(
        ['Commute by car'],
        { city: 'Delhi' },
        ['eco-friendly', 'low-cost'],
      );
      expect(prompt).toContain('eco-friendly');
      expect(prompt).toContain('low-cost');
    });

    it('requests JSON output format', () => {
      const prompt = getAnalysisPrompt(
        ['Routine 1'],
        { city: 'Delhi' },
      );
      expect(prompt.toLowerCase()).toContain('json');
    });
  });

  describe('getStreamingPrompt', () => {
    it('returns a non-empty string', () => {
      const prompt = getStreamingPrompt();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('is shorter than the full system prompt', () => {
      const streaming = getStreamingPrompt();
      const full = getSystemPrompt();
      expect(streaming.length).toBeLessThan(full.length);
    });

    it('includes location when context is provided', () => {
      const prompt = getStreamingPrompt({
        location: { city: 'Chennai' },
      });
      expect(prompt).toContain('Chennai');
    });

    it('mentions AeroSakhi', () => {
      const prompt = getStreamingPrompt();
      expect(prompt.toLowerCase()).toContain('aerosakhi');
    });
  });
});
