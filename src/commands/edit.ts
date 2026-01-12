import chalk from 'chalk';
import { getAlias, setAlias, PathMode } from '../storage';
import { handleError, isInquirerTTYError, exitWithError, ExitCode } from '../utils/errors';
import { SUCCESS_MESSAGES, ERROR_MESSAGES, HELP_MESSAGES } from '../utils/constants';
import { promptMultiple, TextInputPrompt, ListPrompt } from '../utils/prompts';

/**
 * Edit an existing command interactively
 *
 * @param name - The name of the command to edit
 *
 * @example
 * ```
 * // User is prompted to update:
 * // - Command (pre-filled with current value)
 * // - Working directory (pre-filled with current value)
 * await editCommand('build-prod');
 * ```
 */
export async function editCommand(name: string): Promise<void> {
  try {
    // Get the existing alias
    const alias = getAlias(name);

    if (!alias) {
      console.error(chalk.red(`Error: ${ERROR_MESSAGES.commandNotFound(name)}`));
      console.log(chalk.yellow(HELP_MESSAGES.useList));
      process.exit(ExitCode.InvalidInput);
    }

    console.log(chalk.blue(`Editing command: ${name}\n`));

    // Prompt for new values including path mode
    const prompts: (TextInputPrompt | ListPrompt)[] = [
      {
        type: 'input',
        name: 'command',
        message: 'Command:',
        default: alias.command,
        validate: (input: string) => {
          const trimmed = input.trim();
          if (!trimmed) {
            return HELP_MESSAGES.emptyValue('Command');
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'directory',
        message: 'Working directory:',
        default: alias.directory,
        validate: (input: string) => {
          const trimmed = input.trim();
          if (!trimmed) {
            return HELP_MESSAGES.emptyValue('Directory');
          }
          return true;
        },
      },
      {
        type: 'list',
        name: 'pathMode',
        message: 'Path mode:',
        choices: [
          {
            name: 'Saved Directory (always run in the directory above)',
            value: 'saved',
          },
          {
            name: 'Current Directory (run in your current working directory)',
            value: 'current',
          },
        ],
      },
    ];

    const answers = await promptMultiple<{ 
      command: string; 
      directory: string;
      pathMode: PathMode;
    }>(prompts);

    // Check if anything changed
    const currentPathMode = alias.pathMode || 'saved'; // Default to 'saved' for backward compatibility
    if (
      answers.command === alias.command && 
      answers.directory === alias.directory &&
      answers.pathMode === currentPathMode
    ) {
      console.log(chalk.yellow('No changes made'));
      return;
    }

    // Update the alias with path mode
    try {
      const success = setAlias(name, answers.command, answers.directory, answers.pathMode);

      if (success) {
        console.log(chalk.green(`✓ ${SUCCESS_MESSAGES.updated(name)}`));
        console.log(chalk.gray(`  Command: ${answers.command}`));
        console.log(chalk.gray(`  Directory: ${answers.directory}`));
        console.log(chalk.gray(`  Path Mode: ${answers.pathMode}`));
      } else {
        exitWithError(ERROR_MESSAGES.couldNotUpdate);
      }
    } catch (error) {
      exitWithError(`${ERROR_MESSAGES.couldNotUpdate}: ${(error as Error).message}`);
    }
  } catch (error) {
    if (isInquirerTTYError(error)) {
      exitWithError(ERROR_MESSAGES.interactiveNotSupported, ExitCode.GeneralError);
    } else {
      handleError(error, 'Failed to edit command');
    }
  }
}
