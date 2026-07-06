import {
  getCommand,
  saveCommand,
  commandExists,
  resolveName,
  validateCommandName,
} from '../core/commands';
import { copyToClipboard } from '../core/clipboard';
import { undoLast } from '../core/undo';
import { getRecentNames } from '../core/recent';
import { ok, fail, theme } from '../ui/theme';

export function copyHandler(nameInput: string): void {
  const name = resolveName(nameInput, getRecentNames());
  const cmd = name ? getCommand(name) : undefined;
  if (!name || !cmd) {
    fail(`Command "${nameInput}" not found`);
    process.exitCode = 1;
    return;
  }
  if (copyToClipboard(cmd.command)) {
    ok(`copied ${theme.name(name)} ${theme.dim(`· ${cmd.command}`)}`);
  } else {
    // No clipboard tool available — print it so it can still be grabbed.
    console.log(cmd.command);
  }
}

export function undoHandler(): void {
  const label = undoLast();
  if (!label) {
    fail('Nothing to undo');
    process.exitCode = 1;
    return;
  }
  ok(`undid ${theme.name(label)}`);
}

export function chainHandler(name: string, steps: string[]): void {
  const nameCheck = validateCommandName(name);
  if (nameCheck !== true) throw new Error(nameCheck);
  const missing = steps.filter((s) => !commandExists(s));
  if (missing.length > 0) {
    throw new Error(`Unknown command${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`);
  }
  if (steps.includes(name)) throw new Error('A chain cannot include itself');
  saveCommand({
    name,
    command: `chain: ${steps.join(' → ')}`,
    directory: process.cwd(),
    pathMode: 'current',
    steps,
  });
  ok(`saved chain ${theme.name(name)} ${theme.dim(`· ${steps.join(' → ')}`)}`);
}

export function tagHandler(name: string, tags: string[]): void {
  const cmd = getCommand(name);
  if (!cmd) {
    fail(`Command "${name}" not found`);
    process.exitCode = 1;
    return;
  }
  if (tags.length === 0) {
    console.log(
      cmd.tags?.length ? cmd.tags.map((t) => theme.accent(`#${t}`)).join(' ') : theme.dim('no tags')
    );
    return;
  }
  const cleared = tags.length === 1 && tags[0] === '-';
  saveCommand({ name, ...cmd, tags: cleared ? [] : tags });
  ok(
    cleared
      ? `cleared tags on ${theme.name(name)}`
      : `tagged ${theme.name(name)} ${tags.map((t) => theme.accent(`#${t}`)).join(' ')}`
  );
}
