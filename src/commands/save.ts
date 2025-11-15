import inquirer from 'inquirer';
import chalk from 'chalk';
import { setAlias, aliasExists } from '../storage';

export async function saveCommand(_options: any, cwd: string = process.cwd()): Promise<void> {
  try {
    // Prompt for command details
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Enter a name for this command:',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'Name cannot be empty';
          }
          if (input.includes(' ')) {
            return 'Name cannot contain spaces';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'command',
        message: 'Enter the command to save:',
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
        message: 'Enter the working directory:',
        default: cwd
      }
    ]);
    
    // Check if alias already exists
    if (aliasExists(answers.name)) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `A command named "${answers.name}" already exists. Overwrite?`,
          default: false
        }
      ]);
      
      if (!confirm) {
        console.log(chalk.yellow('Save cancelled'));
        return;
      }
    }
    
    // Save the command
    const success = setAlias(answers.name, answers.command, answers.directory);
    
    if (success) {
      console.log(chalk.green(`✓ Saved command as "${answers.name}"`));
      console.log(chalk.gray(`  Command: ${answers.command}`));
      console.log(chalk.gray(`  Directory: ${answers.directory}`));
    } else {
      console.error(chalk.red('Error: Could not save command'));
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
