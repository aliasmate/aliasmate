import * as fs from 'fs';
import * as path from 'path';
import { CommandMap, SavedCommand } from '../core/types';
import { listCommands, saveCommand, commandExists } from '../core/commands';
import { toJson, toYaml } from '../ui/format';
import { getConfigDir } from '../core/store';
import { ok, fail, warn, theme } from '../ui/theme';

export function exportHandler(file: string, options: { format?: string }): void {
  const commands = listCommands();
  if (Object.keys(commands).length === 0) {
    warn('No commands to export');
    return;
  }
  const format =
    options.format ?? (file.endsWith('.yaml') || file.endsWith('.yml') ? 'yaml' : 'json');
  const content = format === 'yaml' ? toYaml(commands) : toJson(commands);
  fs.writeFileSync(path.resolve(file), content, 'utf8');
  ok(`Exported ${Object.keys(commands).length} commands to ${theme.name(file)}`);
  console.log(theme.dim('  Sensitive env values were masked for safe sharing.'));
}

function isValidEntry(value: unknown): value is SavedCommand {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as SavedCommand).command === 'string' &&
    typeof (value as SavedCommand).directory === 'string'
  );
}

export async function importHandler(file: string): Promise<void> {
  const resolved = path.resolve(file);
  if (!fs.existsSync(resolved)) {
    fail(`File not found: ${file}`);
    process.exitCode = 1;
    return;
  }

  let incoming: CommandMap;
  try {
    incoming = JSON.parse(fs.readFileSync(resolved, 'utf8')) as CommandMap;
  } catch {
    fail('Could not parse the import file (JSON expected)');
    process.exitCode = 1;
    return;
  }

  // Back up current config before touching anything.
  const existing = listCommands();
  if (Object.keys(existing).length > 0) {
    const backup = path.join(getConfigDir(), `backup-${Date.now()}.json`);
    fs.writeFileSync(backup, JSON.stringify(existing, null, 2), 'utf8');
    console.log(theme.dim(`Backup written to ${backup}`));
  }

  let imported = 0;
  let skipped = 0;
  for (const [name, entry] of Object.entries(incoming)) {
    if (!isValidEntry(entry)) {
      warn(`Skipping "${name}": invalid entry`);
      skipped++;
      continue;
    }
    if (commandExists(name)) {
      // Prompting is only possible on a TTY; in scripts, keep existing entries.
      if (!process.stdin.isTTY) {
        warn(`Skipping "${name}": already exists (non-interactive)`);
        skipped++;
        continue;
      }
      const { confirm } = await import('../ui/prompts');
      const overwrite = await confirm(`"${name}" already exists. Overwrite?`);
      if (!overwrite) {
        skipped++;
        continue;
      }
    }
    saveCommand({
      name,
      command: entry.command,
      directory: entry.directory,
      pathMode: entry.pathMode,
      env: entry.env,
    });
    imported++;
  }
  ok(
    `Imported ${imported} command${imported === 1 ? '' : 's'}${skipped ? theme.dim(` (${skipped} skipped)`) : ''}`
  );
}
