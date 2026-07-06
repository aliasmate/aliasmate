import { CommandMap, ListFormat } from '../core/types';
import {
  listCommands,
  getCommand,
  deleteCommand,
  searchCommands,
  listAliases,
  setShortcutAlias,
  removeShortcutAlias,
} from '../core/commands';
import { getUsageStats, getExecutionHistory, clearExecutionHistory } from '../core/recent';
import { validateSavedCommand } from '../core/validate';
import { render, timeAgo, truncate } from '../ui/format';
import { theme, icons, ok, fail, warn } from '../ui/theme';

function usageMaps(): { runCounts: Map<string, number>; lastRuns: Map<string, string> } {
  const stats = getUsageStats();
  return {
    runCounts: new Map(stats.map((s) => [s.name, s.runCount])),
    lastRuns: new Map(stats.map((s) => [s.name, s.lastRunAt])),
  };
}

export function listHandler(format: ListFormat): void {
  const commands = listCommands();
  const count = Object.keys(commands).length;
  if (count === 0) {
    console.log(theme.dim('No saved commands yet.'));
    console.log(
      `\n${icons.spark} Save your last command with ${theme.name('aliasmate prev <name>')}`
    );
    return;
  }
  if (format === 'table') {
    console.log(
      `\n${theme.brand('⚡ AliasMate')} ${theme.dim(`· ${count} command${count > 1 ? 's' : ''}`)}\n`
    );
  }
  console.log(render(commands, format, usageMaps()));
  if (format === 'table') {
    console.log(theme.dim('\n  ⁺N = saved env vars · run with: aliasmate run <name>'));
  }
}

export function searchHandler(query: string): void {
  const matches = searchCommands(query);
  const count = Object.keys(matches).length;
  if (count === 0) {
    console.log(theme.dim(`No commands match "${query}".`));
    return;
  }
  console.log(
    `\n${theme.brand('⚡')} ${theme.heading(`${count} match${count > 1 ? 'es' : ''} for "${query}"`)}\n`
  );
  console.log(render(matches, 'table', usageMaps()));
}

export async function deleteHandler(name: string, options: { force?: boolean }): Promise<void> {
  const cmd = getCommand(name);
  if (!cmd) {
    fail(`Command "${name}" not found`);
    process.exitCode = 1;
    return;
  }
  if (!options.force) {
    const { confirm } = await import('../ui/prompts');
    const yes = await confirm(`Delete "${name}" (${truncate(cmd.command, 60)})?`);
    if (!yes) {
      console.log(theme.dim('Cancelled.'));
      return;
    }
  }
  deleteCommand(name);
  ok(`Deleted ${theme.name(name)}`);
}

export async function editHandler(name: string, options: { validate?: boolean }): Promise<void> {
  const existing = getCommand(name);
  if (!existing) {
    fail(`Command "${name}" not found`);
    process.exitCode = 1;
    return;
  }
  const { promptCommandDetails } = await import('../ui/prompts');
  const details = await promptCommandDetails({ name, ...existing }, process.cwd());
  const { saveCommand } = await import('../core/commands');
  saveCommand(details);
  if (options.validate !== false) {
    for (const issue of validateSavedCommand(getCommand(name)!)) warn(issue.message);
  }
  ok(`Updated ${theme.name(name)}`);
}

export function aliasHandler(
  shortAlias: string | undefined,
  commandName: string | undefined,
  options: { list?: boolean; remove?: string }
): void {
  if (options.remove) {
    if (removeShortcutAlias(options.remove)) ok(`Removed alias ${theme.name(options.remove)}`);
    else {
      fail(`Alias "${options.remove}" not found`);
      process.exitCode = 1;
    }
    return;
  }
  if (shortAlias && commandName) {
    setShortcutAlias(shortAlias, commandName);
    ok(`${theme.name(shortAlias)} ${theme.dim('→')} ${commandName}`);
    return;
  }
  const aliases = listAliases();
  const names = Object.keys(aliases).sort();
  if (names.length === 0) {
    console.log(theme.dim('No aliases yet. Create one with: aliasmate alias <short> <command>'));
    return;
  }
  console.log(theme.heading(`\nAliases (${names.length}):\n`));
  for (const a of names) console.log(`  ${theme.name(a)} ${theme.dim('→')} ${aliases[a]}`);
}

export function recentHandler(options: { limit?: number; clear?: boolean }): void {
  if (options.clear) {
    clearExecutionHistory();
    ok('Execution history cleared');
    return;
  }
  const stats = getUsageStats();
  const history = getExecutionHistory();
  if (history.length === 0) {
    console.log(theme.dim('No commands run yet.'));
    return;
  }
  const seen = new Set<string>();
  const rows: Array<{ name: string; at: string }> = [];
  for (const entry of history) {
    if (seen.has(entry.commandName)) continue;
    seen.add(entry.commandName);
    rows.push({ name: entry.commandName, at: entry.executedAt });
    if (rows.length >= (options.limit ?? 15)) break;
  }
  const counts = new Map(stats.map((s) => [s.name, s.runCount]));
  console.log(theme.heading('\nRecent commands:\n'));
  rows.forEach((row, i) => {
    const runs = counts.get(row.name) ?? 0;
    console.log(
      `  ${theme.accent(`@${i}`)}  ${theme.name(row.name.padEnd(20))} ${theme.dim(
        `${timeAgo(row.at)} · ${runs} run${runs === 1 ? '' : 's'}`
      )}`
    );
  });
  console.log(theme.dim('\nRe-run instantly: aliasmate run @0'));
}

export function statsHandler(): void {
  const stats = getUsageStats();
  const commands = listCommands();
  const total = getExecutionHistory().length;
  console.log(theme.heading('\n📊 Your AliasMate stats\n'));
  console.log(`  ${theme.dim('Saved commands:')} ${Object.keys(commands).length}`);
  console.log(`  ${theme.dim('Total runs:')}     ${total}\n`);
  const top = stats.slice(0, 10);
  if (top.length === 0) {
    console.log(theme.dim('  Run something to start building stats!'));
    return;
  }
  console.log(theme.heading('  Most used:\n'));
  const max = top[0].runCount;
  for (const s of top) {
    const bar = '█'.repeat(Math.max(1, Math.round((s.runCount / max) * 20)));
    console.log(
      `  ${theme.name(s.name.padEnd(20))} ${theme.accent(bar)} ${s.runCount}  ${theme.dim(timeAgo(s.lastRunAt))}`
    );
  }
}

export function validateHandler(name?: string): void {
  const commands: CommandMap = name
    ? getCommand(name)
      ? { [name]: getCommand(name)! }
      : {}
    : listCommands();
  if (name && Object.keys(commands).length === 0) {
    fail(`Command "${name}" not found`);
    process.exitCode = 1;
    return;
  }
  let passed = 0;
  let failed = 0;
  for (const [cmdName, cmd] of Object.entries(commands)) {
    const issues = validateSavedCommand(cmd);
    if (issues.length === 0) {
      passed++;
      continue;
    }
    failed++;
    console.log(`\n${theme.name(cmdName)}`);
    for (const issue of issues) {
      if (issue.level === 'error') console.log(`  ${icons.fail} ${theme.error(issue.message)}`);
      else console.log(`  ${icons.warn} ${theme.warning(issue.message)}`);
    }
  }
  console.log(
    `\n${icons.ok} ${passed} passed${failed > 0 ? `, ${icons.warn} ${failed} with issues` : ''}`
  );
}
