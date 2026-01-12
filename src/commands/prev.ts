import chalk from 'chalk';
import { getLastCommand, getHistoryConfigInstructions } from '../utils/history';
import { setAlias } from '../storage';
import { handleError, exitWithError, ExitCode } from '../utils/errors';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../utils/constants';

/**
 * Save the previous command from shell history
 *
 * @param name - The name to save the command under
 * @param cwd - The working directory to save with the command (defaults to process.cwd())
 *
 * @example
 * ```
 * // After running: npm run build --production
 * // Execute: aliasmate prev build-prod
 * // The npm command is saved and can be re-run from anywhere
 * ```
 */
export function prevCommand(name: string, cwd: string = process.cwd()): void {
  try {
    // Get the last command from history
    const lastCommand = getLastCommand();

    if (!lastCommand) {
      console.error(chalk.red(`Error: ${ERROR_MESSAGES.historyNotAvailable}`));
      console.log(chalk.yellow('\nTroubleshooting:'));
      console.log(chalk.gray('1. Make sure your shell history is enabled'));
      console.log(chalk.gray('2. For real-time history capture, configure your shell:'));
      console.log(chalk.gray(`   ${getHistoryConfigInstructions()}`));
      console.log(chalk.gray('3. Or use "aliasmate save" to manually enter the command'));
      process.exit(ExitCode.GeneralError);
    }

    // Validate command name
    if (!name || !name.trim()) {
      exitWithError('Command name cannot be empty', ExitCode.InvalidInput);
    }
    if (name.includes(' ')) {
      exitWithError('Command name cannot contain spaces', ExitCode.InvalidInput);
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      exitWithError(
        'Command name can only contain letters, numbers, hyphens, and underscores',
        ExitCode.InvalidInput
      );
    }

    // Save the command with the current directory (default to 'saved' path mode for prev command)
    try {
      const success = setAlias(name, lastCommand, cwd, 'saved');

      if (success) {
        console.log(chalk.green(`✓ ${SUCCESS_MESSAGES.saved(name)}`));
        console.log(chalk.gray(`  Command: ${lastCommand}`));
        console.log(chalk.gray(`  Directory: ${cwd}`));
        console.log(chalk.gray(`  Path Mode: saved (use 'aliasmate edit ${name}' to change)`));
      } else {
        exitWithError(ERROR_MESSAGES.couldNotSave);
      }
    } catch (error) {
      exitWithError(`${ERROR_MESSAGES.couldNotSave}: ${(error as Error).message}`);
    }
  } catch (error) {
    handleError(error, 'Failed to save command from history');
  }
}
