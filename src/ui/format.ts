import { CommandMap, ListFormat, SavedCommand } from '../core/types';
import { maskSensitive } from '../core/env';
import { theme, icons } from './theme';

/** "2 minutes ago" style relative time. */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const seconds = Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 1000));
  const units: Array<[number, string]> = [
    [31536000, 'year'],
    [2592000, 'month'],
    [86400, 'day'],
    [3600, 'hour'],
    [60, 'minute'],
  ];
  for (const [size, label] of units) {
    const count = Math.floor(seconds / size);
    if (count >= 1) return `${count} ${label}${count > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

export function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

function maskedCopy(commands: CommandMap): CommandMap {
  const out: CommandMap = {};
  for (const [name, cmd] of Object.entries(commands)) {
    out[name] = cmd.env ? { ...cmd, env: maskSensitive(cmd.env) } : cmd;
  }
  return out;
}

export function toJson(commands: CommandMap, mask = true): string {
  return JSON.stringify(mask ? maskedCopy(commands) : commands, null, 2);
}

function yamlQuote(value: string): string {
  return /^[\w./-]+$/.test(value) ? value : JSON.stringify(value);
}

export function toYaml(commands: CommandMap, mask = true): string {
  const data = mask ? maskedCopy(commands) : commands;
  const lines: string[] = [];
  for (const [name, cmd] of Object.entries(data)) {
    lines.push(`${yamlQuote(name)}:`);
    lines.push(`  command: ${yamlQuote(cmd.command)}`);
    lines.push(`  directory: ${yamlQuote(cmd.directory)}`);
    lines.push(`  pathMode: ${cmd.pathMode ?? 'saved'}`);
    if (cmd.env && Object.keys(cmd.env).length > 0) {
      lines.push('  env:');
      for (const [k, v] of Object.entries(cmd.env)) lines.push(`    ${k}: ${yamlQuote(v)}`);
    }
    lines.push(`  createdAt: ${yamlQuote(cmd.createdAt)}`);
    lines.push(`  updatedAt: ${yamlQuote(cmd.updatedAt)}`);
  }
  return lines.join('\n') + '\n';
}

export function toCompact(commands: CommandMap): string {
  return Object.entries(commands)
    .map(([name, cmd]) => `${name}: ${cmd.command} (${cmd.directory})`)
    .join('\n');
}

export interface TableOptions {
  runCounts?: Map<string, number>;
}

/** Rich human-readable listing with usage badges and env indicators. */
export function toTable(commands: CommandMap, options: TableOptions = {}): string {
  const names = Object.keys(commands).sort((a, b) => {
    const runsA = options.runCounts?.get(a) ?? 0;
    const runsB = options.runCounts?.get(b) ?? 0;
    return runsB - runsA || a.localeCompare(b);
  });
  const lines: string[] = [];
  for (const name of names) {
    const cmd = commands[name];
    const runs = options.runCounts?.get(name) ?? 0;
    const badges = [
      runs > 0 ? theme.dim(`${icons.fire} ${runs} run${runs > 1 ? 's' : ''}`) : '',
      cmd.env && Object.keys(cmd.env).length > 0
        ? `${icons.env} ${theme.dim(`${Object.keys(cmd.env).length} env`)}`
        : '',
      (cmd.pathMode ?? 'saved') === 'current' ? theme.dim('[current dir]') : '',
    ]
      .filter(Boolean)
      .join('  ');
    lines.push(`  ${theme.name(name)}${badges ? `  ${badges}` : ''}`);
    lines.push(`    ${theme.command(truncate(cmd.command, 100))}`);
    lines.push(`    ${icons.folder} ${theme.dim(cmd.directory)}`);
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}

export function render(
  commands: CommandMap,
  format: ListFormat,
  options: TableOptions = {}
): string {
  switch (format) {
    case 'json':
      return toJson(commands);
    case 'yaml':
      return toYaml(commands);
    case 'compact':
      return toCompact(commands);
    case 'table':
      return toTable(commands, options);
  }
}

/** One-line summary of a command used in confirmation output. */
export function summarize(name: string, cmd: SavedCommand): string {
  return `${theme.name(name)} ${theme.dim('→')} ${cmd.command} ${theme.dim(`(${cmd.directory})`)}`;
}
