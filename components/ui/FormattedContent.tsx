'use client';

import React, { useMemo, useState } from 'react';

export interface FormattedContentProps {
  content: string;
  isStreaming?: boolean;
  variant?: 'card' | 'bubble';
  showCopyButton?: boolean;
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface ParsedBlock {
  id: string;
  type: 'section' | 'paragraph' | 'list' | 'heading' | 'disclaimer' | 'table' | 'divider';
  title?: string;
  content: string;
  items?: string[];
  level?: number;
  icon?: string;
  tableData?: TableData;
}

/**
 * Returns an appropriate contextual icon for a section based on its title.
 */
function getSectionIcon(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('ventilat') || lower.includes('air exchange') || lower.includes('window')) {
    return '🪟';
  }
  if (lower.includes('engineer') || lower.includes('seal') || lower.includes('filter') || lower.includes('hrv') || lower.includes('hepa')) {
    return '🛠️';
  }
  if (lower.includes('exposure') || lower.includes('protect') || lower.includes('mask') || lower.includes('personal') || lower.includes('child')) {
    return '🛡️';
  }
  if (lower.includes('cook') || lower.includes('stove') || lower.includes('indoor source')) {
    return '🍳';
  }
  if (lower.includes('transit') || lower.includes('commute') || lower.includes('transport')) {
    return '🚲';
  }
  if (lower.includes('health') || lower.includes('medical') || lower.includes('respiratory') || lower.includes('asthma')) {
    return '🏥';
  }
  return '📋';
}

/**
 * Formats inline markdown safely:
 * - **bold** -> <strong>
 * - `code` -> <code>
 * - handles trailing unclosed ** during streaming
 */
export function formatInlineText(text: string): string {
  if (!text) return '';

  const html = text
    // Replace markdown links [label](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="formatted-link">$1</a>')
    // Replace inline code `code`
    .replace(/`([^`]+)`/g, '<code class="formatted-code">$1</code>')
    // Replace completed **bold**
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="formatted-bold">$1</strong>')
    // Replace trailing unclosed ** during live token streaming
    .replace(/\*\*([^*]+)$/, '<strong class="formatted-bold">$1</strong>')
    // Replace simple *italic*
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

  return html;
}

/**
 * Parses markdown table lines into structured TableData.
 */
function parseMarkdownTable(lines: string[]): TableData | null {
  if (lines.length < 2) return null;

  const splitRow = (line: string): string[] => {
    return line
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim());
  };

  const headers = splitRow(lines[0]);
  if (headers.length === 0 || headers.every((h) => !h)) return null;

  let startIndex = 1;
  // If line 1 is separator |---|---|
  if (lines.length > 1 && /^[\s|:-]+$/.test(lines[1])) {
    startIndex = 2;
  }

  const rows: string[][] = [];
  let lastPriority = 'Easy';

  for (let i = startIndex; i < lines.length; i++) {
    const row = splitRow(lines[i]);
    if (row.length > 0 && row.some((c) => c.length > 0)) {
      // Pad to match header count
      while (row.length < headers.length) {
        row.push('');
      }

      // If first column is Priority and empty, inherit previous row priority
      if (headers[0]?.toLowerCase().includes('priority')) {
        if (!row[0] && lastPriority) {
          row[0] = lastPriority;
        } else if (row[0]) {
          lastPriority = row[0];
        }
      }

      rows.push(row);
    }
  }

  return { headers, rows };
}

/**
 * Pre-processes raw LLM output so that pipe-separated table rows that arrive
 * on a single line (e.g. "| A | B | | C | D |") are split into proper
 * newlines.  Also separates headings glued to tables and normalises
 * horizontal rules.
 */
function preProcessContent(raw: string): string {
  let s = raw;

  // 1. Heading glued to table: "## Heading | Col 1 | Col 2 |"
  s = s.replace(/^(#{1,4}\s+[^|\n]+?)(\|.+)$/gm, '$1\n$2');

  // 2. Horizontal rules glued to text
  s = s.replace(/^---+$/gm, '\n---\n');

  // 3. Inline table rows on a single line.
  //    Pattern: | cell | cell | | cell | cell | (double-pipe "| |" is row boundary)
  //    Only apply when the line is NOT already multi-line and has ≥ 3 pipes
  //    We detect "| |" (pipe, optional space, pipe) as a row break and insert newlines.
  const lines = s.split('\n');
  const expanded: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Count pipes — only process lines with many pipes (table-like)
    const pipeCount = (trimmed.match(/\|/g) ?? []).length;

    // If a single line has a separator row embedded (|---|---|) split around it
    if (pipeCount >= 6 && /\|[\s-]*\|/.test(trimmed)) {
      // Split on the pattern where a cell-end pipe is followed by a header pipe
      // e.g. "| H1 | H2 | |------|------| | A | B |"
      const sepMatch = trimmed.match(/^(.+?)(\|\s*[-:]+[-:|\s]+\|)(.*)$/);
      if (sepMatch) {
        const before = sepMatch[1].trim();
        const separator = sepMatch[2].trim();
        const after = sepMatch[3].trim();

        if (before) expanded.push(before);
        expanded.push(separator);

        // After the separator, split remaining rows at "| |" boundary
        if (after) {
          // Split where "||" or "| |" appears (row boundary)
          const rows = after.split(/\|\s*\|/).filter(Boolean);
          for (const row of rows) {
            const r = row.trim();
            if (r) {
              const normalised = r.startsWith('|') ? r : `| ${r}`;
              const finalRow = normalised.endsWith('|') ? normalised : `${normalised} |`;
              expanded.push(finalRow);
            }
          }
        }
        continue;
      }
    }

    expanded.push(line);
  }

  return expanded.join('\n');
}

/**
 * Parses raw markdown content into structured blocks:
 * - Detects Markdown Tables (| col | col |)
 * - Detects horizontal rules (---)
 * - Detects sections like `**Title** - Body` or `**Title:** Body`
 * - Detects embedded or trailing health disclaimers
 * - Detects headings and bullet lists
 */
export function parseContentBlocks(rawContent: string): ParsedBlock[] {
  if (!rawContent || !rawContent.trim()) {
    return [];
  }

  const sanitized = preProcessContent(rawContent);

  const rawLines = sanitized.split('\n');
  const blocks: ParsedBlock[] = [];
  let blockIndex = 0;

  let i = 0;
  while (i < rawLines.length) {
    const line = rawLines[i].trim();

    // Skip empty lines
    if (!line) {
      i++;
      continue;
    }

    // 1. Horizontal Rule (---, ***, ___)
    if (/^[-*_]{3,}$/.test(line)) {
      blocks.push({
        id: `block-${blockIndex++}`,
        type: 'divider',
        content: '',
      });
      i++;
      continue;
    }

    // 2. Health Disclaimer Check
    const disclaimerRegex = /^(?:\*\*(?:Health disclaimer|Health note|Disclaimer):?\*\*|(?:Health disclaimer|Health note|Disclaimer):)\s*([\s\S]*)$/i;
    const disclaimerMatch = line.match(disclaimerRegex);
    if (disclaimerMatch) {
      blocks.push({
        id: `block-${blockIndex++}`,
        type: 'disclaimer',
        title: 'Health & Medical Advisory',
        content: disclaimerMatch[1].trim(),
        icon: '⚠️',
      });
      i++;
      continue;
    }

    // 3. Headings (###, ##, #)
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        id: `block-${blockIndex++}`,
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2].trim(),
      });
      i++;
      continue;
    }

    // 4. Markdown Table Check (starts and ends with | or contains multiple pipes)
    if (line.startsWith('|') || (line.includes('|') && i + 1 < rawLines.length && rawLines[i + 1].includes('|'))) {
      const tableLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().includes('|')) {
        tableLines.push(rawLines[i].trim());
        i++;
      }

      const tableData = parseMarkdownTable(tableLines);
      if (tableData && tableData.rows.length > 0) {
        blocks.push({
          id: `block-${blockIndex++}`,
          type: 'table',
          content: '',
          tableData,
        });
        continue;
      }
      // If table parsing failed, fall through to process tableLines as text
    }

    // 5. Section Check: **Title** - Description or **Title**: Description
    const sectionMatch = line.match(/^\*\*([^*]+)\*\*(?:\s*[-:—]\s*|\s*:\s*)([\s\S]*)$/);
    if (sectionMatch) {
      const title = sectionMatch[1].trim();
      let body = sectionMatch[2].trim();

      // Check if subsequent lines belong to this section before next empty line or section
      i++;
      while (i < rawLines.length && rawLines[i].trim() && !rawLines[i].trim().startsWith('**') && !rawLines[i].trim().startsWith('#') && !rawLines[i].trim().startsWith('|')) {
        body += ' ' + rawLines[i].trim();
        i++;
      }

      // Check if disclaimer was embedded inside this section
      const embeddedDisc = body.match(/(?:[\s\n]|^)(?:\*\*(?:Health disclaimer|Health note|Disclaimer):?\*\*|(?:Health disclaimer|Health note|Disclaimer):)\s*([\s\S]*)$/i);
      if (embeddedDisc && embeddedDisc.index !== undefined) {
        const preText = body.slice(0, embeddedDisc.index).trim();
        const discText = embeddedDisc[1].trim();

        blocks.push({
          id: `block-${blockIndex++}`,
          type: 'section',
          title,
          content: preText,
          icon: getSectionIcon(title),
        });

        blocks.push({
          id: `block-${blockIndex++}`,
          type: 'disclaimer',
          title: 'Health & Medical Advisory',
          content: discText,
          icon: '⚠️',
        });
      } else {
        blocks.push({
          id: `block-${blockIndex++}`,
          type: 'section',
          title,
          content: body,
          icon: getSectionIcon(title),
        });
      }
      continue;
    }

    // 6. Bullet / Numbered Lists
    if (/^\s*[-*•]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < rawLines.length && (/^\s*[-*•]\s+/.test(rawLines[i]) || /^\s*\d+\.\s+/.test(rawLines[i]))) {
        items.push(rawLines[i].replace(/^\s*[-*•\d.]+\s*/, '').trim());
        i++;
      }

      blocks.push({
        id: `block-${blockIndex++}`,
        type: 'list',
        content: '',
        items,
      });
      continue;
    }

    // 7. Regular Paragraph
    let paraText = line;
    i++;
    while (i < rawLines.length && rawLines[i].trim() && !rawLines[i].trim().startsWith('#') && !rawLines[i].trim().startsWith('**') && !rawLines[i].trim().startsWith('|') && !rawLines[i].trim().startsWith('---')) {
      paraText += ' ' + rawLines[i].trim();
      i++;
    }

    // Check if disclaimer was appended to paragraph
    const embeddedDisc = paraText.match(/(?:[\s\n]|^)(?:\*\*(?:Health disclaimer|Health note|Disclaimer):?\*\*|(?:Health disclaimer|Health note|Disclaimer):)\s*([\s\S]*)$/i);
    if (embeddedDisc && embeddedDisc.index !== undefined) {
      const preText = paraText.slice(0, embeddedDisc.index).trim();
      const discText = embeddedDisc[1].trim();

      if (preText) {
        blocks.push({
          id: `block-${blockIndex++}`,
          type: 'paragraph',
          content: preText,
        });
      }
      blocks.push({
        id: `block-${blockIndex++}`,
        type: 'disclaimer',
        title: 'Health & Medical Advisory',
        content: discText,
        icon: '⚠️',
      });
    } else {
      blocks.push({
        id: `block-${blockIndex++}`,
        type: 'paragraph',
        content: paraText,
      });
    }
  }

  return blocks;
}

export function FormattedContent({
  content,
  isStreaming = false,
  variant = 'card',
  showCopyButton = false,
}: FormattedContentProps) {
  const [copied, setCopied] = useState(false);

  const blocks = useMemo(() => {
    return parseContentBlocks(content);
  }, [content]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  if (!content && !isStreaming) {
    return null;
  }

  const sectionCount = blocks.filter((b) => b.type === 'section' || b.type === 'table').length;

  return (
    <div className={`formatted-content-root formatted-variant-${variant}`}>
      {/* Header bar if copy button requested and multiple sections */}
      {showCopyButton && content.length > 20 && (
        <div className="stream-header-bar">
          <div className="stream-header-meta">
            <span className="stream-status-pill">
              <span className={`stream-indicator-dot ${isStreaming ? 'pulse' : 'static'}`} />
              {isStreaming ? 'Live Telemetry Generating' : 'Synthesized Environmental Advisory'}
            </span>
            {sectionCount > 0 && (
              <span className="stream-protocol-count">
                {sectionCount} Actionable Protocol{sectionCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button
            type="button"
            className="stream-copy-btn"
            onClick={handleCopy}
            aria-label="Copy telemetry report to clipboard"
          >
            {copied ? '✓ Copied' : 'Copy Report'}
          </button>
        </div>
      )}

      {/* Render structured blocks */}
      <div className="formatted-blocks-container">
        {blocks.map((block, idx) => {
          const isLastBlock = idx === blocks.length - 1;

          // DIVIDER
          if (block.type === 'divider') {
            return <hr key={block.id} className="stream-divider" />;
          }

          // MARKDOWN TABLE
          if (block.type === 'table' && block.tableData) {
            return (
              <div key={block.id} className="stream-table-wrapper animate-fade-up">
                <table className="stream-table">
                  <thead>
                    <tr>
                      {block.tableData.headers.map((h, i) => (
                        <th key={i}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.tableData.rows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {row.map((cell, cIdx) => {
                          const lower = cell.toLowerCase().trim();
                          const isPriority = lower === 'easy' || lower === 'moderate' || lower === 'challenging' || lower === 'high';
                          return (
                            <td key={cIdx}>
                              {isPriority ? (
                                <span className={`priority-badge priority-${lower}`}>
                                  {cell}
                                </span>
                              ) : (
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: formatInlineText(cell),
                                  }}
                                />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {isStreaming && isLastBlock && (
                  <span className="stream-cursor-pulse" aria-hidden="true" />
                )}
              </div>
            );
          }

          // SECTION CARD
          if (block.type === 'section') {
            return (
              <div key={block.id} className="stream-section-card animate-fade-up">
                <div className="stream-section-header">
                  <span className="stream-section-icon" aria-hidden="true">
                    {block.icon || '📋'}
                  </span>
                  <h4 className="stream-section-title">
                    {block.title}
                  </h4>
                  <span className="stream-section-badge">Actionable Guidance</span>
                </div>
                <div
                  className="stream-section-body"
                  dangerouslySetInnerHTML={{
                    __html: formatInlineText(block.content),
                  }}
                />
                {isStreaming && isLastBlock && (
                  <span className="stream-cursor-pulse" aria-hidden="true" />
                )}
              </div>
            );
          }

          // DISCLAIMER CARD
          if (block.type === 'disclaimer') {
            return (
              <div key={block.id} className="stream-disclaimer-card animate-fade-up" role="note">
                <div className="stream-disclaimer-header">
                  <span className="stream-disclaimer-icon" aria-hidden="true">
                    {block.icon || '⚠️'}
                  </span>
                  <strong className="stream-disclaimer-title">
                    {block.title || 'Health & Medical Advisory'}
                  </strong>
                </div>
                <div
                  className="stream-disclaimer-body"
                  dangerouslySetInnerHTML={{
                    __html: formatInlineText(block.content),
                  }}
                />
                {isStreaming && isLastBlock && (
                  <span className="stream-cursor-pulse" aria-hidden="true" />
                )}
              </div>
            );
          }

          // HEADINGS
          if (block.type === 'heading') {
            const HeadingTag = block.level === 1 ? 'h2' : block.level === 2 ? 'h3' : 'h4';
            return (
              <HeadingTag key={block.id} className="stream-heading">
                {block.content}
              </HeadingTag>
            );
          }

          // BULLET LIST
          if (block.type === 'list' && block.items) {
            return (
              <ul key={block.id} className="stream-list">
                {block.items.map((item, i) => (
                  <li key={i} className="stream-list-item">
                    <span className="stream-list-bullet">•</span>
                    <span
                      dangerouslySetInnerHTML={{
                        __html: formatInlineText(item),
                      }}
                    />
                  </li>
                ))}
              </ul>
            );
          }

          // STANDARD PARAGRAPH
          return (
            <div key={block.id} className="stream-paragraph">
              <span
                dangerouslySetInnerHTML={{
                  __html: formatInlineText(block.content),
                }}
              />
              {isStreaming && isLastBlock && (
                <span className="stream-cursor-pulse" aria-hidden="true" />
              )}
            </div>
          );
        })}

        {/* Streaming indicator when no text yet */}
        {isStreaming && blocks.length === 0 && (
          <div className="stream-connecting-state">
            <span className="loading-spinner" />
            <span>Streaming real-time telemetry analysis…</span>
          </div>
        )}
      </div>
    </div>
  );
}
