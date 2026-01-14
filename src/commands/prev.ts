import chalk from 'chalk';
import { getLastCommand, getHistoryConfigInstructions } from '../utils/history';
import { setAlias } from '../storage';
import { handleError, exitWithError, ExitCode } from '../utils/errors';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../utils/constants';
import { promptConfirm, promptMultiple, ConfirmPrompt, CheckboxPrompt } from '../utils/prompts';
import { getUserEnvVars, categorizeEnvVars, formatEnvVars } from '../utils/env';

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
export async function prevCommand(name: string, cwd: string = process.cwd()): Promise<void> {
  try {
    // Get the last command from history
    const lastCommand = getLastCommand();

    if (!lastCommand) {
      console.error(chalk.red(`Error: ${ERROR_MESSAGES.historyNotAvailable}`));
      console.log(chalk.yellow('\nWhy this happens:'));
      console.log(chalk.gray('Most shells only write commands to history when the shell exits.'));
      console.log(chalk.gray('This means recent commands may not be available yet.'));
      console.log(chalk.yellow('\nSolution (Recommended):'));
      console.log(chalk.gray('Configure your shell for real-time history writing:'));
      console.log(chalk.cyan(`   ${getHistoryConfigInstructions()}`));
      console.log(chalk.yellow('\nAlternative:'));
      console.log(
        chalk.gray('Use') +
          chalk.cyan(' aliasmate save ') +
          chalk.gray('to manually enter the command')
      );
      console.log(chalk.yellow('\nWhat you can do right now:'));
      console.log(chalk.gray('1. Configure your shell as shown above'));
      console.log(chalk.gray('2. Close and reopen your terminal'));
      console.log(
        chalk.gray('3. Try running your command again, then use') + chalk.cyan(' aliasmate prev')
      );
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

    // Ask if user wants to capture environment variables
    const captureEnvPrompt: ConfirmPrompt = {
      type: 'confirm',
      name: 'captureEnv',
      message: 'Capture current environment variables with this command?',
      default: false,
    };

    const shouldCaptureEnv = await promptConfirm(captureEnvPrompt);
    const selectedEnv: Record<string, string> = {};

    if (shouldCaptureEnv) {
      const userEnv = getUserEnvVars();
      const { sensitive, safe } = categorizeEnvVars(userEnv);

      if (Object.keys(userEnv).length === 0) {
        console.log(chalk.yellow('No user-defined environment variables found.'));
      } else {
        // Show warning if there are sensitive vars
        if (Object.keys(sensitive).length > 0) {
          console.log(
            chalk.yellow(
              '\n⚠️  Warning: Some environment variables appear to contain sensitive data:'
            )
          );
          Object.keys(sensitive).forEach((key) => {
            console.log(chalk.yellow(`   - ${key}`));
          });
          console.log(chalk.gray('(These may contain API keys, tokens, or passwords)\n'));
        }

        // Let user select which vars to save
        const envChoices = [
          ...Object.keys(safe).map((key) => ({
            name: formatEnvVars({ [key]: userEnv[key] })[0],
            value: key,
            checked: true, // Safe vars are checked by default
          })),
          ...Object.keys(sensitive).map((key) => ({
            name: `${formatEnvVars({ [key]: userEnv[key] })[0]} ${chalk.yellow('(sensitive)')}`,
            value: key,
            checked: false, // Sensitive vars are unchecked by default
          })),
        ];

        if (envChoices.length > 0) {
          const checkboxPrompt: CheckboxPrompt = {
            type: 'checkbox',
            name: 'envVars',
            message: 'Select environment variables to save (use space to toggle):',
            choices: envChoices,
          };

          const selectedVars = await promptMultiple<{ envVars: string[] }>([checkboxPrompt]);

          // Build the selected env object
          for (const varName of selectedVars.envVars) {
            selectedEnv[varName] = userEnv[varName];
          }

          if (Object.keys(selectedEnv).length > 0) {
            console.log(
              chalk.green(
                `\n✓ ${Object.keys(selectedEnv).length} environment variable(s) will be saved`
              )
            );
          }
        }
      }
    }

    // Save the command with the current directory and env vars (default to 'saved' path mode for prev command)
    try {
      const success = setAlias(
        name,
        lastCommand,
        cwd,
        'saved',
        Object.keys(selectedEnv).length > 0 ? selectedEnv : undefined
      );

      if (success) {
        console.log(chalk.green(`✓ ${SUCCESS_MESSAGES.saved(name)}`));
        console.log(chalk.gray(`  Command: ${lastCommand}`));
        console.log(chalk.gray(`  Directory: ${cwd}`));
        console.log(chalk.gray(`  Path Mode: saved (use 'aliasmate edit ${name}' to change)`));
        if (Object.keys(selectedEnv).length > 0) {
          console.log(
            chalk.gray(`  Environment Variables: ${Object.keys(selectedEnv).length} saved`)
          );
        }
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
