import { getMetadata, setMetadata } from './store';
import { ExecutionEntry } from './types';

const HISTORY_KEY = 'execution_history';
const MAX_ENTRIES = 200;

export function getExecutionHistory(): ExecutionEntry[] {
  return getMetadata<ExecutionEntry[]>(HISTORY_KEY) ?? [];
}

export function recordExecution(
  commandName: string,
  outcome?: { exitCode: number; durationMs: number }
): void {
  const history = getExecutionHistory();
  history.unshift({
    commandName,
    executedAt: new Date().toISOString(),
    ...(outcome ? { exitCode: outcome.exitCode, durationMs: outcome.durationMs } : {}),
  });
  setMetadata(HISTORY_KEY, history.slice(0, MAX_ENTRIES));
}

/** Most recent execution entry for a command, if any. */
export function getLastExecution(commandName: string): ExecutionEntry | undefined {
  return getExecutionHistory().find((e) => e.commandName === commandName);
}

export function clearExecutionHistory(): void {
  setMetadata(HISTORY_KEY, []);
}

/** Unique command names, most recently run first. Powers @N references. */
export function getRecentNames(limit?: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const entry of getExecutionHistory()) {
    if (seen.has(entry.commandName)) continue;
    seen.add(entry.commandName);
    result.push(entry.commandName);
    if (limit !== undefined && result.length >= limit) break;
  }
  return result;
}

export interface CommandStats {
  name: string;
  runCount: number;
  lastRunAt: string;
}

/** Per-command usage stats, most-used first. */
export function getUsageStats(): CommandStats[] {
  const stats = new Map<string, CommandStats>();
  for (const entry of getExecutionHistory()) {
    const existing = stats.get(entry.commandName);
    if (existing) {
      existing.runCount += 1;
    } else {
      stats.set(entry.commandName, {
        name: entry.commandName,
        runCount: 1,
        lastRunAt: entry.executedAt,
      });
    }
  }
  return [...stats.values()].sort((a, b) => b.runCount - a.runCount);
}
