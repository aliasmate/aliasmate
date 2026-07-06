import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { SavedCommand, ValidationIssue } from './types';

const SHELL_BUILTINS = new Set([
  'cd',
  'echo',
  'export',
  'source',
  'alias',
  'set',
  'unset',
  'read',
  'eval',
  'exec',
  'exit',
  'true',
  'false',
  'test',
  'pwd',
  'type',
  'command',
  'wait',
]);

function executableExistsInPath(name: string): boolean {
  const pathVar = process.env.PATH ?? '';
  const exts =
    os.platform() === 'win32' ? (process.env.PATHEXT ?? '.EXE;.CMD;.BAT').split(';') : [''];
  for (const dir of pathVar.split(path.delimiter)) {
    if (!dir) continue;
    for (const ext of exts) {
      try {
        const candidate = path.join(dir, name + ext.toLowerCase());
        if (fs.existsSync(candidate) || fs.existsSync(path.join(dir, name + ext))) return true;
      } catch {
        // Unreadable PATH entry; skip.
      }
    }
  }
  return false;
}

function hasBalancedQuotes(command: string): boolean {
  let single = false;
  let double = false;
  for (let i = 0; i < command.length; i++) {
    const ch = command[i];
    if (ch === '\\' && !single) {
      i++;
      continue;
    }
    if (ch === "'" && !double) single = !single;
    if (ch === '"' && !single) double = !double;
  }
  return !single && !double;
}

/** Static checks on a saved command; errors block execution, warnings do not. */
export function validateSavedCommand(cmd: SavedCommand): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const executable = cmd.command.trim().split(/\s+/)[0] ?? '';
  const looksLikePath = executable.includes('/') || executable.includes('\\');
  const isEnvAssignment = /^[A-Za-z_][A-Za-z0-9_]*=/.test(executable);
  if (executable && !looksLikePath && !isEnvAssignment) {
    if (!SHELL_BUILTINS.has(executable) && !executableExistsInPath(executable)) {
      issues.push({ level: 'warning', message: `Command "${executable}" not found in PATH` });
    }
  } else if (looksLikePath) {
    const resolved = path.isAbsolute(executable)
      ? executable
      : path.join(cmd.directory, executable);
    if (!fs.existsSync(resolved)) {
      issues.push({ level: 'warning', message: `File "${executable}" does not exist` });
    }
  }

  if (!hasBalancedQuotes(cmd.command)) {
    issues.push({ level: 'error', message: 'Unbalanced quotes in command' });
  }

  if ((cmd.pathMode ?? 'saved') === 'saved' && !fs.existsSync(cmd.directory)) {
    issues.push({ level: 'error', message: `Directory does not exist: ${cmd.directory}` });
  }

  for (const key of Object.keys(cmd.env ?? {})) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      issues.push({ level: 'warning', message: `Invalid environment variable name: ${key}` });
    }
  }

  return issues;
}

const DANGEROUS_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /rm\s+(-[a-z]*[rf][a-z]*\s+)+/i, label: 'recursive/forced delete (rm -rf)' },
  { pattern: /\bdd\s+.*of=/i, label: 'raw disk write (dd)' },
  { pattern: /\bmkfs(\.\w+)?\b/i, label: 'filesystem format (mkfs)' },
  { pattern: />\s*\/dev\/sd[a-z]/i, label: 'write to block device' },
  { pattern: /:\(\)\s*\{.*\};\s*:/, label: 'fork bomb' },
];

/** Human-readable warnings when a command looks destructive. */
export function getDangerWarnings(command: string): string[] {
  return DANGEROUS_PATTERNS.filter(({ pattern }) => pattern.test(command)).map(
    ({ label }) => label
  );
}
