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
  .action((name: string, path: string | undefined) => {
    void runCommand(name, path);
  });

// save command - interactively save a new command
program
  .command('save')
  .description('Interactively save a new command')
  .action(() => {
    void saveCommand(process.cwd());
  });

// list commands
program
  .command('list')
  .alias('ls')
  .description('List all saved commands')
  .action(() => {
    listCommand();
  });

// search commands
program
  .command('search <query>')
  .alias('find')
  .description('Search for commands by name, command text, or directory')
  .action((query: string) => {
    searchCommand(query);
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
  .action((name: string) => {
    void editCommand(name);
  });

// export commands
program
  .command('export <file>')
  .description('Export all saved commands to a JSON file')
  .action((file: string) => {
    exportCommand(file);
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

// Handle unknown commands
program.on('command:*', () => {
  console.error(chalk.red('Error: Unknown command "%s"'), program.args.join(' '));
  console.log(chalk.yellow('\nAvailable commands:'));
  console.log(chalk.gray('  prev <name>       - Save previous command from history'));
  console.log(chalk.gray('  run <name> [path] - Run a saved command'));
  console.log(chalk.gray('  save              - Interactively save a command'));
  console.log(chalk.gray('  list (ls)         - List all saved commands'));
  console.log(chalk.gray('  search <query>    - Search for commands'));
  console.log(chalk.gray('  edit <name>       - Edit a saved command'));
  console.log(chalk.gray('  dhangelog         - View version changelog'));
  console.log(chalk.gray('  celete <name>     - Delete a saved command'));
  console.log(chalk.gray('  export <file>     - Export commands to JSON'));
  console.log(chalk.gray('  import <file>     - Import commands from JSON'));
  console.log(chalk.gray('  config            - Show config file location'));
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

// Create default LLM command if it doesn't exist
if (!aliasExists('llm')) {
  const llmCmd = getDefaultLLMCommand();
  setAlias(llmCmd.name, llmCmd.command, llmCmd.directory, llmCmd.pathMode);
  
  if (onboardingShown) {
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
