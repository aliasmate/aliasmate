import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { CommandMap, SavedCommand } from './types';
import { listCommands, saveCommand, commandExists } from './commands';
import { maskSensitive } from './env';
import { getConfigDir } from './store';
import { pushUndo } from './undo';

/** Expand a leading ~ and resolve to an absolute path. */
export function expandPath(file: string): string {
  const expanded = file.startsWith('~') ? path.join(os.homedir(), file.slice(1)) : file;
  return path.resolve(expanded);
}

/** Write all commands to a JSON file. Returns how many were exported. */
export function exportToFile(file: string, options: { full?: boolean } = {}): number {
  const commands = listCommands();
  const names = Object.keys(commands);
  if (names.length === 0) throw new Error('No commands to export');
  const data: CommandMap = {};
  for (const [name, cmd] of Object.entries(commands)) {
    data[name] = !options.full && cmd.env ? { ...cmd, env: maskSensitive(cmd.env) } : cmd;
  }
  fs.writeFileSync(expandPath(file), JSON.stringify(data, null, 2), 'utf8');
  return names.length;
}

export interface ImportResult {
  imported: number;
  skipped: string[];
  invalid: string[];
  backup?: string;
}

function isValidEntry(value: unknown): value is SavedCommand {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as SavedCommand).command === 'string' &&
    typeof (value as SavedCommand).directory === 'string'
  );
}

/**
 * Import commands from a JSON file, backing up the current config first.
 * Existing names are skipped unless `overwrite` names them.
 */
export function importFromFile(
  file: string,
  options: { overwrite?: (name: string) => boolean } = {}
): ImportResult {
  const resolved = expandPath(file);
  if (!fs.existsSync(resolved)) throw new Error(`File not found: ${file}`);

  let incoming: CommandMap;
  try {
    incoming = JSON.parse(fs.readFileSync(resolved, 'utf8')) as CommandMap;
  } catch {
    throw new Error('Could not parse the import file (JSON expected)');
  }

  const result: ImportResult = { imported: 0, skipped: [], invalid: [] };
  pushUndo(`import ${path.basename(resolved)}`);

  const existing = listCommands();
  if (Object.keys(existing).length > 0) {
    result.backup = path.join(getConfigDir(), `backup-${Date.now()}.json`);
    fs.writeFileSync(result.backup, JSON.stringify(existing, null, 2), 'utf8');
  }

  for (const [name, entry] of Object.entries(incoming)) {
    if (!isValidEntry(entry)) {
      result.invalid.push(name);
      continue;
    }
    if (commandExists(name) && !(options.overwrite?.(name) ?? false)) {
      result.skipped.push(name);
      continue;
    }
    saveCommand(
      {
        name,
        command: entry.command,
        directory: entry.directory,
        pathMode: entry.pathMode,
        env: entry.env,
        description: entry.description,
        tags: entry.tags,
        steps: entry.steps,
      },
      { undo: false }
    );
    result.imported++;
  }
  return result;
}
