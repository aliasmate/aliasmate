import chalk from 'chalk';
import { loadAliases } from '../storage';

export function listCommand(): void {
  try {
    const aliases = loadAliases();
    const names = Object.keys(aliases);
    
    if (names.length === 0) {
      console.log(chalk.yellow('No saved commands found.'));
      console.log(chalk.gray('Use "aliasmate save" or "aliasmate prev <name>" to save a command'));
      return;
    }
    
    console.log(chalk.bold(`\nSaved commands (${names.length}):\n`));
    
    // Sort alphabetically
    names.sort();
    
    for (const name of names) {
      const alias = aliases[name];
      console.log(chalk.cyan(`  ${name}`));
      console.log(chalk.gray(`    Command: ${alias.command}`));
      console.log(chalk.gray(`    Directory: ${alias.directory}`));
      console.log();
    }
  } catch (error) {
    console.error(chalk.red('Error:'), (error as Error).message);
    process.exit(1);
  }
}
