import * as fs from 'fs';
import * as path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { loadAliases, saveAliases, aliasExists, AliasConfig } from '../storage';

interface ImportData {
  aliases: AliasConfig;
  version?: string;
  exportedAt?: string;
}

export async function importCommand(filePath: string): Promise<void> {
  try {
    // Resolve the file path
    const resolvedPath = path.resolve(filePath);
    
    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      console.error(chalk.red(`Error: File not found: ${resolvedPath}`));
      process.exit(1);
    }
    
    // Read and parse the file
    let importData: ImportData;
    try {
      const fileContent = fs.readFileSync(resolvedPath, 'utf8');
      importData = JSON.parse(fileContent) as ImportData;
    } catch (parseError) {
      console.error(chalk.red('Error: Could not parse file. Make sure it is valid JSON.'));
      console.error((parseError as Error).message);
      process.exit(1);
    }
    
    // Validate the import data structure
    if (!importData.aliases || typeof importData.aliases !== 'object') {
      console.error(chalk.red('Error: Invalid file format. Expected an "aliases" object.'));
      process.exit(1);
    }
    
    const importAliases = importData.aliases;
    const importNames = Object.keys(importAliases);
    
    if (importNames.length === 0) {
      console.log(chalk.yellow('No commands found in file.'));
      return;
    }
    
    console.log(chalk.blue(`Found ${importNames.length} command(s) to import\n`));
    
    // Load existing aliases
    const existingAliases = loadAliases();
    const conflicts: string[] = [];
    const newAliases: string[] = [];
    
    // Check for conflicts
    for (const name of importNames) {
      if (aliasExists(name)) {
        conflicts.push(name);
      } else {
        newAliases.push(name);
      }
    }
    
    // Handle conflicts
    const resolutions: Record<string, { action: string; newName?: string }> = {};
    if (conflicts.length > 0) {
      console.log(chalk.yellow(`Warning: ${conflicts.length} name conflict(s) found:\n`));
      
      for (const name of conflicts) {
        console.log(chalk.gray(`Existing: ${name}`));
        console.log(chalk.gray(`  ${existingAliases[name].command}`));
        console.log(chalk.gray(`Importing: ${name}`));
        console.log(chalk.gray(`  ${importAliases[name].command}\n`));
        
        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: `What should we do with "${name}"?`,
            choices: [
              { name: 'Overwrite existing', value: 'overwrite' },
              { name: 'Skip this command', value: 'skip' },
              { name: 'Rename imported command', value: 'rename' }
            ]
          }
        ]);
        
        if (action === 'rename') {
          const { newName } = await inquirer.prompt([
            {
              type: 'input',
              name: 'newName',
              message: 'Enter new name:',
              default: `${name}_imported`,
              validate: (input: string) => {
                if (!input.trim()) {
                  return 'Name cannot be empty';
                }
                if (input.includes(' ')) {
                  return 'Name cannot contain spaces';
                }
                if (aliasExists(input) || resolutions[input]) {
                  return `Name "${input}" is already taken`;
                }
                return true;
              }
            }
          ]);
          
          resolutions[name] = { action: 'rename', newName };
        } else {
          resolutions[name] = { action };
        }
        
        console.log();
      }
    }
    
    // Apply imports
    const updatedAliases = { ...existingAliases };
    let importedCount = 0;
    let skippedCount = 0;
    
    for (const name of importNames) {
      const importAlias = importAliases[name];
      
      if (conflicts.includes(name)) {
        const resolution = resolutions[name];
        
        if (resolution.action === 'skip') {
          skippedCount++;
          continue;
        } else if (resolution.action === 'overwrite') {
          updatedAliases[name] = importAlias;
          importedCount++;
        } else if (resolution.action === 'rename' && resolution.newName) {
          updatedAliases[resolution.newName] = importAlias;
          importedCount++;
        }
      } else {
        updatedAliases[name] = importAlias;
        importedCount++;
      }
    }
    
    // Save the updated aliases
    const success = saveAliases(updatedAliases);
    
    if (success) {
      console.log(chalk.green(`✓ Import complete:`));
      console.log(chalk.gray(`  Imported: ${importedCount} command(s)`));
      if (skippedCount > 0) {
        console.log(chalk.gray(`  Skipped: ${skippedCount} command(s)`));
      }
    } else {
      console.error(chalk.red('Error: Could not save imported commands'));
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
