import * as fs from 'fs';
import { listCommands, commandExists } from '../core/commands';
import { exportToFile, importFromFile, expandPath } from '../core/transfer';
import { toYaml } from '../ui/format';
import { ok, fail, warn, theme } from '../ui/theme';

export function exportHandler(file: string, options: { format?: string; full?: boolean }): void {
  const format =
    options.format ?? (file.endsWith('.yaml') || file.endsWith('.yml') ? 'yaml' : 'json');

  let count: number;
  if (format === 'yaml') {
    const commands = listCommands();
    count = Object.keys(commands).length;
    if (count === 0) {
      warn('No commands to export');
      return;
    }
    fs.writeFileSync(expandPath(file), toYaml(commands, !options.full), 'utf8');
  } else {
    count = exportToFile(file, { full: options.full });
  }

  ok(`Exported ${count} command${count === 1 ? '' : 's'} to ${theme.name(file)}`);
  if (options.full) {
    console.log(
      theme.warning('  Full export: secret env values are in PLAIN TEXT — keep this file safe.')
    );
  } else {
    console.log(theme.dim('  Sensitive env values were masked for safe sharing.'));
    console.log(theme.dim('  For a restorable backup with real secret values, use --full.'));
  }
}

export async function importHandler(file: string): Promise<void> {
  const resolved = expandPath(file);
  if (!fs.existsSync(resolved)) {
    fail(`File not found: ${file}`);
    process.exitCode = 1;
    return;
  }

  // Decide the conflict policy up front with a single confirmation.
  let overwrite = false;
  try {
    const incoming = JSON.parse(fs.readFileSync(resolved, 'utf8')) as Record<string, unknown>;
    const conflicts = Object.keys(incoming).filter((name) => commandExists(name));
    if (conflicts.length > 0 && process.stdin.isTTY && process.stdout.isTTY) {
      const { confirm } = await import('../ui/prompts');
      overwrite = await confirm(
        `${conflicts.length} command${conflicts.length === 1 ? '' : 's'} already exist (${conflicts
          .slice(0, 5)
          .join(', ')}${conflicts.length > 5 ? ', …' : ''}). Overwrite?`
      );
    }
  } catch {
    fail('Could not parse the import file (JSON expected)');
    process.exitCode = 1;
    return;
  }

  const result = importFromFile(file, { overwrite: () => overwrite });
  if (result.backup) console.log(theme.dim(`Backup written to ${result.backup}`));
  for (const name of result.invalid) warn(`Skipping "${name}": invalid entry`);
  const skippedNote =
    result.skipped.length > 0 ? theme.dim(` (${result.skipped.length} skipped)`) : '';
  ok(`Imported ${result.imported} command${result.imported === 1 ? '' : 's'}${skippedNote}`);
}
