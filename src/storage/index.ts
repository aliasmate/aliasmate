import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface CommandAlias {
  command: string;
  directory: string;
  createdAt: string;
  updatedAt: string;
}

export interface AliasConfig {
  [name: string]: CommandAlias;
}

/**
 * Get the config directory path
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
 */
export function getConfigPath(): string {
  return path.join(getConfigDir(), 'config.json');
}

/**
 * Load all saved aliases
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
 * Save all aliases
 */
export function saveAliases(aliases: AliasConfig): boolean {
  const configPath = getConfigPath();
  
  try {
    fs.writeFileSync(configPath, JSON.stringify(aliases, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing config file:', (error as Error).message);
    return false;
  }
}

/**
 * Get a specific alias
 */
export function getAlias(name: string): CommandAlias | undefined {
  const aliases = loadAliases();
  return aliases[name];
}

/**
 * Set/update an alias
 */
export function setAlias(name: string, command: string, directory: string): boolean {
  const aliases = loadAliases();
  aliases[name] = {
    command,
    directory,
    createdAt: aliases[name]?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  return saveAliases(aliases);
}

/**
 * Delete an alias
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
 * Check if alias exists
 */
export function aliasExists(name: string): boolean {
  const aliases = loadAliases();
  return name in aliases;
}
