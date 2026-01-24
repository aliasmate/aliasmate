import chalk from 'chalk';
import { getAlias } from '../storage';
import { loadMetadata, saveMetadata } from '../storage';
import { handleError, exitWithError, ExitCode } from '../utils/errors';
import { ERROR_MESSAGES, HELP_MESSAGES } from '../utils/constants';

/**
 * Type representing the alias mappings stored in metadata
 * Maps short alias names to their full command names
 */
interface AliasMapping {
  [shortAlias: string]: string; // shortAlias -> commandName
}

const METADATA_KEY_ALIASES = 'command_aliases';

/**
 * Load the alias mappings from metadata
 * @returns The alias mapping object
 */
function loadAliasMappings(): AliasMapping {
  const metadata = loadMetadata();
  return (metadata[METADATA_KEY_ALIASES] as AliasMapping) || {};
}

/**
 * Save the alias mappings to metadata
 * @param mappings - The alias mappings to save
 * @returns true if successful, false otherwise
 */
function saveAliasMappings(mappings: AliasMapping): boolean {
  const metadata = loadMetadata();
  metadata[METADATA_KEY_ALIASES] = mappings;
  return saveMetadata(metadata);
}

/**
 * Validate alias name
 * - Must not be empty
 * - Must not contain spaces or special characters (only alphanumeric, dash, underscore)
 * - Must not be a reserved command name
 * @param alias - The alias name to validate
 * @returns true if valid, throws error otherwise
 */
function validateAliasName(alias: string): boolean {
  if (!alias || !alias.trim()) {
    throw new Error('Alias name cannot be empty');
  }

  // Check for valid characters (alphanumeric, dash, underscore)
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  if (!validPattern.test(alias)) {
    throw new Error('Alias name can only contain letters, numbers, dashes, and underscores');
  }

  // Reserved commands that cannot be used as aliases
  const reservedCommands = [
    'prev',
    'run',
    'save',
    'list',
    'ls',
    'search',
    'find',
    'delete',
    'rm',
    'edit',
    'export',
    'import',
    'config',
    'changelog',
    'alias',
    'help',
    'version',
  ];

  if (reservedCommands.includes(alias.toLowerCase())) {
    throw new Error(`"${alias}" is a reserved command name and cannot be used as an alias`);
  }

  return true;
}

/**
 * Create a new alias for a saved command
 * @param shortAlias - The short alias name to create
 * @param commandName - The full command name to alias
 */
export function createAliasCommand(shortAlias: string, commandName: string): void {
  try {
    // Validate inputs
    if (!commandName || !commandName.trim()) {
      exitWithError('Command name cannot be empty', ExitCode.InvalidInput);
    }

    // Validate the alias name
    validateAliasName(shortAlias);

    // Check if the target command exists
    const targetCommand = getAlias(commandName);
    if (!targetCommand) {
      console.error(chalk.red(`Error: ${ERROR_MESSAGES.commandNotFound(commandName)}`));
      console.log(chalk.yellow(HELP_MESSAGES.useList));
      process.exit(ExitCode.InvalidInput);
    }

    // Load existing alias mappings
    const mappings = loadAliasMappings();

    // Check if alias already exists
    if (mappings[shortAlias]) {
      console.log(
        chalk.yellow(`Alias "${shortAlias}" already points to "${mappings[shortAlias]}"`)
      );
      console.log(chalk.gray(`Updating to point to "${commandName}"`));
    }

    // Create the alias mapping
    mappings[shortAlias] = commandName;

    // Save the mappings
    const success = saveAliasMappings(mappings);

    if (success) {
      console.log(chalk.green(`✓ Created alias "${shortAlias}" → "${commandName}"`));
      console.log(chalk.gray(`  You can now run: aliasmate run ${shortAlias}`));
    } else {
      exitWithError('Failed to save alias', ExitCode.GeneralError);
    }
  } catch (error) {
    handleError(error, 'Failed to create alias');
  }
}

/**
 * List all aliases
 */
export function listAliasesCommand(): void {
  try {
    const mappings = loadAliasMappings();
    const aliases = Object.keys(mappings);

    if (aliases.length === 0) {
      console.log(chalk.yellow('No aliases defined.'));
      console.log(chalk.gray('Create an alias with: aliasmate alias <alias-name> <command-name>'));
      return;
    }

    console.log(chalk.bold(`\nAliases (${aliases.length}):\n`));

    // Sort alphabetically
    aliases.sort();

    for (const alias of aliases) {
      const commandName = mappings[alias];
      const command = getAlias(commandName);

      if (command) {
        console.log(chalk.cyan(`  ${alias} → ${commandName}`));
        console.log(chalk.gray(`    Command: ${command.command}`));
        console.log(chalk.gray(`    Directory: ${command.directory}`));
      } else {
        // The mapped command no longer exists
        console.log(chalk.cyan(`  ${alias} → ${commandName}`));
        console.log(chalk.red(`    ⚠️  Target command not found`));
      }
      console.log();
    }
  } catch (error) {
    handleError(error, 'Failed to list aliases');
  }
}

/**
 * Remove an alias
 * @param shortAlias - The alias name to remove
 */
export function removeAliasCommand(shortAlias: string): void {
  try {
    // Validate input
    if (!shortAlias || !shortAlias.trim()) {
      exitWithError('Alias name cannot be empty', ExitCode.InvalidInput);
    }

    // Load existing alias mappings
    const mappings = loadAliasMappings();

    // Check if alias exists
    if (!mappings[shortAlias]) {
      console.error(chalk.red(`Error: Alias "${shortAlias}" not found`));
      console.log(chalk.yellow('Use "aliasmate alias --list" to see all aliases'));
      process.exit(ExitCode.InvalidInput);
    }

    const targetCommand = mappings[shortAlias];

    // Show what will be removed
    console.log(chalk.yellow(`Removing alias:`));
    console.log(chalk.gray(`  Alias: ${shortAlias}`));
    console.log(chalk.gray(`  Points to: ${targetCommand}\n`));

    // Remove the alias
    delete mappings[shortAlias];

    // Save the updated mappings
    const success = saveAliasMappings(mappings);

    if (success) {
      console.log(chalk.green(`✓ Removed alias "${shortAlias}"`));
    } else {
      exitWithError('Failed to remove alias', ExitCode.GeneralError);
    }
  } catch (error) {
    handleError(error, 'Failed to remove alias');
  }
}

/**
 * Resolve an alias to its target command name
 * If the name is an alias, returns the target command name
 * If not an alias, returns the original name
 * @param name - The name to resolve (could be an alias or a command name)
 * @returns The resolved command name
 */
export function resolveAlias(name: string): string {
  const mappings = loadAliasMappings();
  return mappings[name] || name;
}

/**
 * Check if a name is an alias
 * @param name - The name to check
 * @returns true if it's an alias, false otherwise
 */
export function isAlias(name: string): boolean {
  const mappings = loadAliasMappings();
  return name in mappings;
}
