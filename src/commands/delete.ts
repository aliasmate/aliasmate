import chalk from 'chalk';
import { deleteAlias, getAlias } from '../storage';
import { handleError, exitWithError, ExitCode } from '../utils/errors';
import { SUCCESS_MESSAGES, ERROR_MESSAGES, HELP_MESSAGES } from '../utils/constants';

/**
 * Delete a saved command by name
 *
 * @param name - The name of the command to delete
 *
 * @example
 * ```
 * // Delete a command
 * deleteCommand('old-build');
 * // Output: ✓ Deleted command "old-build"
 * ```
 */
export function deleteCommand(name: string): void {
  try {
    // Validate command name
    if (!name || !name.trim()) {
      exitWithError('Command name cannot be empty', ExitCode.InvalidInput);
    }

    // Check if alias exists
    const alias = getAlias(name);
    if (!alias) {
      console.error(chalk.red(`Error: ${ERROR_MESSAGES.commandNotFound(name)}`));
      console.log(chalk.yellow(HELP_MESSAGES.useList));
      process.exit(ExitCode.InvalidInput);
    }

    // Show what will be deleted
    console.log(chalk.yellow(`About to delete:`));
    console.log(chalk.gray(`  Name: ${name}`));
    console.log(chalk.gray(`  Command: ${alias.command}`));
    console.log(chalk.gray(`  Directory: ${alias.directory}\n`));

    // Delete the alias
    const success = deleteAlias(name);

    if (success) {
      console.log(chalk.green(`✓ ${SUCCESS_MESSAGES.deleted(name)}`));
    } else {
      exitWithError(ERROR_MESSAGES.couldNotDelete);
    }
  } catch (error) {
    handleError(error, 'Failed to delete command');
  }
}
