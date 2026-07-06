/** Where a saved command executes: its saved directory or the caller's cwd. */
export type PathMode = 'saved' | 'current';

/** A saved command and its execution context. Matches the on-disk config.json schema. */
export interface SavedCommand {
  command: string;
  directory: string;
  pathMode?: PathMode;
  env?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export type CommandMap = Record<string, SavedCommand>;

/** Shortcut alias name -> saved command name. */
export type AliasMap = Record<string, string>;

export interface ExecutionEntry {
  commandName: string;
  executedAt: string;
}

export interface ValidationIssue {
  level: 'error' | 'warning';
  message: string;
}

export interface ExecutionResult {
  success: boolean;
  exitCode: number;
  durationMs: number;
}

export type ListFormat = 'table' | 'json' | 'yaml' | 'compact';
