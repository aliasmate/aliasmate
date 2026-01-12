import chalk from 'chalk';
import * as fs from 'fs';
import { loadAliases } from '../storage';
import { handleError } from '../utils/errors';
import { HELP_MESSAGES } from '../utils/constants';

/**
 * List all saved commands with their details
 *
 * Displays commands alphabetically with their command text and working directory.
 * If no commands are saved, provides guidance on how to save commands.
 *
 * @example
 * ```
 * // Output:
 * // Saved commands (3):
 * //
 * //   build-prod
 * //     Command: npm run build --production
 * //     Directory: /home/user/project
 * //
 * //   deploy
 * //     Command: ./deploy.sh
 * //     Directory: /home/user/scripts
 * ```
 */
export function listCommand(): void {
  try {
    const aliases = loadAliases();
    const names = Object.keys(aliases);

    if (names.length === 0) {
      console.log(chalk.yellow(HELP_MESSAGES.noCommands));
      console.log(chalk.gray(HELP_MESSAGES.useSaveOrPrev));
      return;
    }

    console.log(chalk.bold(`\nSaved commands (${names.length}):\n`));

    // Sort alphabetically
    names.sort();

    for (const name of names) {
      const alias = aliases[name];
      // Check if directory still exists
      const dirExists = fs.existsSync(alias.directory);
      const dirIndicator = dirExists ? '' : chalk.red(' [DIR NOT FOUND]');

      console.log(chalk.cyan(`  ${name}${dirIndicator}`));
      console.log(chalk.gray(`    Command: ${alias.command}`));
      console.log(chalk.gray(`    Directory: ${alias.directory}`));
      if (alias.createdAt) {
        console.log(chalk.gray(`    Created: ${new Date(alias.createdAt).toLocaleString()}`));
      }
      console.log();
    }
  } catch (error) {
    handleError(error, 'Failed to list commands');
  }
}
