import * as fs from 'fs';
import * as path from 'path';
import { CommandMap, SavedCommand } from './types';
import { listCommands } from './commands';

export const PROJECT_FILE = '.aliasmate.json';

/** Walk up from cwd looking for a .aliasmate.json. */
export function findProjectFile(from: string = process.cwd()): string | null {
  let dir = path.resolve(from);
  for (;;) {
    const candidate = path.join(dir, PROJECT_FILE);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * Commands defined by the current project. Relative directories resolve
 * against the project root so the file is portable across machines.
 */
export function loadProjectCommands(from: string = process.cwd()): CommandMap {
  const file = findProjectFile(from);
  if (!file) return {};
  const root = path.dirname(file);
  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as CommandMap;
    const result: CommandMap = {};
    for (const [name, entry] of Object.entries(raw)) {
      if (typeof entry?.command !== 'string') continue;
      const directory = entry.directory
        ? path.isAbsolute(entry.directory)
          ? entry.directory
          : path.join(root, entry.directory)
        : root;
      result[name] = {
        pathMode: 'saved',
        ...entry,
        createdAt: entry.createdAt ?? '',
        updatedAt: entry.updatedAt ?? '',
        directory,
      };
    }
    return result;
  } catch {
    return {};
  }
}

export interface EffectiveCommands {
  commands: CommandMap;
  /** Names that came from the project file (they shadow globals). */
  projectNames: Set<string>;
  projectFile: string | null;
}

/** Global commands overlaid with the current project's commands. */
export function listEffectiveCommands(from: string = process.cwd()): EffectiveCommands {
  const projectFile = findProjectFile(from);
  const project = projectFile ? loadProjectCommands(from) : {};
  return {
    commands: { ...listCommands(), ...project },
    projectNames: new Set(Object.keys(project)),
    projectFile,
  };
}

/** Write a command into the project file (created on demand). */
export function saveProjectCommand(
  name: string,
  entry: SavedCommand,
  root: string = process.cwd()
): string {
  const file = findProjectFile(root) ?? path.join(path.resolve(root), PROJECT_FILE);
  const existing = fs.existsSync(file)
    ? (JSON.parse(fs.readFileSync(file, 'utf8')) as CommandMap)
    : {};
  const projectRoot = path.dirname(file);
  const relative = path.relative(projectRoot, entry.directory);
  existing[name] = {
    ...entry,
    // Store project-relative paths so teammates can use the same file.
    directory: relative === '' ? '.' : relative.startsWith('..') ? entry.directory : relative,
  };
  fs.writeFileSync(file, JSON.stringify(existing, null, 2) + '\n', 'utf8');
  return file;
}

export function removeProjectCommand(name: string, root: string = process.cwd()): boolean {
  const file = findProjectFile(root);
  if (!file) return false;
  const existing = JSON.parse(fs.readFileSync(file, 'utf8')) as CommandMap;
  if (!(name in existing)) return false;
  delete existing[name];
  fs.writeFileSync(file, JSON.stringify(existing, null, 2) + '\n', 'utf8');
  return true;
}
