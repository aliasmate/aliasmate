import { saveCommand, validateCommandName } from '../core/commands';
import { getLastCommand, getHistoryConfigHint } from '../core/history';
import { ok, fail, theme } from '../ui/theme';

function requireTty(): boolean {
  if (process.stdin.isTTY && process.stdout.isTTY) return true;
  fail('This command needs an interactive terminal.');
  process.exitCode = 1;
  return false;
}

/** `aliasmate save` — opens the TUI with a blank new-command form. */
export async function saveHandler(): Promise<void> {
  if (!requireTty()) return;
  const { interactiveHome } = await import('../ui/interactive');
  await interactiveHome({});
}

/**
 * `aliasmate prev [name]` — captures your last shell command and opens the
 * TUI form prefilled with it. In scripts (no TTY) it saves directly.
 */
export async function prevHandler(name: string | undefined): Promise<void> {
  if (name) {
    const nameCheck = validateCommandName(name);
    if (nameCheck !== true) {
      fail(nameCheck);
      process.exitCode = 1;
      return;
    }
  }

  const lastCommand = getLastCommand();
  if (!lastCommand) {
    fail('Could not read the previous command from shell history.');
    console.log(theme.dim(`\n${getHistoryConfigHint()}`));
    console.log(theme.dim('Or create one manually with: aliasmate save'));
    process.exitCode = 1;
    return;
  }

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    // Non-interactive: save directly with sensible defaults.
    if (!name) {
      fail('A name is required when running non-interactively: aliasmate prev <name>');
      process.exitCode = 1;
      return;
    }
    saveCommand({ name, command: lastCommand, directory: process.cwd() });
    ok(`saved ${theme.name(name)} ${theme.dim(`· ${lastCommand}`)}`);
    return;
  }

  const { interactiveHome } = await import('../ui/interactive');
  await interactiveHome({ name, command: lastCommand, directory: process.cwd() });
}
