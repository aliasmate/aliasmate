import chalk from 'chalk';
import { getAlias } from '../storage';
import { executeCommand } from '../utils/executor';
import { resolvePath } from '../utils/paths';
import { handleError, ExitCode } from '../utils/errors';
import { ERROR_MESSAGES, HELP_MESSAGES } from '../utils/constants';
import { mergeEnvVars, getEnvOverrides, maskSensitiveEnvVars } from '../utils/env';

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

    // Determine the directory to run in based on path mode and override
    let runDir: string;
    
    if (overridePath) {
      // User explicitly provided a path override
      runDir = resolvePath(overridePath, process.cwd());
    } else {
      // Use path mode to determine directory
      const pathMode = alias.pathMode || 'saved'; // Default to 'saved' for backward compatibility
      
      if (pathMode === 'current') {
        runDir = process.cwd();
      } else {
        runDir = alias.directory;
      }
    }

    // Show what we're about to run
    console.log(chalk.blue(`Running: ${alias.command}`));
    console.log(chalk.gray(`Directory: ${runDir}`));
    const pathMode = alias.pathMode || 'saved';
    if (overridePath) {
      console.log(chalk.gray(`Path Mode: overridden`));
    } else {
      console.log(chalk.gray(`Path Mode: ${pathMode}`));
    }

    // Handle environment variables
    let envToUse: NodeJS.ProcessEnv = process.env;
    if (alias.env && Object.keys(alias.env).length > 0) {
      envToUse = mergeEnvVars(alias.env, process.env);
      console.log(chalk.gray(`Environment Variables: ${Object.keys(alias.env).length} loaded`));
      
      // Show any overrides
      const overrides = getEnvOverrides(alias.env, process.env);
      if (overrides.length > 0) {
        console.log(chalk.yellow(`\n⚠️  ${overrides.length} saved env variable(s) overridden by current environment:`));
        overrides.forEach(({ name }) => {
          console.log(chalk.yellow(`   - ${name}`));
        });
      }
      
      // Show masked env vars for visibility
      const masked = maskSensitiveEnvVars(alias.env);
      console.log(chalk.gray('\nSaved environment variables:'));
      Object.entries(masked).forEach(([key, value]) => {
        console.log(chalk.gray(`   ${key}=${value}`));
      });
    }
    console.log();

    // Execute the command with merged environment
    const result = await executeCommand(alias.command, runDir, envToUse);

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
