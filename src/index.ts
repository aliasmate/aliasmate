#!/usr/bin/env node
import { Command } from 'commander';

// Version comes from package.json so releases can't drift out of sync.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const APP_VERSION: string = (require('../package.json') as { version: string }).version;

/**
 * Command handlers are required lazily inside actions: `aliasmate run x`
 * never pays to load inquirer, and the interactive menu never loads execa
 * until a command actually runs.
 */
function wrap(fn: () => Promise<void> | void): void {
  Promise.resolve()
    .then(fn)
    .catch((error: Error) => {
      // Ctrl+C inside inquirer surfaces as a benign abort.
      if (error?.message?.includes('User force closed')) process.exit(0);
      console.error(`\x1b[31m✗ ${error.message}\x1b[0m`);
      process.exit(1);
    });
}

const program = new Command();

program
  .name('aliasmate')
  .description('Save shell commands with their working directories and re-run them from anywhere')
  .version(APP_VERSION);

program
  .command('run <name> [path]')
  .description('Run a saved command (name, alias, or @N recent reference)')
  .option('--dry-run', 'Preview what would execute without running it')
  .option('--verbose', 'Show full details in dry-run output')
  .action((name: string, pathOverride: string | undefined, options) =>
    wrap(async () => (await import('./cli/run')).runHandler(name, pathOverride, options))
  );

program
  .command('save')
  .description('Open the TUI with a blank new-command form')
  .action(() => wrap(async () => (await import('./cli/save')).saveHandler()));

program
  .command('prev [name]')
  .description('Capture your previous shell command and open the TUI form prefilled')
  .action((name: string | undefined) =>
    wrap(async () => (await import('./cli/save')).prevHandler(name))
  );

program
  .command('list')
  .alias('ls')
  .description('List all saved commands')
  .option('--format <type>', 'Output format: table, json, yaml, compact', 'table')
  .action((options: { format: string }) =>
    wrap(async () => {
      const valid = ['table', 'json', 'yaml', 'compact'];
      if (!valid.includes(options.format))
        throw new Error(`Invalid format "${options.format}" (${valid.join(', ')})`);
      (await import('./cli/manage')).listHandler(options.format as never);
    })
  );

program
  .command('search <query>')
  .alias('find')
  .description('Search commands by name, text, or directory')
  .action((query: string) => wrap(async () => (await import('./cli/manage')).searchHandler(query)));

program
  .command('edit <name>')
  .description('Edit a saved command in the TUI')
  .action((name: string) => wrap(async () => (await import('./cli/manage')).editHandler(name)));

program
  .command('rename <old> <new>')
  .alias('mv')
  .description('Rename a saved command (aliases and history follow)')
  .action((oldName: string, newName: string) =>
    wrap(async () => (await import('./cli/manage')).renameHandler(oldName, newName))
  );

program
  .command('delete <name>')
  .alias('rm')
  .description('Delete a saved command')
  .option('-f, --force', 'Delete without confirmation')
  .action((name: string, options) =>
    wrap(async () => (await import('./cli/manage')).deleteHandler(name, options))
  );

program
  .command('alias [short] [command]')
  .description('Create, list, or remove shortcut aliases')
  .option('--list', 'List all aliases')
  .option('--remove <alias>', 'Remove an alias')
  .action((short: string | undefined, command: string | undefined, options) =>
    wrap(async () => (await import('./cli/manage')).aliasHandler(short, command, options))
  );

program
  .command('recent')
  .description('Show recently run commands (@N references)')
  .option('--limit <n>', 'Maximum entries to show', (v) => parseInt(v, 10))
  .option('--clear', 'Clear execution history')
  .action((options) => wrap(async () => (await import('./cli/manage')).recentHandler(options)));

program
  .command('stats')
  .description('Show usage statistics for your commands')
  .action(() => wrap(async () => (await import('./cli/manage')).statsHandler()));

program
  .command('validate [name]')
  .description('Validate one command, or all commands')
  .option('--all', 'Validate all saved commands')
  .action((name: string | undefined, options: { all?: boolean }) =>
    wrap(async () => (await import('./cli/manage')).validateHandler(options.all ? undefined : name))
  );

program
  .command('export <file>')
  .description('Export commands to a JSON or YAML file (secrets masked unless --full)')
  .option('--format <type>', 'json or yaml')
  .option('--full', 'Include real secret env values (restorable backup)')
  .action((file: string, options) =>
    wrap(async () => (await import('./cli/transfer')).exportHandler(file, options))
  );

program
  .command('import <file>')
  .description('Import commands from a JSON file (auto-backup first)')
  .action((file: string) => wrap(async () => (await import('./cli/transfer')).importHandler(file)));

program
  .command('completion [shell]')
  .description('Generate or install shell completion (bash, zsh, fish)')
  .option('--install', 'Install completion for your current shell')
  .option('--names', 'Print saved command names (used by completion scripts)')
  .action((shell: string | undefined, options) =>
    wrap(async () => (await import('./cli/completion')).completionHandler(shell, options))
  );

program
  .command('config')
  .description('Show where your commands are stored')
  .action(() =>
    wrap(async () => {
      const { getConfigDir, getConfigPath } = await import('./core/store');
      const { listCommands } = await import('./core/commands');
      console.log(`Config directory: ${getConfigDir()}`);
      console.log(`Config file:      ${getConfigPath()}`);
      console.log(`Saved commands:   ${Object.keys(listCommands()).length}`);
    })
  );

program.showSuggestionAfterError(true);

const args = process.argv.slice(2);
if (args.length === 0) {
  // Zero-args: interactive home screen (with first-run welcome).
  wrap(async () => {
    const { maybeShowOnboarding } = await import('./ui/onboarding');
    maybeShowOnboarding(APP_VERSION);
    if (process.stdout.isTTY && process.stdin.isTTY) {
      await (await import('./ui/interactive')).interactiveHome();
    } else {
      program.outputHelp();
    }
  });
} else {
  program.parse(process.argv);
}
