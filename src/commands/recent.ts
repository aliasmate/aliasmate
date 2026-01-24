import chalk from 'chalk';
import { getAlias } from '../storage';
import {
  getRecentCommandsWithTimestamps,
  clearExecutionHistory,
  getRecentConfig,
} from '../utils/recent';
import { handleError } from '../utils/errors';

/**
 * Display recently executed commands
 *
 * @param options - Options for the recent command
 * @param options.limit - Maximum number of commands to display
 * @param options.clear - Clear the execution history
 *
 * @example
 * ```
 * // Show recent commands
 * recentCommand({});
 *
 * // Show last 10 commands
 * recentCommand({ limit: 10 });
 *
 * // Clear history
 * recentCommand({ clear: true });
 * ```
 */
export function recentCommand(options: { limit?: number; clear?: boolean }): void {
  try {
    // Handle clear operation
    if (options.clear) {
      const success = clearExecutionHistory();
      if (success) {
        console.log(chalk.green('✓ Execution history cleared'));
      } else {
        console.error(chalk.red('✗ Failed to clear execution history'));
        process.exit(1);
      }
      return;
    }

    // Get execution history
    const config = getRecentConfig();
    const limit = options.limit || config.maxSize;
    const history = getRecentCommandsWithTimestamps(limit);

    if (history.length === 0) {
      console.log(chalk.yellow('No recent commands found.'));
      console.log(chalk.gray('Commands will appear here after you run them with "aliasmate run"'));
      return;
    }

    console.log(chalk.bold(`\nRecent commands (${history.length}):\n`));

    // Group by command name and show timestamps
    const groupedByCommand = new Map<string, string[]>();

    for (const entry of history) {
      if (!groupedByCommand.has(entry.commandName)) {
        groupedByCommand.set(entry.commandName, []);
      }
      groupedByCommand.get(entry.commandName)!.push(entry.executedAt);
    }

    // Display with @N syntax reference
    let index = 0;
    const seenCommands = new Set<string>();

    for (const entry of history) {
      if (!seenCommands.has(entry.commandName)) {
        seenCommands.add(entry.commandName);

        const alias = getAlias(entry.commandName);
        const timestamp = new Date(entry.executedAt);
        const timeAgo = getTimeAgo(timestamp);
        const executionCount = groupedByCommand.get(entry.commandName)!.length;

        console.log(chalk.cyan(`  @${index}  ${entry.commandName}`));

        if (alias) {
          console.log(chalk.gray(`      Command: ${truncateCommand(alias.command, 80)}`));
          console.log(chalk.gray(`      Directory: ${alias.directory}`));
        } else {
          console.log(chalk.red(`      [Command no longer exists]`));
        }

        console.log(
          chalk.gray(
            `      Last run: ${timeAgo} (${executionCount} time${executionCount > 1 ? 's' : ''})`
          )
        );
        console.log();

        index++;
      }
    }

    console.log(
      chalk.gray('Tip: Run a recent command with "aliasmate run @N" where N is the index above')
    );
  } catch (error) {
    handleError(error, 'Failed to display recent commands');
  }
}

/**
 * Truncate command for display
 */
function truncateCommand(command: string, maxLength: number): string {
  if (command.length <= maxLength) {
    return command;
  }

  const firstLine = command.split('\n')[0];
  if (firstLine.length <= maxLength) {
    return firstLine + ' [...]';
  }

  return firstLine.substring(0, maxLength) + '...';
}

/**
 * Get human-readable time ago string
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) {
    return 'just now';
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }

  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}
