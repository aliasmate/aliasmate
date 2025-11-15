import chalk from 'chalk';
import { getLastCommand, getHistoryConfigInstructions } from '../utils/history';
import { setAlias } from '../storage';

export async function prevCommand(name: string, _options: any, cwd: string = process.cwd()): Promise<void> {
  try {
    // Get the last command from history
    const lastCommand = getLastCommand();
    
    if (!lastCommand) {
      console.error(chalk.red('Error: Could not retrieve previous command from history.'));
      console.log(chalk.yellow('\nTroubleshooting:'));
      console.log(chalk.gray('1. Make sure your shell history is enabled'));
      console.log(chalk.gray('2. For real-time history capture, configure your shell:'));
      console.log(chalk.gray(`   ${getHistoryConfigInstructions()}`));
      console.log(chalk.gray('3. Or use "aliasmate save" to manually enter the command'));
      process.exit(1);
    }
    
    // Save the command with the current directory
    const success = setAlias(name, lastCommand, cwd);
    
    if (success) {
      console.log(chalk.green(`✓ Saved command as "${name}"`));
      console.log(chalk.gray(`  Command: ${lastCommand}`));
      console.log(chalk.gray(`  Directory: ${cwd}`));
    } else {
      console.error(chalk.red('Error: Could not save command'));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('Error:'), (error as Error).message);
    process.exit(1);
  }
}
