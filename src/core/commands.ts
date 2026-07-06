import * as path from 'path';
import { configFile, getMetadata, setMetadata } from './store';
import { pushUndo } from './undo';
import { CommandMap, AliasMap, PathMode, SavedCommand } from './types';

const ALIASES_KEY = 'command_aliases';

/** Command names that would shadow CLI subcommands. */
export const RESERVED_NAMES = new Set([
  'run',
  'save',
  'prev',
  'list',
  'ls',
  'search',
  'find',
  'edit',
  'rename',
  'mv',
  'delete',
  'rm',
  'export',
  'import',
  'alias',
  'recent',
  'validate',
  'completion',
  'changelog',
  'changes',
  'config',
  'stats',
  'copy',
  'undo',
  'chain',
  'tag',
  'init',
  'project',
  'sync',
  'help',
]);

/** Naming rules shared by every save surface (CLI args, prompts, TUI form). */
export function validateCommandName(value: string): true | string {
  const name = value.trim();
  if (!name) return 'Name cannot be empty';
  if (/\s/.test(name)) return 'Name cannot contain spaces — try dashes: build-prod';
  if (!/^[\w.:-]+$/.test(name)) return 'Only letters, digits, and - _ . : are allowed';
  if (name.startsWith('@')) return 'Names starting with @ are reserved for recent commands';
  if (RESERVED_NAMES.has(name)) return `"${name}" is a reserved word — pick another name`;
  return true;
}

export function listCommands(): CommandMap {
  return configFile.read() as CommandMap;
}

export function getCommand(name: string): SavedCommand | undefined {
  return listCommands()[name];
}

export function commandExists(name: string): boolean {
  return name in listCommands();
}

export interface SaveInput {
  name: string;
  command: string;
  directory: string;
  pathMode?: PathMode;
  env?: Record<string, string>;
  description?: string;
  tags?: string[];
  steps?: string[];
}

export function saveCommand(input: SaveInput, options: { undo?: boolean } = {}): SavedCommand {
  const name = input.name.trim();
  const command = input.command.trim();
  if (!name) throw new Error('Command name cannot be empty');
  if (!/^[\w@.:-]+$/.test(name)) {
    throw new Error('Command name may only contain letters, digits, and - _ . : @');
  }
  if (name.startsWith('@'))
    throw new Error('Names starting with @ are reserved for recent commands');
  if (!command) throw new Error('Command cannot be empty');
  if (!input.directory.trim()) throw new Error('Directory cannot be empty');

  const commands = listCommands();
  const now = new Date().toISOString();
  const entry: SavedCommand = {
    command,
    directory: path.resolve(input.directory),
    pathMode: input.pathMode ?? 'saved',
    ...(input.env && Object.keys(input.env).length > 0 ? { env: input.env } : {}),
    ...(input.description?.trim() ? { description: input.description.trim() } : {}),
    ...(input.tags && input.tags.length > 0 ? { tags: input.tags } : {}),
    ...(input.steps && input.steps.length > 0 ? { steps: input.steps } : {}),
    createdAt: commands[name]?.createdAt ?? now,
    updatedAt: now,
  };
  if (options.undo !== false) pushUndo(commands[name] ? `edit ${name}` : `create ${name}`);
  configFile.update((data) => {
    data[name] = entry;
  });
  return entry;
}

export function deleteCommand(name: string): boolean {
  if (!commandExists(name)) return false;
  pushUndo(`delete ${name}`);
  configFile.update((data) => {
    delete data[name];
  });
  // Drop shortcut aliases that pointed at the deleted command.
  const aliases = listAliases();
  const orphaned = Object.keys(aliases).filter((a) => aliases[a] === name);
  if (orphaned.length > 0) {
    for (const a of orphaned) delete aliases[a];
    setMetadata(ALIASES_KEY, aliases);
  }
  return true;
}

export function renameCommand(from: string, to: string): void {
  const commands = listCommands();
  const existing = commands[from];
  if (!existing) throw new Error(`Command "${from}" not found`);
  const nameCheck = validateCommandName(to);
  if (nameCheck !== true) throw new Error(nameCheck);
  if (commandExists(to)) throw new Error(`Command "${to}" already exists`);

  pushUndo(`rename ${from} → ${to}`);
  configFile.update((data) => {
    data[to] = { ...existing, updatedAt: new Date().toISOString() };
    delete data[from];
  });

  // Shortcut aliases and run history follow the command to its new name.
  const aliases = listAliases();
  let aliasesChanged = false;
  for (const a of Object.keys(aliases)) {
    if (aliases[a] === from) {
      aliases[a] = to;
      aliasesChanged = true;
    }
  }
  if (aliasesChanged) setMetadata(ALIASES_KEY, aliases);

  const history =
    getMetadata<Array<{ commandName: string; executedAt: string }>>('execution_history');
  if (history?.some((e) => e.commandName === from)) {
    setMetadata(
      'execution_history',
      history.map((e) => (e.commandName === from ? { ...e, commandName: to } : e))
    );
  }
}

/** Case-insensitive search across name, command text, and directory. */
export function searchCommands(query: string): CommandMap {
  const q = query.toLowerCase();
  const result: CommandMap = {};
  for (const [name, cmd] of Object.entries(listCommands())) {
    if (
      name.toLowerCase().includes(q) ||
      cmd.command.toLowerCase().includes(q) ||
      cmd.directory.toLowerCase().includes(q) ||
      (cmd.description ?? '').toLowerCase().includes(q) ||
      (cmd.tags ?? []).some((t) => t.toLowerCase().includes(q))
    ) {
      result[name] = cmd;
    }
  }
  return result;
}

// --- Shortcut aliases -------------------------------------------------------

export function listAliases(): AliasMap {
  return { ...(getMetadata<AliasMap>(ALIASES_KEY) ?? {}) };
}

export function setShortcutAlias(alias: string, commandName: string): void {
  const a = alias.trim();
  if (!a) throw new Error('Alias cannot be empty');
  if (RESERVED_NAMES.has(a)) throw new Error(`"${a}" is a reserved name`);
  if (commandExists(a)) throw new Error(`"${a}" is already a saved command name`);
  if (!commandExists(commandName)) throw new Error(`Command "${commandName}" not found`);
  const aliases = listAliases();
  aliases[a] = commandName;
  setMetadata(ALIASES_KEY, aliases);
}

export function removeShortcutAlias(alias: string): boolean {
  const aliases = listAliases();
  if (!(alias in aliases)) return false;
  delete aliases[alias];
  setMetadata(ALIASES_KEY, aliases);
  return true;
}

/**
 * Resolve a user-supplied name to a saved command name.
 * Handles direct names, shortcut aliases, and @N recent-history references.
 */
export function resolveName(input: string, recent: string[] = []): string | undefined {
  if (input.startsWith('@')) {
    const index = Number(input.slice(1));
    if (!Number.isInteger(index) || index < 0) return undefined;
    return recent[index];
  }
  if (commandExists(input)) return input;
  const target = listAliases()[input];
  return target && commandExists(target) ? target : undefined;
}
