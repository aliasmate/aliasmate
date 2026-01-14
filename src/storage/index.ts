import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Path mode determines where a command should be executed
 * - 'saved': Always run in the directory saved with the command
 * - 'current': Run in the user's current working directory
 */
export type PathMode = 'saved' | 'current';

/**
 * Represents a saved command alias with its metadata
 */
export interface CommandAlias {
  /** The shell command to execute */
  command: string;
  /** The working directory where the command should be executed */
  directory: string;
  /** Path mode: 'saved' (use stored directory) or 'current' (use current directory) */
  pathMode?: PathMode; // Optional for backward compatibility
  /** Environment variables to set when running the command */
  env?: Record<string, string>; // Optional for backward compatibility
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
 * Metadata storage for application state (non-alias data)
 */
export interface MetadataConfig {
  [key: string]: unknown;
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
 * Get the metadata file path
 * @returns The absolute path to the metadata.json file
 */
export function getMetadataPath(): string {
  return path.join(getConfigDir(), 'metadata.json');
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
 * @param pathMode - Optional path mode ('saved' or 'current'), defaults to 'saved'
 * @param env - Optional environment variables to save with the command
 * @returns true if successful, false otherwise
 * @throws {Error} If the directory doesn't exist or isn't accessible
 */
export function setAlias(
  name: string,
  command: string,
  directory: string,
  pathMode: PathMode = 'saved',
  env?: Record<string, string>
): boolean {
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
    pathMode,
    ...(env && Object.keys(env).length > 0 ? { env } : {}),
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

/**
 * Load metadata from the metadata file
 * @returns The metadata configuration object, or an empty object if the file doesn't exist
 */
export function loadMetadata(): MetadataConfig {
  const metadataPath = getMetadataPath();

  if (!fs.existsSync(metadataPath)) {
    return {};
  }

  try {
    const data = fs.readFileSync(metadataPath, 'utf8');
    return JSON.parse(data) as MetadataConfig;
  } catch (error) {
    console.error('Error reading metadata file:', (error as Error).message);
    return {};
  }
}

/**
 * Save metadata to the metadata file
 * Uses atomic write pattern to prevent data corruption
 * @param metadata - The metadata configuration to save
 * @returns true if successful, false otherwise
 */
export function saveMetadata(metadata: MetadataConfig): boolean {
  const metadataPath = getMetadataPath();
  const tempPath = `${metadataPath}.tmp`;

  try {
    // Write to temporary file first
    fs.writeFileSync(tempPath, JSON.stringify(metadata, null, 2), 'utf8');
    // Atomic rename
    fs.renameSync(tempPath, metadataPath);
    return true;
  } catch (error) {
    console.error('Error writing metadata file:', (error as Error).message);
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
 * Get a specific metadata value by key
 * @param key - The key to retrieve
 * @returns The metadata value if found, undefined otherwise
 */
export function getMetadata<T = unknown>(key: string): T | undefined {
  const metadata = loadMetadata();
  return metadata[key] as T | undefined;
}

/**
 * Set or update a metadata value
 * @param key - The key to set
 * @param value - The value to store
 * @returns true if successful, false otherwise
 */
export function setMetadata<T = unknown>(key: string, value: T): boolean {
  const metadata = loadMetadata();
  metadata[key] = value;
  return saveMetadata(metadata);
}
