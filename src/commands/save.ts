import inquirer from 'inquirer';
import chalk from 'chalk';
import { setAlias, aliasExists } from '../storage';
import { handleError, isInquirerTTYError, exitWithError, ExitCode } from '../utils/errors';
import { SUCCESS_MESSAGES, ERROR_MESSAGES, HELP_MESSAGES } from '../utils/constants';

/**
 * Interactively save a new command with prompts
 *
 * @param cwd - The default working directory to suggest (defaults to process.cwd())
 *
 * @example
 * ```
 * // User is prompted for:
 * // - Command name (e.g., 'deploy-prod')
 * // - Command to save (e.g., 'npm run deploy')
 * // - Working directory (defaults to current directory)
 * await saveCommand();
 * ```
 */
export async function saveCommand(cwd: string = process.cwd()): Promise<void> {
  try {
    // Prompt for command details
    const answers: { name: string; command: string; directory: string } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Enter a name for this command:',
        validate: (input: string) => {
          const trimmed = input.trim();
          if (!trimmed) {
            return HELP_MESSAGES.emptyValue('Name');
          }
          if (trimmed.includes(' ')) {
            return HELP_MESSAGES.invalidName;
          }
          // Check for invalid characters
          if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
            return 'Name can only contain letters, numbers, hyphens, and underscores';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'command',
        message: 'Enter the command to save:',
        validate: (input: string) => {
          if (!input.trim()) {
            return HELP_MESSAGES.emptyValue('Command');
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'directory',
        message: 'Enter the working directory:',
        default: cwd,
        validate: (input: string) => {
          const trimmed = input.trim();
          if (!trimmed) {
            return HELP_MESSAGES.emptyValue('Directory');
          }
          return true;
        },
      },
    ]);

    // Check if alias already exists
    if (aliasExists(answers.name)) {
      const { confirm }: { confirm: boolean } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `A command named "${answers.name}" already exists. Overwrite?`,
          default: false,
        },
      ]);

      if (!confirm) {
        console.log(chalk.yellow('Save cancelled'));
        return;
      }
    }

    // Save the command
    try {
      const success = setAlias(answers.name.trim(), answers.command, answers.directory);

      if (success) {
        console.log(chalk.green(`✓ ${SUCCESS_MESSAGES.saved(answers.name.trim())}`));
        console.log(chalk.gray(`  Command: ${answers.command}`));
        console.log(chalk.gray(`  Directory: ${answers.directory}`));
      } else {
        exitWithError(ERROR_MESSAGES.couldNotSave);
      }
    } catch (error) {
      exitWithError(`${ERROR_MESSAGES.couldNotSave}: ${(error as Error).message}`);
    }
  } catch (error) {
    if (isInquirerTTYError(error)) {
      exitWithError(ERROR_MESSAGES.interactiveNotSupported, ExitCode.GeneralError);
    } else {
      handleError(error, 'Failed to save command');
    }
  }
}
