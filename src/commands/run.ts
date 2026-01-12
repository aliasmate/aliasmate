import chalk from 'chalk';
import { getAlias } from '../storage';
import { executeCommand } from '../utils/executor';
import { resolvePath } from '../utils/paths';
import { handleError, ExitCode } from '../utils/errors';
import { ERROR_MESSAGES, HELP_MESSAGES } from '../utils/constants';

/**
 * Run a saved command, optionally overriding its working directory
 *
 * @param name - The name of the saved command to run
 * @param overridePath - Optional path to override the saved working directory
 *
 * @example
 * ```
 * // Run command in its saved directory
 * await runCommand('build-prod');
 *
 * // Run command in a different directory
 * await runCommand('build-prod', '/path/to/other/project');
 * ```
 */
export async function runCommand(name: string, overridePath?: string): Promise<void> {
  try {
    // Get the saved alias
    const alias = getAlias(name);

    if (!alias) {
      console.error(chalk.red(`Error: ${ERROR_MESSAGES.commandNotFound(name)}`));
      console.log(chalk.yellow(HELP_MESSAGES.useList));
      process.exit(ExitCode.InvalidInput);
    }

    // Determine the directory to run in
    const runDir = overridePath ? resolvePath(overridePath, process.cwd()) : alias.directory;

    // Show what we're about to run
    console.log(chalk.blue(`Running: ${alias.command}`));
    console.log(chalk.gray(`Directory: ${runDir}`));
    console.log();

    // Execute the command
    const result = await executeCommand(alias.command, runDir);

    if (!result.success) {
      console.error(chalk.red('\n✗ Command failed'));
      if (result.exitCode !== undefined) {
        console.error(chalk.red(`Exit code: ${result.exitCode}`));
      }
      if (result.stderr) {
        console.error(result.stderr);
      }
      process.exit(result.exitCode || ExitCode.GeneralError);
    } else {
      console.log(chalk.green('\n✓ Command completed successfully'));
    }
  } catch (error) {
    handleError(error, 'Failed to run command');
  }
}
