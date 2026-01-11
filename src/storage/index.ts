import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Represents a saved command alias with its metadata
 */
export interface CommandAlias {
  /** The shell command to execute */
  command: string;
  /** The working directory where the command should be executed */
  directory: string;
  /** ISO 8601 timestamp when the command was created */
  createdAt: string;
  /** ISO 8601 timestamp when the command was last modified */
  updatedAt: string;
}

/**
 * Configuration object containing all saved command aliases
 */
export interface AliasConfig {
  [name: string]: CommandAlias;
}

/**
 * Get the config directory path, creating it if it doesn't exist
 * @returns The absolute path to the config directory
 */
export function getConfigDir(): string {
  const homeDir = os.homedir();
  const configDir = path.join(homeDir, '.config', 'aliasmate');

  // Create directory if it doesn't exist
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  return configDir;
}

/**
 * Get the config file path
 * @returns The absolute path to the config.json file
 */
export function getConfigPath(): string {
  return path.join(getConfigDir(), 'config.json');
}

/**
 * Load all saved aliases from the config file
 * @returns The alias configuration object, or an empty object if the file doesn't exist
 */
export function loadAliases(): AliasConfig {
  const configPath = getConfigPath();

  if (!fs.existsSync(configPath)) {
    return {};
  }

  try {
    const data = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(data) as AliasConfig;
  } catch (error) {
    console.error('Error reading config file:', (error as Error).message);
    return {};
  }
}

/**
 * Save all aliases to the config file
 * Uses atomic write pattern to prevent data corruption
 * @param aliases - The alias configuration to save
 * @returns true if successful, false otherwise
 */
export function saveAliases(aliases: AliasConfig): boolean {
  const configPath = getConfigPath();
  const tempPath = `${configPath}.tmp`;

  try {
    // Write to temporary file first
    fs.writeFileSync(tempPath, JSON.stringify(aliases, null, 2), 'utf8');
    // Atomic rename
    fs.renameSync(tempPath, configPath);
    return true;
  } catch (error) {
    console.error('Error writing config file:', (error as Error).message);
    // Clean up temp file if it exists
    try {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch {
      // Ignore cleanup errors
    }
    return false;
  }
}

/**
 * Get a specific alias by name
 * @param name - The name of the alias to retrieve
 * @returns The command alias if found, undefined otherwise
 */
export function getAlias(name: string): CommandAlias | undefined {
  const aliases = loadAliases();
  return aliases[name];
}

/**
 * Set or update an alias
 * @param name - The name of the alias
 * @param command - The shell command to save
 * @param directory - The working directory for the command
 * @returns true if successful, false otherwise
 * @throws {Error} If the directory doesn't exist or isn't accessible
 */
export function setAlias(name: string, command: string, directory: string): boolean {
  // Validate inputs
  if (!name || !name.trim()) {
    throw new Error('Alias name cannot be empty');
  }
  if (!command || !command.trim()) {
    throw new Error('Command cannot be empty');
  }
  if (!directory || !directory.trim()) {
    throw new Error('Directory cannot be empty');
  }

  // Validate directory exists (warning only, don't block)
  if (!fs.existsSync(directory)) {
    console.warn(`Warning: Directory does not exist: ${directory}`);
  }

  const aliases = loadAliases();
  aliases[name] = {
    command: command.trim(),
    directory: path.resolve(directory),
    createdAt: aliases[name]?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return saveAliases(aliases);
}

/**
 * Delete an alias by name
 * @param name - The name of the alias to delete
 * @returns true if the alias was deleted, false if it didn't exist
 */
export function deleteAlias(name: string): boolean {
  const aliases = loadAliases();
  if (!(name in aliases)) {
    return false;
  }
  delete aliases[name];
  return saveAliases(aliases);
}

/**
 * Check if an alias exists
 * @param name - The name of the alias to check
 * @returns true if the alias exists, false otherwise
 */
export function aliasExists(name: string): boolean {
  const aliases = loadAliases();
  return name in aliases;
}
