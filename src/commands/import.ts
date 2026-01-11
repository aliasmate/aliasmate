import * as fs from 'fs';
import * as path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { loadAliases, saveAliases, aliasExists, AliasConfig, getConfigPath } from '../storage';
import { handleError, isInquirerTTYError, exitWithError, ExitCode } from '../utils/errors';
import { SUCCESS_MESSAGES, ERROR_MESSAGES, HELP_MESSAGES } from '../utils/constants';

/**
 * Structure of the import file
 */
interface ImportData {
  /** The command aliases to import */
  aliases: AliasConfig;
  /** Version of the export format */
  version?: string;
  /** Timestamp when the file was exported */
  exportedAt?: string;
}

/**
 * Import commands from a JSON file
 *
 * Handles conflicts intelligently by prompting the user for each conflict:
 * - Overwrite: Replace existing command with imported one
 * - Skip: Keep existing command, discard imported one
 * - Rename: Save imported command with a different name
 *
 * @param filePath - The path to the JSON file to import from
 *
 * @example
 * ```
 * // Import commands from a file
 * await importCommand('./team-commands.json');
 *
 * // If conflicts are found, user is prompted:
 * // - Overwrite existing
 * // - Skip this command
 * // - Rename imported command
 * ```
 */
export async function importCommand(filePath: string): Promise<void> {
  try {
    // Resolve the file path
    const resolvedPath = path.resolve(filePath);

    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      exitWithError(ERROR_MESSAGES.fileNotFound(resolvedPath), ExitCode.FileNotFound);
    }

    // Read and parse the file
    let importData: ImportData;
    try {
      const fileContent = fs.readFileSync(resolvedPath, 'utf8');
      importData = JSON.parse(fileContent) as ImportData;
    } catch (parseError) {
      console.error(chalk.red(`Error: ${ERROR_MESSAGES.invalidJson}`));
      console.error((parseError as Error).message);
      process.exit(ExitCode.InvalidInput);
    }

    // Validate the import data structure
    if (!importData.aliases || typeof importData.aliases !== 'object') {
      exitWithError(ERROR_MESSAGES.invalidFormat, ExitCode.InvalidInput);
    }

    const importAliases = importData.aliases;
    const importNames = Object.keys(importAliases);

    // Validate each alias structure
    for (const name of importNames) {
      const alias = importAliases[name];
      if (
        !alias ||
        typeof alias !== 'object' ||
        typeof alias.command !== 'string' ||
        typeof alias.directory !== 'string' ||
        !alias.command.trim() ||
        !alias.directory.trim()
      ) {
        exitWithError(ERROR_MESSAGES.invalidAliasStructure(name), ExitCode.InvalidInput);
      }
    }

    if (importNames.length === 0) {
      console.log(chalk.yellow(HELP_MESSAGES.noCommands));
      return;
    }

    console.log(chalk.blue(`Found ${importNames.length} command(s) to import\n`));

    // Create backup of existing config before importing
    const existingAliases = loadAliases();
    if (Object.keys(existingAliases).length > 0) {
      const configPath = getConfigPath();
      const backupPath = `${configPath}.backup.${Date.now()}`;
      try {
        fs.copyFileSync(configPath, backupPath);
        console.log(chalk.gray(`Backup created: ${backupPath}\n`));
      } catch (backupError) {
        console.warn(
          chalk.yellow(`Warning: Could not create backup: ${(backupError as Error).message}`)
        );
      }
    }

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

        const { action }: { action: string } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: `What should we do with "${name}"?`,
            choices: [
              { name: 'Overwrite existing', value: 'overwrite' },
              { name: 'Skip this command', value: 'skip' },
              { name: 'Rename imported command', value: 'rename' },
            ],
          },
        ]);

        if (action === 'rename') {
          const { newName }: { newName: string } = await inquirer.prompt([
            {
              type: 'input',
              name: 'newName',
              message: 'Enter new name:',
              default: `${name}_imported`,
              validate: (input: string) => {
                const trimmed = input.trim();
                if (!trimmed) {
                  return HELP_MESSAGES.emptyValue('Name');
                }
                if (trimmed.includes(' ')) {
                  return HELP_MESSAGES.invalidName;
                }
                // Check for invalid characters
                if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
                  return 'Name can only contain letters, numbers, hyphens, and underscores';
                }
                if (aliasExists(trimmed) || resolutions[trimmed]) {
                  return `Name "${trimmed}" is already taken`;
                }
                return true;
              },
            },
          ]);

          resolutions[name] = { action: 'rename', newName: newName.trim() };
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
      console.log(chalk.green(`✓ ${SUCCESS_MESSAGES.importComplete}:`));
      console.log(chalk.gray(`  Imported: ${importedCount} command(s)`));
      if (skippedCount > 0) {
        console.log(chalk.gray(`  Skipped: ${skippedCount} command(s)`));
      }
    } else {
      exitWithError('Could not save imported commands');
    }
  } catch (error) {
    if (isInquirerTTYError(error)) {
      exitWithError(ERROR_MESSAGES.interactiveNotSupported, ExitCode.GeneralError);
    } else {
      handleError(error, 'Failed to import commands');
    }
  }
}
