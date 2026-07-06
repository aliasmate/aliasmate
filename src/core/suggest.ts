import * as fs from 'fs';
import * as path from 'path';
import { getConfigDir } from './store';
import { listCommands } from './commands';

const RAW_LOG = 'raw.log';
const SCAN_WINDOW = 300;
const ROTATE_AT = 2000;
const MIN_REPEATS = 3;

export interface Suggestion {
  command: string;
  count: number;
}

function rawLogPath(): string {
  return path.join(getConfigDir(), RAW_LOG);
}

function isSuggestible(cmd: string): boolean {
  return (
    cmd.length > 4 &&
    cmd.length < 200 &&
    !cmd.startsWith('aliasmate') &&
    !cmd.startsWith('am ') &&
    !/^(cd|ls|ll|la|pwd|clear|exit|history|man|which|cat|echo|top|htop)(\s|$)/.test(cmd)
  );
}

/**
 * Find the command the user keeps typing but hasn't saved.
 * Reads the raw log written by the shell hook (aliasmate init).
 */
export function getSuggestion(): Suggestion | null {
  const file = rawLogPath();
  if (!fs.existsSync(file)) return null;

  let lines: string[];
  try {
    lines = fs.readFileSync(file, 'utf8').split('\n');
  } catch {
    return null;
  }

  // Keep the log from growing forever.
  if (lines.length > ROTATE_AT) {
    lines = lines.slice(-SCAN_WINDOW);
    try {
      fs.writeFileSync(file, lines.join('\n'), 'utf8');
    } catch {
      // Best effort.
    }
  }

  const savedCommands = new Set(Object.values(listCommands()).map((c) => c.command));
  const counts = new Map<string, number>();
  for (const raw of lines.slice(-SCAN_WINDOW)) {
    const cmd = raw.trim();
    if (!isSuggestible(cmd) || savedCommands.has(cmd)) continue;
    counts.set(cmd, (counts.get(cmd) ?? 0) + 1);
  }

  let best: Suggestion | null = null;
  for (const [command, count] of counts) {
    if (count >= MIN_REPEATS && (!best || count > best.count)) best = { command, count };
  }
  return best;
}

/** Drop a command from future suggestions (called after it gets saved). */
export function clearFromRawLog(command: string): void {
  const file = rawLogPath();
  if (!fs.existsSync(file)) return;
  try {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    fs.writeFileSync(file, lines.filter((l) => l.trim() !== command).join('\n'), 'utf8');
  } catch {
    // Best effort.
  }
}
