/**
 * Command to display changelog information
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { APP_VERSION } from '../utils/constants';
import {
  displayCumulativeChanges,
  displayVersionChanges,
  getVersionChanges,
} from '../utils/changelog';

/**
 * Create the changelog command
 */
export function createChangelogCommand(): Command {
  const command = new Command('changelog');

  command
    .alias('changes')
    .description('Display changelog information')
    .option('-f, --from <version>', 'Starting version (e.g., 1.2.0)')
    .option('-t, --to <version>', 'Ending version (defaults to current)')
    .option('--ver <version>', 'Show changes for a specific version')
    .action((options: { ver?: string; from?: string; to?: string }) => {
      try {
        if (options.ver) {
          // Show specific version
          const changes = getVersionChanges(options.ver);
          if (changes) {
            displayVersionChanges(changes);
          } else {
            console.log(chalk.yellow(`\nNo changelog data found for version ${options.ver}`));
            console.log(chalk.gray('Check CHANGELOG.md for complete history\n'));
          }
        } else if (options.from) {
          // Show cumulative changes
          const toVersion = options.to || APP_VERSION;
          displayCumulativeChanges(options.from, toVersion);
        } else {
          // Show current version changes
          const changes = getVersionChanges(APP_VERSION);
          if (changes) {
            console.log(chalk.bold.cyan('\n📋 Current Version Changes\n'));
            displayVersionChanges(changes);
          } else {
            console.log(
              chalk.yellow(`\nNo changelog data found for current version (${APP_VERSION})`)
            );
            console.log(chalk.gray('Check CHANGELOG.md for complete history\n'));
          }

          // Show usage examples
          console.log(chalk.bold.yellow('\n💡 Usage Examples:\n'));
          console.log(chalk.gray('  View changes for a specific version:'));
          console.log(chalk.cyan('    $ aliasmate changelog --ver 1.3.0\n'));
          console.log(chalk.gray('  View cumulative changes between versions:'));
          console.log(chalk.cyan('    $ aliasmate changelog --from 1.2.0 --to 1.4.0\n'));
          console.log(chalk.gray('  View all changes from a version to current:'));
          console.log(chalk.cyan('    $ aliasmate changelog --from 1.2.0\n'));
        }
      } catch (error) {
        console.error(chalk.red('\n❌ Error displaying changelog:'), error);
        console.log(chalk.gray('Check CHANGELOG.md for complete history\n'));
        process.exit(1);
      }
    });

  return command;
}
