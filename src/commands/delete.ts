import chalk from 'chalk';
import { deleteAlias, getAlias } from '../storage';

export function deleteCommand(name: string): void {
  try {
    // Check if alias exists
    const alias = getAlias(name);
    if (!alias) {
      console.error(chalk.red(`Error: No saved command found with name "${name}"`));
      console.log(chalk.yellow('Use "aliasmate list" to see all saved commands'));
      process.exit(1);
    }
    
    // Delete the alias
    const success = deleteAlias(name);
    
    if (success) {
      console.log(chalk.green(`✓ Deleted command "${name}"`));
    } else {
      console.error(chalk.red('Error: Could not delete command'));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('Error:'), (error as Error).message);
    process.exit(1);
  }
}
