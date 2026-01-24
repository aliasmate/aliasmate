import { getMetadata, setMetadata } from '../storage';

/**
 * Execution history entry
 */
export interface ExecutionEntry {
  /** Name of the command that was executed */
  commandName: string;
  /** ISO 8601 timestamp when the command was executed */
  executedAt: string;
}

/**
 * Configuration for execution history
 */
export interface RecentConfig {
  /** Maximum number of entries to keep in history */
  maxSize: number;
}

const RECENT_HISTORY_KEY = 'execution_history';
const RECENT_CONFIG_KEY = 'recent_config';
const DEFAULT_MAX_SIZE = 50;

/**
 * Get the recent commands configuration
 */
export function getRecentConfig(): RecentConfig {
  const config = getMetadata<RecentConfig>(RECENT_CONFIG_KEY);
  return config || { maxSize: DEFAULT_MAX_SIZE };
}

/**
 * Set the recent commands configuration
 */
export function setRecentConfig(config: RecentConfig): boolean {
  return setMetadata(RECENT_CONFIG_KEY, config);
}

/**
 * Get execution history
 */
export function getExecutionHistory(): ExecutionEntry[] {
  const history = getMetadata<ExecutionEntry[]>(RECENT_HISTORY_KEY);
  return history || [];
}

/**
 * Save execution history
 */
function saveExecutionHistory(history: ExecutionEntry[]): boolean {
  return setMetadata(RECENT_HISTORY_KEY, history);
}

/**
 * Record a command execution
 * @param commandName - The name of the command that was executed
 */
export function recordExecution(commandName: string): void {
  const history = getExecutionHistory();
  const config = getRecentConfig();

  // Add new entry to the beginning
  history.unshift({
    commandName,
    executedAt: new Date().toISOString(),
  });

  // Trim to max size
  if (history.length > config.maxSize) {
    history.splice(config.maxSize);
  }

  saveExecutionHistory(history);
}

/**
 * Get recent command names (most recent first, deduplicated)
 * @param limit - Maximum number of entries to return
 * @returns Array of unique command names in order of most recent execution
 */
export function getRecentCommands(limit?: number): string[] {
  const history = getExecutionHistory();
  const seen = new Set<string>();
  const result: string[] = [];

  for (const entry of history) {
    if (!seen.has(entry.commandName)) {
      seen.add(entry.commandName);
      result.push(entry.commandName);

      if (limit && result.length >= limit) {
        break;
      }
    }
  }

  return result;
}

/**
 * Get the Nth most recent command (0-indexed)
 * @param index - Index of the command (0 = most recent)
 * @returns Command name if found, undefined otherwise
 */
export function getRecentCommandByIndex(index: number): string | undefined {
  const recentCommands = getRecentCommands();
  return recentCommands[index];
}

/**
 * Clear execution history
 */
export function clearExecutionHistory(): boolean {
  return saveExecutionHistory([]);
}

/**
 * Get full execution history with timestamps
 * @param limit - Maximum number of entries to return
 */
export function getRecentCommandsWithTimestamps(limit?: number): ExecutionEntry[] {
  const history = getExecutionHistory();
  return limit ? history.slice(0, limit) : history;
}
