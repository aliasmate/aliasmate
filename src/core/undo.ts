import { configFile, getMetadata, setMetadata } from './store';
import { CommandMap } from './types';

const UNDO_KEY = 'undo_stack';
const MAX_UNDO = 10;

interface UndoEntry {
  label: string;
  at: string;
  commands: CommandMap;
}

/** Snapshot the current commands before a destructive mutation. */
export function pushUndo(label: string): void {
  const stack = getMetadata<UndoEntry[]>(UNDO_KEY) ?? [];
  stack.unshift({
    label,
    at: new Date().toISOString(),
    commands: JSON.parse(JSON.stringify(configFile.read())) as CommandMap,
  });
  setMetadata(UNDO_KEY, stack.slice(0, MAX_UNDO));
}

/** Restore the most recent snapshot. Returns its label, or null if empty. */
export function undoLast(): string | null {
  const stack = getMetadata<UndoEntry[]>(UNDO_KEY) ?? [];
  const entry = stack.shift();
  if (!entry) return null;
  configFile.write(entry.commands);
  setMetadata(UNDO_KEY, stack);
  return entry.label;
}

/** Peek at what undo would revert. */
export function peekUndo(): string | null {
  const stack = getMetadata<UndoEntry[]>(UNDO_KEY) ?? [];
  return stack[0]?.label ?? null;
}
