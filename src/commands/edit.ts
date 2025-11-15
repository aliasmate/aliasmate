import inquirer from 'inquirer';
import chalk from 'chalk';
import { getAlias, setAlias } from '../storage';

export async function editCommand(name: string): Promise<void> {
  try {
    // Get the existing alias
    const alias = getAlias(name);
    
    if (!alias) {
      console.error(chalk.red(`Error: No saved command found with name "${name}"`));
      console.log(chalk.yellow('Use "aliasmate list" to see all saved commands'));
      process.exit(1);
    }
    
    console.log(chalk.blue(`Editing command: ${name}\n`));
    
    // Prompt for new values
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'command',
        message: 'Command:',
        default: alias.command,
        validate: (input: string) => {
          if (!input.trim()) {
            return 'Command cannot be empty';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'directory',
        message: 'Working directory:',
        default: alias.directory
      }
    ]);
    
    // Check if anything changed
    if (answers.command === alias.command && answers.directory === alias.directory) {
      console.log(chalk.yellow('No changes made'));
      return;
    }
    
    // Update the alias
    const success = setAlias(name, answers.command, answers.directory);
    
    if (success) {
      console.log(chalk.green(`✓ Updated command "${name}"`));
      console.log(chalk.gray(`  Command: ${answers.command}`));
      console.log(chalk.gray(`  Directory: ${answers.directory}`));
    } else {
      console.error(chalk.red('Error: Could not update command'));
      process.exit(1);
    }
  } catch (error: any) {
    if (error.isTtyError) {
      console.error(chalk.red('Error: Interactive prompt not supported in this environment'));
    } else {
      console.error(chalk.red('Error:'), error.message);
    }
    process.exit(1);
  }
}
