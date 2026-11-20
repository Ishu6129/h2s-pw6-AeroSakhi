import { describe, it, expect } from 'vitest';
import { parseContentBlocks, formatInlineText } from '@/components/ui/FormattedContent';

describe('formatInlineText', () => {
  it('converts markdown bold syntax to strong tags', () => {
    const raw = 'Safest window is **between 12:00 and 16:00 local time** daily.';
    const formatted = formatInlineText(raw);
    expect(formatted).toContain('<strong class="formatted-bold">between 12:00 and 16:00 local time</strong>');
  });

  it('handles unclosed bold syntax during streaming', () => {
    const raw = 'Safest window is **between 12:00 and 16:00';
    const formatted = formatInlineText(raw);
    expect(formatted).toContain('<strong class="formatted-bold">between 12:00 and 16:00</strong>');
  });

  it('converts inline backticks to code tags', () => {
    const raw = 'Levels drop below `12 µgm-3` with filtration.';
    const formatted = formatInlineText(raw);
    expect(formatted).toContain('<code class="formatted-code">12 µgm-3</code>');
  });

  it('converts markdown links to secure anchor tags', () => {
    const raw = 'Refer to [WHO Guidelines](https://who.int) for standards.';
    const formatted = formatInlineText(raw);
    expect(formatted).toContain('href="https://who.int"');
    expect(formatted).toContain('target="_blank"');
    expect(formatted).toContain('rel="noopener noreferrer"');
  });
});

describe('parseContentBlocks', () => {
  it('parses structured section blocks with title and body', () => {
    const text = `**When to ventilate** - In most temperate-climate cities the nocturnal inversion traps pollutants until mid-day.`;
    const blocks = parseContentBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('section');
    expect(blocks[0].title).toBe('When to ventilate');
    expect(blocks[0].content).toBe('In most temperate-climate cities the nocturnal inversion traps pollutants until mid-day.');
    expect(blocks[0].icon).toBe('🪟');
  });

  it('extracts embedded health disclaimers into distinct advisory blocks', () => {
    const text = `**Personal exposure reduction** - Keep indoor sources off during inversion. **Health disclaimer:** The guidance above is for general air management.`;
    const blocks = parseContentBlocks(text);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].type).toBe('section');
    expect(blocks[0].title).toBe('Personal exposure reduction');
    expect(blocks[0].content).toBe('Keep indoor sources off during inversion.');

    expect(blocks[1].type).toBe('disclaimer');
    expect(blocks[1].title).toBe('Health & Medical Advisory');
    expect(blocks[1].content).toBe('The guidance above is for general air management.');
    expect(blocks[1].icon).toBe('⚠️');
  });

  it('parses multiple sections correctly matching user query output', () => {
    const text = `**When to ventilate** - Safest window is midday.

**Engineering and sealing measures** - Install a heat-recovery ventilator.

**Personal exposure reduction** - Keep indoor air cleaners running. **Health disclaimer:** Informational only.`;

    const blocks = parseContentBlocks(text);
    expect(blocks).toHaveLength(4);
    expect(blocks[0].title).toBe('When to ventilate');
    expect(blocks[1].title).toBe('Engineering and sealing measures');
    expect(blocks[2].title).toBe('Personal exposure reduction');
    expect(blocks[3].type).toBe('disclaimer');
  });

  it('returns empty array for empty or whitespace-only content', () => {
    expect(parseContentBlocks('')).toEqual([]);
    expect(parseContentBlocks('   \n  \n ')).toEqual([]);
  });

  it('handles standard markdown headings and lists', () => {
    const text = `### Advisory Overview

- Keep windows sealed
- Run air purifier on low
- Avoid outdoor exercise`;

    const blocks = parseContentBlocks(text);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].type).toBe('heading');
    expect(blocks[0].content).toBe('Advisory Overview');
    expect(blocks[1].type).toBe('list');
    expect(blocks[1].items).toEqual([
      'Keep windows sealed',
      'Run air purifier on low',
      'Avoid outdoor exercise',
    ]);
  });

  it('parses markdown tables with headers and rows', () => {
    const text = `## 1. Quick-Reference Actions
| Priority | Action | Impact | Implementation Notes |
| ---------- | -------- | -------- | ----------------- |
| Easy | Close all windows | Reduces outdoor pollutant influx | Use airtight seals |
| Moderate | Use N95 mask | Blocks >95% particles | Proper fit |`;

    const blocks = parseContentBlocks(text);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].type).toBe('heading');
    expect(blocks[0].content).toBe('1. Quick-Reference Actions');

    expect(blocks[1].type).toBe('table');
    expect(blocks[1].tableData?.headers).toEqual([
      'Priority',
      'Action',
      'Impact',
      'Implementation Notes',
    ]);
    expect(blocks[1].tableData?.rows).toHaveLength(2);
    expect(blocks[1].tableData?.rows[0]).toEqual([
      'Easy',
      'Close all windows',
      'Reduces outdoor pollutant influx',
      'Use airtight seals',
    ]);
  });

  it('parses horizontal rule dividers (---)', () => {
    const text = `Immediate Protection Plan

---

Details follow below`;

    const blocks = parseContentBlocks(text);
    expect(blocks).toHaveLength(3);
    expect(blocks[0].type).toBe('paragraph');
    expect(blocks[1].type).toBe('divider');
    expect(blocks[2].type).toBe('paragraph');
  });
});
