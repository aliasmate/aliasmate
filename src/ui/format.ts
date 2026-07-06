import * as os from 'os';
import { CommandMap, ListFormat, SavedCommand } from '../core/types';
import { maskSensitive } from '../core/env';
import { renderTable } from './table';
import { theme } from './theme';

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
  lastRuns?: Map<string, string>;
  /** Names sourced from the project file (marked in the table). */
  projectNames?: Set<string>;
}

/** Shorten a path for display: home becomes ~. */
export function prettyPath(dir: string): string {
  const home = os.homedir();
  return dir.startsWith(home) ? `~${dir.slice(home.length)}` : dir;
}

/** Boxed, width-aware table sorted by usage. */
export function toTable(commands: CommandMap, options: TableOptions = {}): string {
  const names = Object.keys(commands).sort((a, b) => {
    const runsA = options.runCounts?.get(a) ?? 0;
    const runsB = options.runCounts?.get(b) ?? 0;
    return runsB - runsA || a.localeCompare(b);
  });

  const rows = names.map((name) => {
    const cmd = commands[name];
    const runs = options.runCounts?.get(name) ?? 0;
    const lastRun = options.lastRuns?.get(name);
    const envCount = cmd.env ? Object.keys(cmd.env).length : 0;
    const where =
      (cmd.pathMode ?? 'saved') === 'current' ? '(current dir)' : prettyPath(cmd.directory);
    return [
      name +
        (options.projectNames?.has(name) ? ' ⌂' : '') +
        (envCount > 0 ? ` ⁺${envCount}` : '') +
        (cmd.steps?.length ? ' ⛓' : ''),
      cmd.steps?.length ? cmd.steps.join(' → ') : cmd.command,
      where,
      runs > 0 ? String(runs) : '·',
      lastRun ? timeAgo(lastRun) : '—',
    ];
  });

  return renderTable(
    [
      { header: 'Name', min: 12, flex: 1, style: (t) => theme.name(t) },
      { header: 'Command', min: 24, flex: 4 },
      { header: 'Where', min: 14, flex: 2, style: (t) => theme.dim(t) },
      { header: 'Runs', min: 4, flex: 0, align: 'right', style: (t) => theme.accent(t) },
      { header: 'Last run', min: 14, flex: 0, style: (t) => theme.dim(t) },
    ],
    rows
  );
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
