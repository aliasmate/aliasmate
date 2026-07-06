import chalk from 'chalk';

/** Single place for the CLI's visual language. */
export const theme = {
  brand: chalk.cyan.bold,
  heading: chalk.bold,
  name: chalk.cyan,
  command: chalk.white,
  dim: chalk.gray,
  success: chalk.green,
  warning: chalk.yellow,
  error: chalk.red,
  accent: chalk.magenta,
  badge: chalk.bgCyan.black,
};

export const icons = {
  ok: chalk.green('✓'),
  fail: chalk.red('✗'),
  warn: chalk.yellow('⚠'),
  run: chalk.cyan('▶'),
  fire: '🔥',
  folder: chalk.gray('📂'),
  env: chalk.gray('🌍'),
  spark: '✨',
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
