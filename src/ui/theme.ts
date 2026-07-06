import chalk from 'chalk';

/**
 * Design language: one warm accent, quiet grays, flat surfaces.
 * Inspired by modern agent CLIs — content first, chrome barely visible.
 */
const accent = chalk.hex('#D97757'); // terracotta
const subtle = chalk.hex('#8B8B8B');
const faint = chalk.hex('#5C5C5C');
const green = chalk.hex('#78B88D');
const yellow = chalk.hex('#D9B36C');
const red = chalk.hex('#D26A6A');

export const theme = {
  brand: accent.bold,
  accent,
  heading: chalk.bold,
  name: chalk.bold,
  command: chalk.reset,
  dim: subtle,
  faint,
  success: green,
  warning: yellow,
  error: red,
  selected: accent.bold,
};

export const icons = {
  ok: green('✓'),
  fail: red('✗'),
  warn: yellow('▲'),
  dot: accent('●'),
  caret: accent('›'),
  run: accent('›'),
  spark: accent('+'),
  fire: '↻',
};

export function ok(message: string): void {
  console.log(`${icons.ok} ${message}`);
}

export function warn(message: string): void {
  console.log(`${icons.warn} ${theme.warning(message)}`);
}

export function fail(message: string): void {
  console.error(`${icons.fail} ${theme.error(message)}`);
}

/** "● aliasmate" header line used across screens. */
export function brandLine(suffix?: string): string {
  return `${icons.dot} ${chalk.bold('aliasmate')}${suffix ? ` ${theme.dim(suffix)}` : ''}`;
}
