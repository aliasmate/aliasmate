import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { loadAliases } from '../storage';
import { handleError, exitWithError, ExitCode } from '../utils/errors';
import { SUCCESS_MESSAGES, ERROR_MESSAGES, HELP_MESSAGES } from '../utils/constants';
import { formatAsYAML } from '../utils/formatters';

/**
 * Export all saved commands to a file
 *
 * Creates a portable backup of all commands with metadata, suitable for:
 * - Sharing with team members
 * - Backing up your command library
 * - Migrating between machines
 *
 * @param filePath - The path where the export file should be created
 * @param format - Output format: 'json' (default) or 'yaml'
 *
 * @example
 * ```
 * // Export to JSON file
 * exportCommand('./my-commands.json');
 * // Output: ✓ Exported 15 command(s) to /path/to/my-commands.json
 *
 * // Export to YAML file
 * exportCommand('./my-commands.yaml', 'yaml');
 * ```
 */
export function exportCommand(filePath: string, format: 'json' | 'yaml' = 'json'): void {
  try {
    // Validate file path
    if (!filePath || !filePath.trim()) {
      exitWithError('File path cannot be empty', ExitCode.InvalidInput);
    }

    const aliases = loadAliases();
    const names = Object.keys(aliases);

    if (names.length === 0) {
      console.log(chalk.yellow(HELP_MESSAGES.noCommands));
      return;
    }

    // Resolve the file path
    const resolvedPath = path.resolve(filePath);

    // Check if file already exists and warn user
    if (fs.existsSync(resolvedPath)) {
      console.log(
        chalk.yellow(`Warning: File already exists and will be overwritten: ${resolvedPath}`)
      );
    }

    // Ensure directory exists
    const dirPath = path.dirname(resolvedPath);
    if (!fs.existsSync(dirPath)) {
      try {
        fs.mkdirSync(dirPath, { recursive: true });
      } catch (mkdirError) {
        exitWithError(
          `Could not create directory: ${(mkdirError as Error).message}`,
          ExitCode.PermissionDenied
        );
      }
    }

    // Export in the specified format
    let content: string;

    if (format === 'yaml') {
      content = formatAsYAML(aliases);
    } else {
      // JSON format with metadata
      const exportData = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        aliases: aliases,
      };
      content = JSON.stringify(exportData, null, 2);
    }

    try {
      fs.writeFileSync(resolvedPath, content, 'utf8');
      console.log(chalk.green(`✓ ${SUCCESS_MESSAGES.exported(names.length, resolvedPath)}`));
    } catch (writeError) {
      exitWithError(
        `${ERROR_MESSAGES.couldNotWrite}: ${(writeError as Error).message}`,
        ExitCode.PermissionDenied
      );
    }
  } catch (error) {
    handleError(error, 'Failed to export commands');
  }
}
