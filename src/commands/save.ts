import chalk from 'chalk';
import { setAlias, aliasExists, PathMode } from '../storage';
import { handleError, isInquirerTTYError, exitWithError, ExitCode } from '../utils/errors';
import { SUCCESS_MESSAGES, ERROR_MESSAGES, HELP_MESSAGES } from '../utils/constants';
import {
  promptMultiple,
  promptConfirm,
  TextInputPrompt,
  ConfirmPrompt,
  ListPrompt,
  CheckboxPrompt,
} from '../utils/prompts';
import { getUserEnvVars, categorizeEnvVars, formatEnvVars } from '../utils/env';
import { validateCommandAlias } from '../utils/validator';

/**
 * Interactively save a new command with prompts
 *
 * @param cwd - The default working directory to suggest (defaults to process.cwd())
 * @param shouldValidate - Whether to validate the command (defaults to true)
 *
 * @example
 * ```
 * // User is prompted for:
 * // - Command name (e.g., 'deploy-prod')
 * // - Command to save (e.g., 'npm run deploy')
 * // - Working directory (defaults to current directory)
 * await saveCommand();
 * ```
 */
export async function saveCommand(
  cwd: string = process.cwd(),
  shouldValidate: boolean = true
): Promise<void> {
  try {
    // Prompt for command details including path mode
    const prompts: (TextInputPrompt | ListPrompt)[] = [
      {
        type: 'input',
        name: 'name',
        message: 'Enter a name for this command:',
        validate: (input: string) => {
          const trimmed = input.trim();
          if (!trimmed) {
            return HELP_MESSAGES.emptyValue('Name');
          }
          if (trimmed.includes(' ')) {
            return HELP_MESSAGES.invalidName;
          }
          // Check for invalid characters
          if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
            return 'Name can only contain letters, numbers, hyphens, and underscores';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'command',
        message: 'Enter the command to save:',
        validate: (input: string) => {
          if (!input.trim()) {
            return HELP_MESSAGES.emptyValue('Command');
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'directory',
        message: 'Enter the working directory:',
        default: cwd,
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
        message: 'Choose path mode:',
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
      name: string;
      command: string;
      directory: string;
      pathMode: PathMode;
    }>(prompts);

    // Check if alias already exists
    if (aliasExists(answers.name)) {
      const confirmPrompt: ConfirmPrompt = {
        type: 'confirm',
        name: 'confirm',
        message: `A command named "${answers.name}" already exists. Overwrite?`,
        default: false,
      };

      const confirm = await promptConfirm(confirmPrompt);

      if (!confirm) {
        console.log(chalk.yellow('Save cancelled'));
        return;
      }
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

    // Validate the command if requested
    if (shouldValidate) {
      console.log(chalk.blue('\nValidating command...'));
      const report = validateCommandAlias(
        answers.command,
        answers.directory,
        Object.keys(selectedEnv).length > 0 ? selectedEnv : undefined
      );

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
            console.log(chalk.yellow('Save cancelled'));
            return;
          }
        } else {
          console.log(chalk.green('✓ Validation passed'));
        }
      } else {
        console.log(chalk.green('✓ Validation passed'));
      }
    }

    // Save the command with path mode and env vars
    try {
      const success = setAlias(
        answers.name.trim(),
        answers.command,
        answers.directory,
        answers.pathMode,
        Object.keys(selectedEnv).length > 0 ? selectedEnv : undefined
      );

      if (success) {
        console.log(chalk.green(`✓ ${SUCCESS_MESSAGES.saved(answers.name.trim())}`));
        console.log(chalk.gray(`  Command: ${answers.command}`));
        console.log(chalk.gray(`  Directory: ${answers.directory}`));
        console.log(chalk.gray(`  Path Mode: ${answers.pathMode}`));
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
    if (isInquirerTTYError(error)) {
      exitWithError(ERROR_MESSAGES.interactiveNotSupported, ExitCode.GeneralError);
    } else {
      handleError(error, 'Failed to save command');
    }
  }
}
