import chalk from 'chalk';
import { getAlias, setAlias, PathMode } from '../storage';
import { handleError, isInquirerTTYError, exitWithError, ExitCode } from '../utils/errors';
import { SUCCESS_MESSAGES, ERROR_MESSAGES, HELP_MESSAGES } from '../utils/constants';
import {
  promptMultiple,
  promptConfirm,
  TextInputPrompt,
  ListPrompt,
  ConfirmPrompt,
  CheckboxPrompt,
} from '../utils/prompts';
import { getUserEnvVars, categorizeEnvVars, formatEnvVars } from '../utils/env';
import { validateCommandAlias } from '../utils/validator';

/**
 * Edit an existing command interactively
 *
 * @param name - The name of the command to edit
 * @param shouldValidate - Whether to validate the command (defaults to true)
 *
 * @example
 * ```
 * // User is prompted to update:
 * // - Command (pre-filled with current value)
 * // - Working directory (pre-filled with current value)
 * await editCommand('build-prod');
 * ```
 */
export async function editCommand(name: string, shouldValidate: boolean = true): Promise<void> {
  try {
    // Get the existing alias
    const alias = getAlias(name);

    if (!alias) {
      console.error(chalk.red(`Error: ${ERROR_MESSAGES.commandNotFound(name)}`));
      console.log(chalk.yellow(HELP_MESSAGES.useList));
      process.exit(ExitCode.InvalidInput);
    }

    console.log(chalk.blue(`Editing command: ${name}\n`));

    // Prompt for new values including path mode
    const prompts: (TextInputPrompt | ListPrompt)[] = [
      {
        type: 'input',
        name: 'command',
        message: 'Command:',
        default: alias.command,
        validate: (input: string) => {
          const trimmed = input.trim();
          if (!trimmed) {
            return HELP_MESSAGES.emptyValue('Command');
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'directory',
        message: 'Working directory:',
        default: alias.directory,
        validate: (input: string) => {
          const trimmed = input.trim();
          if (!trimmed) {
            return HELP_MESSAGES.emptyValue('Directory');
          }
          return true;
        },
      },
      {
        type: 'list',
        name: 'pathMode',
        message: 'Path mode:',
        choices: [
          {
            name: 'Saved Directory (always run in the directory above)',
            value: 'saved',
          },
          {
            name: 'Current Directory (run in your current working directory)',
            value: 'current',
          },
        ],
      },
    ];

    const answers = await promptMultiple<{
      command: string;
      directory: string;
      pathMode: PathMode;
    }>(prompts);

    // Ask if user wants to update environment variables
    const updateEnvPrompt: ConfirmPrompt = {
      type: 'confirm',
      name: 'updateEnv',
      message: 'Update environment variables?',
      default: false,
    };

    const shouldUpdateEnv = await promptConfirm(updateEnvPrompt);
    let selectedEnv: Record<string, string> | undefined = alias.env;

    if (shouldUpdateEnv) {
      // Merge current env with saved env for the selection UI
      const currentEnv = getUserEnvVars();
      const savedEnv = alias.env || {};

      // Combine all available env vars
      const allEnv = { ...currentEnv, ...savedEnv };
      const { sensitive, safe } = categorizeEnvVars(allEnv);

      if (Object.keys(allEnv).length === 0) {
        console.log(chalk.yellow('No user-defined environment variables found.'));
        selectedEnv = undefined;
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
            name: formatEnvVars({ [key]: allEnv[key] })[0],
            value: key,
            checked: key in savedEnv, // Check if already saved
          })),
          ...Object.keys(sensitive).map((key) => ({
            name: `${formatEnvVars({ [key]: allEnv[key] })[0]} ${chalk.yellow('(sensitive)')}`,
            value: key,
            checked: key in savedEnv, // Check if already saved
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
          const newEnv: Record<string, string> = {};
          for (const varName of selectedVars.envVars) {
            newEnv[varName] = allEnv[varName];
          }

          selectedEnv = Object.keys(newEnv).length > 0 ? newEnv : undefined;

          if (selectedEnv) {
            console.log(
              chalk.green(
                `\n✓ ${Object.keys(selectedEnv).length} environment variable(s) will be saved`
              )
            );
          } else {
            console.log(chalk.yellow('\n✓ All environment variables cleared'));
          }
        }
      }
    }

    // Check if anything changed
    const currentPathMode = alias.pathMode || 'saved'; // Default to 'saved' for backward compatibility
    const envChanged = JSON.stringify(selectedEnv || {}) !== JSON.stringify(alias.env || {});

    if (
      answers.command === alias.command &&
      answers.directory === alias.directory &&
      answers.pathMode === currentPathMode &&
      !envChanged
    ) {
      console.log(chalk.yellow('No changes made'));
      return;
    }

    // Validate the command if requested
    if (shouldValidate) {
      console.log(chalk.blue('\nValidating command...'));
      const report = validateCommandAlias(answers.command, answers.directory, selectedEnv);

      if (report.issues.length > 0) {
        const errors = report.issues.filter((issue) => issue.type === 'error');
        const warnings = report.issues.filter((issue) => issue.type === 'warning');

        if (errors.length > 0) {
          console.log(chalk.red(`\n✗ Validation failed with ${errors.length} error(s):\n`));
          for (const error of errors) {
            console.log(chalk.red(`  [${error.field}] ${error.message}`));
          }
          console.log();
          console.log(chalk.yellow('Use --no-validate flag to skip validation'));
          process.exit(ExitCode.InvalidInput);
        }

        if (warnings.length > 0) {
          console.log(chalk.yellow(`\n⚠  ${warnings.length} warning(s):\n`));
          for (const warning of warnings) {
            console.log(chalk.yellow(`  [${warning.field}] ${warning.message}`));
          }

          const continuePrompt: ConfirmPrompt = {
            type: 'confirm',
            name: 'continue',
            message: 'Continue saving despite warnings?',
            default: true,
          };

          const shouldContinue = await promptConfirm(continuePrompt);
          if (!shouldContinue) {
            console.log(chalk.yellow('Edit cancelled'));
            return;
          }
        } else {
          console.log(chalk.green('✓ Validation passed'));
        }
      } else {
        console.log(chalk.green('✓ Validation passed'));
      }
    }

    // Update the alias with path mode and env vars
    try {
      const success = setAlias(
        name,
        answers.command,
        answers.directory,
        answers.pathMode,
        selectedEnv
      );

      if (success) {
        console.log(chalk.green(`✓ ${SUCCESS_MESSAGES.updated(name)}`));
        console.log(chalk.gray(`  Command: ${answers.command}`));
        console.log(chalk.gray(`  Directory: ${answers.directory}`));
        console.log(chalk.gray(`  Path Mode: ${answers.pathMode}`));
        if (selectedEnv && Object.keys(selectedEnv).length > 0) {
          console.log(
            chalk.gray(`  Environment Variables: ${Object.keys(selectedEnv).length} saved`)
          );
        } else {
          console.log(chalk.gray(`  Environment Variables: none`));
        }
      } else {
        exitWithError(ERROR_MESSAGES.couldNotUpdate);
      }
    } catch (error) {
      exitWithError(`${ERROR_MESSAGES.couldNotUpdate}: ${(error as Error).message}`);
    }
  } catch (error) {
    if (isInquirerTTYError(error)) {
      exitWithError(ERROR_MESSAGES.interactiveNotSupported, ExitCode.GeneralError);
    } else {
      handleError(error, 'Failed to edit command');
    }
  }
}
