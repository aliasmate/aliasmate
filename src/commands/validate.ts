import chalk from 'chalk';
import { loadAliases, getAlias } from '../storage';
import { validateCommandAlias } from '../utils/validator';
import { handleError, exitWithError, ExitCode } from '../utils/errors';
import { ERROR_MESSAGES, HELP_MESSAGES } from '../utils/constants';

/**
 * Validate a single command by name
 * @param name - The name of the command to validate
 */
export function validateCommand(name: string): void {
  try {
    // Validate command name
    if (!name || !name.trim()) {
      exitWithError('Command name cannot be empty', ExitCode.InvalidInput);
    }

    // Get the command
    const alias = getAlias(name);
    if (!alias) {
      console.error(chalk.red(`Error: ${ERROR_MESSAGES.commandNotFound(name)}`));
      console.log(chalk.yellow(HELP_MESSAGES.useList));
      process.exit(ExitCode.InvalidInput);
    }

    console.log(chalk.blue(`\nValidating command: ${name}\n`));

    // Validate the command
    const report = validateCommandAlias(alias.command, alias.directory, alias.env);

    // Display results
    if (report.issues.length === 0) {
      console.log(chalk.green('✓ No issues found'));
      console.log(chalk.gray(`  Command: ${alias.command}`));
      console.log(chalk.gray(`  Directory: ${alias.directory}`));
      if (alias.env && Object.keys(alias.env).length > 0) {
        console.log(chalk.gray(`  Environment Variables: ${Object.keys(alias.env).length}`));
      }
      return;
    }

    // Separate errors and warnings
    const errors = report.issues.filter((issue) => issue.type === 'error');
    const warnings = report.issues.filter((issue) => issue.type === 'warning');

    // Display errors
    if (errors.length > 0) {
      console.log(chalk.red(`✗ ${errors.length} error(s) found:\n`));
      for (const error of errors) {
        console.log(chalk.red(`  [${error.field}] ${error.message}`));
      }
      console.log();
    }

    // Display warnings
    if (warnings.length > 0) {
      console.log(chalk.yellow(`⚠  ${warnings.length} warning(s) found:\n`));
      for (const warning of warnings) {
        console.log(chalk.yellow(`  [${warning.field}] ${warning.message}`));
      }
      console.log();
    }

    // Display summary
    if (report.valid) {
      console.log(chalk.green('✓ Validation passed with warnings'));
    } else {
      console.log(chalk.red('✗ Validation failed'));
      process.exit(ExitCode.InvalidInput);
    }
  } catch (error) {
    handleError(error, 'Failed to validate command');
  }
}

/**
 * Validate all saved commands
 */
export function validateAllCommands(): void {
  try {
    const aliases = loadAliases();
    const names = Object.keys(aliases);

    if (names.length === 0) {
      console.log(chalk.yellow('No commands to validate'));
      console.log(chalk.gray(HELP_MESSAGES.useSaveOrPrev));
      return;
    }

    console.log(chalk.blue(`\nValidating ${names.length} command(s)...\n`));

    let totalErrors = 0;
    let totalWarnings = 0;
    const commandsWithErrors: string[] = [];
    const commandsWithWarnings: string[] = [];

    // Sort alphabetically
    names.sort();

    for (const name of names) {
      const alias = aliases[name];
      const report = validateCommandAlias(alias.command, alias.directory, alias.env);

      const errors = report.issues.filter((issue) => issue.type === 'error');
      const warnings = report.issues.filter((issue) => issue.type === 'warning');

      if (errors.length > 0) {
        commandsWithErrors.push(name);
        totalErrors += errors.length;
      }

      if (warnings.length > 0) {
        commandsWithWarnings.push(name);
        totalWarnings += warnings.length;
      }

      // Display command status
      if (report.issues.length === 0) {
        console.log(chalk.green(`✓ ${name}`));
      } else if (errors.length > 0) {
        console.log(chalk.red(`✗ ${name}`));
        for (const error of errors) {
          console.log(chalk.red(`    [${error.field}] ${error.message}`));
        }
        if (warnings.length > 0) {
          for (const warning of warnings) {
            console.log(chalk.yellow(`    [${warning.field}] ${warning.message}`));
          }
        }
      } else {
        console.log(chalk.yellow(`⚠  ${name}`));
        for (const warning of warnings) {
          console.log(chalk.yellow(`    [${warning.field}] ${warning.message}`));
        }
      }
    }

    // Display summary
    console.log(chalk.blue(`\n${'─'.repeat(50)}\n`));
    console.log(chalk.bold('Validation Summary:\n'));

    console.log(chalk.gray(`  Total commands: ${names.length}`));
    console.log(
      chalk.green(
        `  ✓ Passed: ${names.length - commandsWithErrors.length - commandsWithWarnings.length}`
      )
    );

    if (commandsWithWarnings.length > 0) {
      console.log(
        chalk.yellow(
          `  ⚠  With warnings: ${commandsWithWarnings.length} (${totalWarnings} warnings)`
        )
      );
    }

    if (commandsWithErrors.length > 0) {
      console.log(
        chalk.red(`  ✗ With errors: ${commandsWithErrors.length} (${totalErrors} errors)`)
      );
      console.log();
      console.log(chalk.yellow('Commands with errors:'));
      for (const name of commandsWithErrors) {
        console.log(chalk.red(`  - ${name}`));
      }
      console.log();
      console.log(chalk.gray('Run "aliasmate validate <name>" for detailed validation'));
      process.exit(ExitCode.InvalidInput);
    } else {
      console.log();
      if (totalWarnings > 0) {
        console.log(chalk.green('✓ All commands passed validation with warnings'));
      } else {
        console.log(chalk.green('✓ All commands passed validation'));
      }
    }
  } catch (error) {
    handleError(error, 'Failed to validate commands');
  }
}
