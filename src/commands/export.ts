import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { loadAliases } from '../storage';

export function exportCommand(filePath: string): void {
  try {
    const aliases = loadAliases();
    const names = Object.keys(aliases);
    
    if (names.length === 0) {
      console.log(chalk.yellow('No saved commands to export.'));
      return;
    }
    
    // Resolve the file path
    const resolvedPath = path.resolve(filePath);
    
    // Export as JSON
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      aliases: aliases
    };
    
    try {
      fs.writeFileSync(resolvedPath, JSON.stringify(exportData, null, 2), 'utf8');
      console.log(chalk.green(`✓ Exported ${names.length} command(s) to ${resolvedPath}`));
    } catch (writeError) {
      console.error(chalk.red('Error: Could not write to file'), (writeError as Error).message);
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('Error:'), (error as Error).message);
    process.exit(1);
  }
}
