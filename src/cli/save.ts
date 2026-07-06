import { saveCommand, commandExists, RESERVED_NAMES } from '../core/commands';
import { getLastCommand, getHistoryConfigHint } from '../core/history';
import { validateSavedCommand } from '../core/validate';
import { getCommand } from '../core/commands';
import { promptCommandDetails, confirm, CommandDetails } from '../ui/prompts';
import { ok, warn, fail, theme } from '../ui/theme';

async function persist(details: CommandDetails, validate: boolean): Promise<void> {
  if (RESERVED_NAMES.has(details.name)) {
    throw new Error(`"${details.name}" is a reserved name — pick another`);
  }
  if (commandExists(details.name)) {
    const overwrite = await confirm(`"${details.name}" already exists. Overwrite it?`);
    if (!overwrite) {
      console.log(theme.dim('Cancelled.'));
      return;
    }
  }
  saveCommand(details);
  if (validate) {
    const issues = validateSavedCommand(getCommand(details.name)!);
    for (const issue of issues) warn(issue.message);
  }
  ok(`Saved ${theme.name(details.name)}`);
  console.log(theme.dim(`  ${details.command}`));
  console.log(theme.dim(`  in ${details.directory} (${details.pathMode} mode)`));
  console.log(theme.dim(`\n  Run it anytime: aliasmate run ${details.name}`));
}

/** `aliasmate save` — interactive save. */
export async function saveHandler(options: { validate?: boolean }): Promise<void> {
  const details = await promptCommandDetails({}, process.cwd());
  await persist(details, options.validate !== false);
}

/** `aliasmate prev <name>` — save the last command from shell history. */
export async function prevHandler(name: string, options: { validate?: boolean }): Promise<void> {
  const { validateName } = await import('../ui/prompts');
  const nameCheck = validateName(name);
  if (nameCheck !== true) {
    fail(nameCheck);
    process.exitCode = 1;
    return;
  }
  const lastCommand = getLastCommand();
  if (!lastCommand) {
    fail('Could not read the previous command from shell history.');
    console.log(theme.dim(`\n${getHistoryConfigHint()}`));
    console.log(theme.dim('Or save it manually with: aliasmate save'));
    process.exitCode = 1;
    return;
  }

  console.log(`${theme.dim('Captured:')} ${lastCommand}`);
  const details = await promptCommandDetails(
    { name, command: lastCommand, directory: process.cwd() },
    process.cwd()
  );
  await persist(details, options.validate !== false);
}
