import chalk from 'chalk';
import { setAlias, aliasExists, PathMode } from '../storage';
import { handleError, isInquirerTTYError, exitWithError, ExitCode } from '../utils/errors';
import { SUCCESS_MESSAGES, ERROR_MESSAGES, HELP_MESSAGES } from '../utils/constants';
import { 
  promptMultiple, 
  promptConfirm, 
  TextInputPrompt, 
  ConfirmPrompt, 
  ListPrompt 
} from '../utils/prompts';

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
    // Prompt for command details including path mode
    const prompts: (TextInputPrompt | ListPrompt)[] = [
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
      {
        type: 'list',
        name: 'pathMode',
        message: 'Choose path mode:',
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
      name: string; 
      command: string; 
      directory: string;
      pathMode: PathMode;
    }>(prompts);

    // Check if alias already exists
    if (aliasExists(answers.name)) {
      const confirmPrompt: ConfirmPrompt = {
        type: 'confirm',
        name: 'confirm',
        message: `A command named "${answers.name}" already exists. Overwrite?`,
        default: false,
      };

      const confirm = await promptConfirm(confirmPrompt);

      if (!confirm) {
        console.log(chalk.yellow('Save cancelled'));
        return;
      }
    }

    // Save the command with path mode
    try {
      const success = setAlias(
        answers.name.trim(), 
        answers.command, 
        answers.directory,
        answers.pathMode
      );

      if (success) {
        console.log(chalk.green(`✓ ${SUCCESS_MESSAGES.saved(answers.name.trim())}`));
        console.log(chalk.gray(`  Command: ${answers.command}`));
        console.log(chalk.gray(`  Directory: ${answers.directory}`));
        console.log(chalk.gray(`  Path Mode: ${answers.pathMode}`));
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
