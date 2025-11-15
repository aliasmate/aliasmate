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
import { getConfigPath } from './storage';

const program = new Command();

program
  .name('aliasmate')
  .description('A CLI utility to save, manage, and re-run shell commands with their working directories')
  .version('1.0.0');

// prev command - save previous command from history
program
  .command('prev <name>')
  .description('Save the previous command from shell history')
  .action((name: string, options: any) => {
    prevCommand(name, options, process.cwd());
  });

// run command - execute a saved command
program
  .command('run <name> [path]')
  .description('Run a saved command (optionally override the working directory)')
  .action((name: string, path: string | undefined, options: any) => {
    runCommand(name, path, options);
  });

// save command - interactively save a new command
program
  .command('save')
  .description('Interactively save a new command')
  .action((options: any) => {
    saveCommand(options, process.cwd());
  });

// list commands
program
  .command('list')
  .alias('ls')
  .description('List all saved commands')
  .action(() => {
    listCommand();
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
    editCommand(name);
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
    importCommand(file);
  });

// config command - show config location
program
  .command('config')
  .description('Show the location of the config file')
  .action(() => {
    console.log(chalk.blue('Config file location:'));
    console.log(chalk.gray(getConfigPath()));
  });

// Handle unknown commands
program.on('command:*', () => {
  console.error(chalk.red('Invalid command: %s'), program.args.join(' '));
  console.log(chalk.yellow('See --help for a list of available commands.'));
  process.exit(1);
});

// Parse arguments
program.parse(process.argv);

// Show help if no arguments provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
