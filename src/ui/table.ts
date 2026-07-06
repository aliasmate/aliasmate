import chalk from 'chalk';

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

const H = '─';

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
 * Render a width-aware table with rounded borders. Columns share leftover
 * space by their flex weight and are truncated with an ellipsis.
 */
export function renderTable(
  columns: Column[],
  rows: string[][],
  maxWidth = terminalWidth()
): string {
  const chrome = columns.length * 3 + 1; // "│ cell │ cell │"
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

  const line = (l: string, m: string, r: string) =>
    chalk.gray(l + widths.map((w) => H.repeat(w + 2)).join(m) + r);
  const sep = chalk.gray('│');

  const header = widths
    .map((w, i) =>
      chalk.bold.gray(fit(columns[i].header.toUpperCase(), w, columns[i].align ?? 'left'))
    )
    .join(` ${sep} `);

  const body = rows.map((row, rowIndex) =>
    widths
      .map((w, i) => {
        const col = columns[i];
        const cell = fit(row[i] ?? '', w, col.align ?? 'left');
        return col.style ? col.style(cell, rowIndex) : cell;
      })
      .join(` ${sep} `)
  );

  return [
    line('╭', '┬', '╮'),
    `${sep} ${header} ${sep}`,
    line('├', '┼', '┤'),
    ...body.map((r) => `${sep} ${r} ${sep}`),
    line('╰', '┴', '╯'),
  ].join('\n');
}
