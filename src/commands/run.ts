import chalk from 'chalk';
import { getAlias } from '../storage';
import { executeCommand } from '../utils/executor';
import { resolvePath } from '../utils/paths';

export async function runCommand(name: string, overridePath?: string, _options?: any): Promise<void> {
  try {
    // Get the saved alias
    const alias = getAlias(name);
    
    if (!alias) {
      console.error(chalk.red(`Error: No saved command found with name "${name}"`));
      console.log(chalk.yellow('Use "aliasmate list" to see all saved commands'));
      process.exit(1);
    }
    
    // Determine the directory to run in
    const runDir = overridePath 
      ? resolvePath(overridePath, process.cwd())
      : alias.directory;
    
    // Show what we're about to run
    console.log(chalk.blue(`Running: ${alias.command}`));
    console.log(chalk.gray(`Directory: ${runDir}`));
    console.log();
    
    // Execute the command
    const result = await executeCommand(alias.command, runDir);
    
    if (!result.success) {
      console.error(chalk.red('\n✗ Command failed'));
      if (result.stderr) {
        console.error(result.stderr);
      }
      process.exit(1);
    }
    
  } catch (error) {
    console.error(chalk.red('Error:'), (error as Error).message);
    process.exit(1);
  }
}
