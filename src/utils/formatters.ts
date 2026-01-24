import chalk from 'chalk';
import * as fs from 'fs';
import { CommandAlias } from '../storage';

/**
 * Supported output formats
 */
export type OutputFormat = 'json' | 'yaml' | 'table' | 'compact';

/**
 * Validate if a string is a valid output format
 */
export function isValidFormat(format: string): format is OutputFormat {
  return ['json', 'yaml', 'table', 'compact'].includes(format);
}

/**
 * Format aliases as JSON
 */
export function formatAsJSON(
  aliases: Record<string, CommandAlias>,
  pretty: boolean = true
): string {
  return JSON.stringify(aliases, null, pretty ? 2 : 0);
}

/**
 * Format aliases as YAML
 */
export function formatAsYAML(aliases: Record<string, CommandAlias>): string {
  const yamlLines: string[] = [];

  for (const [name, alias] of Object.entries(aliases)) {
    yamlLines.push(`${name}:`);
    yamlLines.push(`  command: "${alias.command.replace(/"/g, '\\"')}"`);
    yamlLines.push(`  directory: "${alias.directory}"`);

    if (alias.pathMode) {
      yamlLines.push(`  pathMode: ${alias.pathMode}`);
    }

    if (alias.env && Object.keys(alias.env).length > 0) {
      yamlLines.push(`  env:`);
      for (const [key, value] of Object.entries(alias.env)) {
        const stringValue = String(value);
        yamlLines.push(`    ${key}: "${stringValue.replace(/"/g, '\\"')}"`);
      }
    }

    if (alias.createdAt) {
      yamlLines.push(`  createdAt: "${alias.createdAt}"`);
    }

    if (alias.updatedAt) {
      yamlLines.push(`  updatedAt: "${alias.updatedAt}"`);
    }

    yamlLines.push('');
  }

  return yamlLines.join('\n');
}

/**
 * Format aliases as a table (default human-readable format)
 */
export function formatAsTable(aliases: Record<string, CommandAlias>): string {
  const names = Object.keys(aliases).sort();

  if (names.length === 0) {
    return chalk.yellow('No saved commands found.');
  }

  const lines: string[] = [];
  lines.push(chalk.bold(`\nSaved commands (${names.length}):\n`));

  for (const name of names) {
    const alias = aliases[name];

    // Check if directory still exists
    const dirExists = fs.existsSync(alias.directory);
    const dirIndicator = dirExists ? '' : chalk.red(' [DIR NOT FOUND]');

    // Get path mode with backward compatibility
    const pathMode = alias.pathMode || 'saved';

    // Truncate long commands for display
    const maxCommandLength = 100;
    let displayCommand = alias.command;
    if (displayCommand.length > maxCommandLength) {
      const firstLine = displayCommand.split('\n')[0];
      if (firstLine.length > maxCommandLength) {
        displayCommand = firstLine.substring(0, maxCommandLength) + '...';
      } else {
        displayCommand = firstLine + ' [...]';
      }
    }

    lines.push(chalk.cyan(`  ${name}${dirIndicator}`));
    lines.push(chalk.gray(`    Command: ${displayCommand}`));
    lines.push(chalk.gray(`    Directory: ${alias.directory}`));
    lines.push(chalk.gray(`    Path Mode: ${pathMode === 'saved' ? '📁 Saved' : '📍 Current'}`));

    // Show env var count if any are saved
    if (alias.env && Object.keys(alias.env).length > 0) {
      lines.push(chalk.gray(`    Environment Variables: ${Object.keys(alias.env).length} saved`));
    }

    if (alias.createdAt) {
      lines.push(chalk.gray(`    Created: ${new Date(alias.createdAt).toLocaleString()}`));
    }

    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format aliases in compact format (one line per command)
 */
export function formatAsCompact(aliases: Record<string, CommandAlias>): string {
  const names = Object.keys(aliases).sort();

  if (names.length === 0) {
    return 'No saved commands found.';
  }

  const lines: string[] = [];

  for (const name of names) {
    const alias = aliases[name];
    const pathMode = alias.pathMode || 'saved';
    const envCount = alias.env ? Object.keys(alias.env).length : 0;

    // Truncate command for compact display
    let displayCommand = alias.command;
    const maxLength = 50;
    if (displayCommand.length > maxLength) {
      const firstLine = displayCommand.split('\n')[0];
      if (firstLine.length > maxLength) {
        displayCommand = firstLine.substring(0, maxLength) + '...';
      } else {
        displayCommand = firstLine + '...';
      }
    }

    // Format: name | command | directory | mode | envs
    const parts = [
      name.padEnd(20),
      displayCommand.padEnd(52),
      alias.directory.padEnd(30),
      pathMode.padEnd(7),
    ];

    if (envCount > 0) {
      parts.push(`${envCount} env var${envCount > 1 ? 's' : ''}`);
    }

    lines.push(parts.join(' | '));
  }

  return lines.join('\n');
}

/**
 * Format aliases based on the specified format
 */
export function formatAliases(
  aliases: Record<string, CommandAlias>,
  format: OutputFormat = 'table'
): string {
  switch (format) {
    case 'json':
      return formatAsJSON(aliases);
    case 'yaml':
      return formatAsYAML(aliases);
    case 'table':
      return formatAsTable(aliases);
    case 'compact':
      return formatAsCompact(aliases);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}
