import chalk from 'chalk';
import { loadAliases } from '../storage';
import { handleError } from '../utils/errors';
import { HELP_MESSAGES } from '../utils/constants';
import { formatAliases, OutputFormat } from '../utils/formatters';

/**
 * List all saved commands with their details
 *
 * Displays commands alphabetically with their command text and working directory.
 * If no commands are saved, provides guidance on how to save commands.
 *
 * @param format - Output format: 'table' (default), 'json', 'yaml', or 'compact'
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
export function listCommand(format: OutputFormat = 'table'): void {
  try {
    const aliases = loadAliases();
    const names = Object.keys(aliases);

    if (names.length === 0) {
      if (format === 'json') {
        console.log('{}');
      } else if (format === 'yaml') {
        console.log('');
      } else {
        console.log(chalk.yellow(HELP_MESSAGES.noCommands));
        console.log(chalk.gray(HELP_MESSAGES.useSaveOrPrev));
      }
      return;
    }

    const output = formatAliases(aliases, format);
    console.log(output);
  } catch (error) {
    handleError(error, 'Failed to list commands');
  }
}
