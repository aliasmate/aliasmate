/**
 * Application constants
 */

export const APP_NAME = 'aliasmate';
export const APP_VERSION = '1.5.0';
export const CONFIG_DIR_NAME = '.config/aliasmate';
export const CONFIG_FILE_NAME = 'config.json';

/**
 * Help messages
 */
export const HELP_MESSAGES = {
  noCommands: 'No saved commands found.',
  useSaveOrPrev: 'Use "aliasmate save" or "aliasmate prev <name>" to save a command',
  useList: 'Use "aliasmate list" to see all saved commands',
  invalidName: 'Name cannot contain spaces',
  emptyValue: (field: string) => `${field} cannot be empty`,
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  saved: (name: string) => `Saved command as "${name}"`,
  deleted: (name: string) => `Deleted command "${name}"`,
  updated: (name: string) => `Updated command "${name}"`,
  exported: (count: number, path: string) => `Exported ${count} command(s) to ${path}`,
  importComplete: 'Import complete',
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  commandNotFound: (name: string) => `No saved command found with name "${name}"`,
  couldNotSave: 'Could not save command',
  couldNotDelete: 'Could not delete command',
  couldNotUpdate: 'Could not update command',
  couldNotRead: 'Could not read config file',
  couldNotWrite: 'Could not write to file',
  fileNotFound: (path: string) => `File not found: ${path}`,
  invalidJson: 'Could not parse file. Make sure it is valid JSON.',
  invalidFormat: 'Invalid file format. Expected an "aliases" object.',
  invalidAliasStructure: (name: string) =>
    `Invalid alias structure for "${name}". Missing required fields (command, directory).`,
  directoryNotFound: (path: string) => `Directory does not exist: ${path}`,
  historyNotAvailable: 'Could not retrieve previous command from history.',
  interactiveNotSupported: 'Interactive prompt not supported in this environment',
  emptyInput: (field: string) => `${field} cannot be empty`,
  invalidCharacters: (field: string) => `${field} contains invalid characters`,
} as const;
