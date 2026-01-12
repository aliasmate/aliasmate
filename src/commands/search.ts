import chalk from 'chalk';
import * as fs from 'fs';
import { loadAliases } from '../storage';
import { handleError } from '../utils/errors';
import { HELP_MESSAGES } from '../utils/constants';

/**
 * Search for commands by name or command text
 *
 * Performs case-insensitive search across command names and command text.
 *
 * @param query - The search query string
 *
 * @example
 * ```
 * // Search for commands containing 'build'
 * searchCommand('build');
 * // Output:
 * //   build-prod
 * //     Command: npm run build --production
 * //     Directory: /home/user/project
 * ```
 */
export function searchCommand(query: string): void {
  try {
    if (!query || !query.trim()) {
      console.log(chalk.yellow('Please provide a search query'));
      return;
    }

    const aliases = loadAliases();
    const names = Object.keys(aliases);

    if (names.length === 0) {
      console.log(chalk.yellow(HELP_MESSAGES.noCommands));
      console.log(chalk.gray(HELP_MESSAGES.useSaveOrPrev));
      return;
    }

    const searchTerm = query.toLowerCase().trim();
    const results: { name: string; matchType: string }[] = [];

    // Search in command names and command text
    for (const name of names) {
      const alias = aliases[name];
      const nameMatch = name.toLowerCase().includes(searchTerm);
      const commandMatch = alias.command.toLowerCase().includes(searchTerm);
      const dirMatch = alias.directory.toLowerCase().includes(searchTerm);

      if (nameMatch || commandMatch || dirMatch) {
        let matchType = '';
        if (nameMatch) matchType = 'name';
        else if (commandMatch) matchType = 'command';
        else if (dirMatch) matchType = 'directory';

        results.push({ name, matchType });
      }
    }

    if (results.length === 0) {
      console.log(chalk.yellow(`No commands found matching "${query}"`));
      return;
    }

    console.log(chalk.bold(`\nFound ${results.length} command(s) matching "${query}":\n`));

    for (const { name, matchType } of results) {
      const alias = aliases[name];
      const dirExists = fs.existsSync(alias.directory);
      const dirIndicator = dirExists ? '' : chalk.red(' [DIR NOT FOUND]');

      console.log(
        chalk.cyan(`  ${name}${dirIndicator}`) + chalk.gray(` (matched in ${matchType})`)
      );
      console.log(chalk.gray(`    Command: ${alias.command}`));
      console.log(chalk.gray(`    Directory: ${alias.directory}`));
      console.log();
    }
  } catch (error) {
    handleError(error, 'Failed to search commands');
  }
}
