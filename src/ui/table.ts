import { theme } from './theme';

export interface Column {
  header: string;
  /** Minimum width the column needs to stay readable. */
  min: number;
  /** Relative share of leftover width (0 = fixed at min). */
  flex: number;
  align?: 'left' | 'right';
  /** Style applied to cell text (after truncation). */
  style?: (text: string, rowIndex: number) => string;
}

/** Visible length, ignoring ANSI codes. */
// eslint-disable-next-line no-control-regex
const ANSI = /\x1b\[[0-9;]*m/g;
export function visibleWidth(text: string): number {
  return text.replace(ANSI, '').length;
}

function fit(text: string, width: number, align: 'left' | 'right'): string {
  const truncated = text.length > width ? `${text.slice(0, Math.max(0, width - 1))}…` : text;
  const pad = ' '.repeat(width - truncated.length);
  return align === 'right' ? pad + truncated : truncated + pad;
}

export function terminalWidth(): number {
  return process.stdout.columns && process.stdout.columns > 40 ? process.stdout.columns : 100;
}

/**
 * Flat, borderless table: dim uppercase headers, a hairline rule, clean rows.
 * Columns share leftover space by flex weight and truncate with an ellipsis.
 */
export function renderTable(
  columns: Column[],
  rows: string[][],
  maxWidth = terminalWidth()
): string {
  const gutter = 2;
  const chrome = gutter + (columns.length - 1) * 2;
  const available = Math.max(
    maxWidth - chrome,
    columns.reduce((s, c) => s + c.min, 0)
  );
  const minTotal = columns.reduce((s, c) => s + c.min, 0);
  const flexTotal = columns.reduce((s, c) => s + c.flex, 0) || 1;
  const spare = Math.max(0, available - minTotal);

  // Cap each column at its widest actual content so spare space isn't wasted.
  const widths = columns.map((col, i) => {
    const contentMax = Math.max(
      col.header.length,
      ...rows.map((r) => (r[i] ?? '').length),
      col.min
    );
    const flexed = col.min + Math.floor((spare * col.flex) / flexTotal);
    return Math.min(Math.max(col.min, flexed), contentMax);
  });

  const indent = ' '.repeat(gutter);
  const header =
    indent +
    widths
      .map((w, i) =>
        theme.faint(fit(columns[i].header.toUpperCase(), w, columns[i].align ?? 'left'))
      )
      .join('  ');
  const rule =
    indent + theme.faint('─'.repeat(widths.reduce((s, w) => s + w, 0) + (widths.length - 1) * 2));

  const body = rows.map(
    (row, rowIndex) =>
      indent +
      widths
        .map((w, i) => {
          const col = columns[i];
          const cell = fit(row[i] ?? '', w, col.align ?? 'left');
          return col.style ? col.style(cell, rowIndex) : cell;
        })
        .join('  ')
  );

  return [header, rule, ...body].join('\n');
}
