#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { prevCommand } from './commands/prev';
import { runCommand } from './commands/run';
import { saveCommand } from './commands/save';
import { listCommand } from './commands/list';
import { deleteCommand } from './commands/delete';
import { editCommand } from './commands/edit';
import { exportCommand } from './commands/export';
import { importCommand } from './commands/import';
import { searchCommand } from './commands/search';
import { createChangelogCommand } from './commands/changelog';
import { createAliasCommand, listAliasesCommand, removeAliasCommand } from './commands/alias';
import { validateCommand, validateAllCommands } from './commands/validate';
import { recentCommand } from './commands/recent';
import { completionCommand } from './commands/completion';
import { getConfigPath, getConfigDir, loadAliases, setAlias, aliasExists } from './storage';
import { APP_VERSION } from './utils/constants';
import { checkAndShowOnboarding } from './utils/onboarding';
import { getDefaultLLMCommand } from './utils/llm-generator';
import { checkForUpdates } from './utils/version-checker';

const program = new Command();

program
  .name('aliasmate')
  .description(
    'A CLI utility to save, manage, and re-run shell commands with their working directories'
  )
  .version(APP_VERSION);

// prev command - save previous command from history
program
  .command('prev <name>')
  .description('Save the previous command from shell history')
  .action((name: string) => {
    void prevCommand(name, process.cwd());
  });

// run command - execute a saved command
program
  .command('run <name> [path]')
  .description('Run a saved command (optionally override the working directory)')
  .option('--dry-run', 'Preview what will execute without actually running the command')
  .option('--verbose', 'Show detailed information (use with --dry-run)')
  .action(
    (name: string, path: string | undefined, options: { dryRun?: boolean; verbose?: boolean }) => {
      void runCommand(name, path, options.dryRun, options.verbose);
    }
  );

// save command - interactively save a new command
program
  .command('save')
  .description('Interactively save a new command')
  .option('--no-validate', 'Skip validation checks')
  .action(() => {
    void saveCommand(process.cwd());
  });

// list commands
program
  .command('list')
  .alias('ls')
  .description('List all saved commands')
  .option('--format <type>', 'Output format: table, json, yaml, compact', 'table')
  .action((options: { format?: string }) => {
    const format = options.format || 'table';
    if (!['table', 'json', 'yaml', 'compact'].includes(format)) {
      console.error(
        chalk.red(`Error: Invalid format "${format}". Must be: table, json, yaml, or compact`)
      );
      process.exit(1);
    }
    listCommand(format as 'table' | 'json' | 'yaml' | 'compact');
  });

// search commands
program
  .command('search <query>')
  .alias('find')
  .description('Search for commands by name, command text, or directory')
  .action((query: string) => {
    searchCommand(query);
  });

// recent commands
program
  .command('recent')
  .description('Show recently executed commands')
  .option('--limit <number>', 'Maximum number of commands to display', parseInt)
  .option('--clear', 'Clear execution history')
  .action((options: { limit?: number; clear?: boolean }) => {
    recentCommand(options);
  });

// delete command
program
  .command('delete <name>')
  .alias('rm')
  .description('Delete a saved command')
  .action((name: string) => {
    deleteCommand(name);
  });

// edit command
program
  .command('edit <name>')
  .description('Edit a saved command')
  .option('--no-validate', 'Skip validation checks')
  .action((name: string, options: { validate?: boolean }) => {
    void editCommand(name, options.validate !== false);
  });

// export commands
program
  .command('export <file>')
  .description('Export all saved commands to a file')
  .option('--format <type>', 'Output format: json, yaml', 'json')
  .action((file: string, options: { format?: string }) => {
    const format = options.format || 'json';
    if (!['json', 'yaml'].includes(format)) {
      console.error(chalk.red(`Error: Invalid format "${format}". Must be: json or yaml`));
      process.exit(1);
    }
    exportCommand(file, format as 'json' | 'yaml');
  });

// import commands
program
  .command('import <file>')
  .description('Import commands from a JSON file')
  .action((file: string) => {
    void importCommand(file);
  });

// Add changelog command
program.addCommand(createChangelogCommand());

// alias command - create, list, and remove command aliases
program
  .command('alias [shortAlias] [commandName]')
  .description('Create, list, or remove command aliases')
  .option('--list', 'List all aliases')
  .option('--remove <alias>', 'Remove an alias')
  .action(
    (
      shortAlias: string | undefined,
      commandName: string | undefined,
      options: { list?: boolean; remove?: string }
    ) => {
      if (options.list) {
        listAliasesCommand();
      } else if (options.remove) {
        removeAliasCommand(options.remove);
      } else if (shortAlias && commandName) {
        createAliasCommand(shortAlias, commandName);
      } else if (!shortAlias && !commandName) {
        // No arguments provided, show list by default
        listAliasesCommand();
      } else {
        console.error(chalk.red('Error: Invalid arguments'));
        console.log(chalk.yellow('Usage:'));
        console.log(chalk.gray('  aliasmate alias <alias-name> <command-name>  - Create an alias'));
        console.log(
          chalk.gray('  aliasmate alias --list                       - List all aliases')
        );
        console.log(chalk.gray('  aliasmate alias --remove <alias-name>        - Remove an alias'));
        process.exit(1);
      }
    }
  );

// validate command - validate commands
program
  .command('validate [name]')
  .description('Validate a command or all commands')
  .option('--all', 'Validate all saved commands')
  .action((name: string | undefined, options: { all?: boolean }) => {
    if (options.all) {
      validateAllCommands();
    } else if (name) {
      validateCommand(name);
    } else {
      // No arguments, validate all by default
      validateAllCommands();
    }
  });

// config command - show config location
program
  .command('config')
  .description('Show the location of the config file and directory')
  .action(() => {
    const aliases = loadAliases();
    const commandCount = Object.keys(aliases).length;

    console.log(chalk.blue('AliasMate Configuration:'));
    console.log(chalk.gray(`  Config directory: ${getConfigDir()}`));
    console.log(chalk.gray(`  Config file: ${getConfigPath()}`));
    console.log(chalk.gray(`  Saved commands: ${commandCount}`));
  });

// completion command - generate shell completion scripts
program
  .command('completion [shell]')
  .description('Generate shell completion script (bash, zsh, or fish)')
  .action((shell: string | undefined) => {
    completionCommand(shell);
  });

// Handle unknown commands
program.on('command:*', () => {
  console.error(chalk.red('Error: Unknown command "%s"'), program.args.join(' '));
  console.log(chalk.yellow('\nAvailable commands:'));
  console.log(chalk.gray('  prev <name>       - Save previous command from history'));
  console.log(chalk.gray('  run <name> [path] - Run a saved command'));
  console.log(chalk.gray('  save              - Interactively save a command'));
  console.log(chalk.gray('  list (ls)         - List all saved commands'));
  console.log(chalk.gray('  search <query>    - Search for commands'));
  console.log(chalk.gray('  recent            - Show recently executed commands'));
  console.log(chalk.gray('  edit <name>       - Edit a saved command'));
  console.log(chalk.gray('  delete <name>     - Delete a saved command'));
  console.log(chalk.gray('  export <file>     - Export commands to file'));
  console.log(chalk.gray('  import <file>     - Import commands from file'));
  console.log(chalk.gray('  alias [...]       - Create, list, or remove aliases'));
  console.log(chalk.gray('  validate [name]   - Validate command(s)'));
  console.log(chalk.gray('  changelog         - View version changelog'));
  console.log(chalk.gray('  config            - Show config file location'));
  console.log(chalk.gray('  completion [shell]- Generate shell completion script'));
  console.log(chalk.yellow('\nUse --help for more information.'));
  process.exit(1);
});

// Add global error handler
process.on('uncaughtException', (error: Error) => {
  console.error(chalk.red('\nUnexpected error:'), error.message);
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  console.error(chalk.red('\nUnhandled promise rejection:'), reason);
  process.exit(1);
});

// Check for first install or upgrade and show onboarding BEFORE parsing
// This runs on EVERY invocation, but only shows messages on first install or upgrade
const onboardingShown = checkAndShowOnboarding();

// Check for updates (runs once per day, silently fails if offline)
void checkForUpdates();

// Create or update default LLM command
// On first install: creates the llm command
// On version upgrade: regenerates to keep version and content current
const llmExists = aliasExists('llm');
if (!llmExists || onboardingShown) {
  const llmCmd = getDefaultLLMCommand();
  setAlias(llmCmd.name, llmCmd.command, llmCmd.directory, llmCmd.pathMode);

  if (onboardingShown && !llmExists) {
    console.log(chalk.green('✓ Default "llm" command has been created'));
    console.log(chalk.gray(`  Run ${chalk.cyan('aliasmate run llm')} to generate llm.txt`));
    console.log();
  }
}

// Handle no arguments case before parsing
if (!process.argv.slice(2).length) {
  if (!onboardingShown) {
    program.outputHelp();
  }
  process.exit(0);
}

// Parse command line arguments
program.parse(process.argv);
