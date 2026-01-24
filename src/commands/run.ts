import chalk from 'chalk';
import { getAlias } from '../storage';
import { executeCommand } from '../utils/executor';
import { resolvePath } from '../utils/paths';
import { handleError, ExitCode } from '../utils/errors';
import { ERROR_MESSAGES, HELP_MESSAGES } from '../utils/constants';
import { mergeEnvVars, getEnvOverrides, maskSensitiveEnvVars } from '../utils/env';
import { resolveAlias, isAlias } from './alias';
import { recordExecution, getRecentCommandByIndex } from '../utils/recent';

/**
 * Run a saved command, optionally overriding its working directory
 *
 * @param name - The name of the saved command to run
 * @param overridePath - Optional path to override the saved working directory
 * @param dryRun - If true, preview what will execute without running
 * @param verbose - If true, show detailed information (used with dryRun)
 *
 * @example
 * ```
 * // Run command in its saved directory
 * await runCommand('build-prod');
 *
 * // Run command in a different directory
 * await runCommand('build-prod', '/path/to/other/project');
 *
 * // Preview command without executing
 * await runCommand('build-prod', undefined, true);
 * ```
 */
export async function runCommand(
  name: string,
  overridePath?: string,
  dryRun?: boolean,
  verbose?: boolean
): Promise<void> {
  try {
    // Handle @N syntax for recent commands
    let actualName = name;
    let wasRecentRef = false;

    if (name.startsWith('@')) {
      const indexStr = name.substring(1);
      const index = parseInt(indexStr, 10);

      if (isNaN(index) || index < 0) {
        console.error(chalk.red(`Error: Invalid recent command reference "${name}"`));
        console.log(chalk.yellow('Use "aliasmate recent" to see available commands'));
        process.exit(ExitCode.InvalidInput);
      }

      const recentCommand = getRecentCommandByIndex(index);
      if (!recentCommand) {
        console.error(chalk.red(`Error: No command found at index @${index}`));
        console.log(chalk.yellow('Use "aliasmate recent" to see available commands'));
        process.exit(ExitCode.InvalidInput);
      }

      actualName = recentCommand;
      wasRecentRef = true;
    }

    // Resolve alias to actual command name
    const resolvedName = resolveAlias(actualName);
    const wasAlias = isAlias(actualName);

    // Get the saved alias
    const alias = getAlias(resolvedName);

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

    // Determine path mode for display
    const pathMode = alias.pathMode || 'saved';

    // Handle environment variables
    let envToUse: NodeJS.ProcessEnv = process.env;
    const envOverrides =
      alias.env && Object.keys(alias.env).length > 0 ? getEnvOverrides(alias.env, process.env) : [];

    if (alias.env && Object.keys(alias.env).length > 0) {
      envToUse = mergeEnvVars(alias.env, process.env);
    }

    // Check for potentially dangerous commands
    const dangerousPatterns = [
      'rm -rf',
      'dd if=',
      'mkfs',
      'format',
      ':(){ :|:& };:',
      'chmod -R 777',
    ];
    const isDangerous = dangerousPatterns.some((pattern) => alias.command.includes(pattern));

    // DRY RUN MODE
    if (dryRun) {
      console.log(chalk.cyan.bold('🔍 DRY RUN MODE - Command will NOT be executed\n'));

      // Show command
      console.log(chalk.blue.bold('Command:'));
      if (isDangerous) {
        console.log(chalk.red.bold(`  ⚠️  ${alias.command}`));
        console.log(chalk.yellow.bold('  WARNING: This command may be dangerous!'));
      } else {
        console.log(chalk.white(`  ${alias.command}`));
      }
      console.log();

      // Show working directory
      console.log(chalk.blue.bold('Working Directory:'));
      console.log(chalk.white(`  ${runDir}`));
      console.log();

      // Show path mode
      console.log(chalk.blue.bold('Path Mode:'));
      if (overridePath) {
        console.log(chalk.white(`  overridden (original: ${pathMode})`));
      } else {
        console.log(chalk.white(`  ${pathMode}`));
      }
      console.log();

      // Show environment variables
      if (alias.env && Object.keys(alias.env).length > 0) {
        console.log(chalk.blue.bold('Environment Variables:'));
        console.log(chalk.white(`  ${Object.keys(alias.env).length} variable(s) will be loaded`));

        if (verbose) {
          const masked = maskSensitiveEnvVars(alias.env);
          Object.entries(masked).forEach(([key, value]) => {
            console.log(chalk.gray(`    ${key}=${value}`));
          });
        } else {
          console.log(chalk.gray('    (use --verbose to see variable names)'));
        }

        if (envOverrides.length > 0) {
          console.log(
            chalk.yellow(
              `\n  ⚠️  ${envOverrides.length} saved variable(s) will be overridden by current environment:`
            )
          );
          envOverrides.forEach(({ name }) => {
            console.log(chalk.yellow(`    - ${name}`));
          });
        }
        console.log();
      }

      // Verbose mode: show additional details
      if (verbose) {
        console.log(chalk.blue.bold('Additional Details:'));
        console.log(chalk.gray(`  Command name: ${name}`));
        console.log(chalk.gray(`  Current directory: ${process.cwd()}`));
        if (alias.env && Object.keys(alias.env).length > 0) {
          console.log(chalk.gray(`  Environment merge: saved → current → merged`));
        }
        console.log();
      }

      console.log(chalk.cyan('✓ Dry run completed - no command was executed'));
      console.log(chalk.gray('  To execute this command, run without --dry-run flag'));
      return;
    }

    // NORMAL EXECUTION MODE
    if (wasRecentRef) {
      console.log(chalk.gray(`Using recent command @${name.substring(1)} → "${actualName}"`));
    }
    if (wasAlias) {
      console.log(chalk.gray(`Using alias: "${actualName}" → "${resolvedName}"`));
    }
    console.log(chalk.blue(`Running: ${alias.command}`));
    console.log(chalk.gray(`Directory: ${runDir}`));
    if (overridePath) {
      console.log(chalk.gray(`Path Mode: overridden`));
    } else {
      console.log(chalk.gray(`Path Mode: ${pathMode}`));
    }

    if (alias.env && Object.keys(alias.env).length > 0) {
      console.log(chalk.gray(`Environment Variables: ${Object.keys(alias.env).length} loaded`));

      // Show any overrides
      if (envOverrides.length > 0) {
        console.log(
          chalk.yellow(
            `\n⚠️  ${envOverrides.length} saved env variable(s) overridden by current environment:`
          )
        );
        envOverrides.forEach(({ name }) => {
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

    // Record execution in history (only on successful start, not dry-run)
    recordExecution(resolvedName);

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
