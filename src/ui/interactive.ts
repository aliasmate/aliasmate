import inquirer from 'inquirer';
import autocomplete from 'inquirer-autocomplete-prompt';
import { listCommands } from '../core/commands';
import { getUsageStats } from '../core/recent';
import { truncate, prettyPath, timeAgo } from './format';
import { theme, icons } from './theme';

inquirer.registerPrompt('autocomplete', autocomplete);

/** Simple subsequence fuzzy match: every query char appears in order. */
export function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let i = 0;
  for (const ch of t) {
    if (ch === q[i]) i++;
    if (i === q.length) return true;
  }
  return q.length === 0;
}

function banner(commandCount: number, totalRuns: number): void {
  const label = ` ⚡ AliasMate `;
  const stats = ` ${commandCount} commands · ${totalRuns} runs `;
  const width = label.length + stats.length + 2;
  console.log();
  console.log(theme.dim(`  ╭${'─'.repeat(width)}╮`));
  console.log(`  ${theme.dim('│')} ${theme.brand(label)}${theme.dim(stats)} ${theme.dim('│')}`);
  console.log(theme.dim(`  ╰${'─'.repeat(width)}╯`));
  console.log();
}

interface PickChoice {
  name: string;
  value: string;
  short: string;
}

function commandChoices(): PickChoice[] {
  const commands = listCommands();
  const stats = getUsageStats();
  const counts = new Map(stats.map((s) => [s.name, s.runCount]));
  const lastRuns = new Map(stats.map((s) => [s.name, s.lastRunAt]));
  const names = Object.keys(commands).sort(
    (a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || a.localeCompare(b)
  );
  const nameWidth = Math.min(Math.max(...names.map((n) => n.length), 4) + 2, 24);

  return names.map((name) => {
    const cmd = commands[name];
    const runs = counts.get(name) ?? 0;
    const last = lastRuns.get(name);
    const where =
      (cmd.pathMode ?? 'saved') === 'current' ? 'current dir' : prettyPath(cmd.directory);
    const meta = [runs > 0 ? `${icons.fire} ${runs}` : '', last ? timeAgo(last) : '']
      .filter(Boolean)
      .join(' · ');
    return {
      name:
        `${theme.name(name.padEnd(nameWidth))}` +
        `${truncate(cmd.command, 44).padEnd(46)}` +
        `${theme.dim(truncate(where, 24))}${meta ? theme.dim(`  ${meta}`) : ''}`,
      value: name,
      short: name,
    };
  });
}

async function pickCommand(message: string): Promise<string | null> {
  const choices = commandChoices();
  if (choices.length === 0) return null;

  const back = { name: theme.dim('← Back'), value: '__back__', short: 'back' };
  const { picked } = await inquirer.prompt<{ picked: string }>([
    {
      // Type to fuzzy-filter, arrows to move, Enter to select.
      type: 'autocomplete',
      name: 'picked',
      message,
      pageSize: 14,
      source: (_answers: unknown, input?: string) => {
        const filtered = input
          ? choices.filter((c) => fuzzyMatch(input, `${c.value} ${c.name}`))
          : choices;
        return Promise.resolve([...filtered, back]);
      },
    } as never,
  ]);
  return picked === '__back__' ? null : picked;
}

async function pressEnterToContinue(): Promise<void> {
  await inquirer.prompt([
    { type: 'input', name: 'x', message: theme.dim('Press Enter to continue') },
  ]);
}

/**
 * The zero-args experience: a menu that makes running your most-used
 * commands a two-keystroke habit.
 */
export async function interactiveHome(): Promise<void> {
  // Lazy imports keep the plain-command startup path fast.
  const { runHandler } = await import('../cli/run');
  const { saveHandler } = await import('../cli/save');
  const { editHandler, deleteHandler, statsHandler, listHandler } = await import('../cli/manage');

  for (;;) {
    const commands = listCommands();
    const totalRuns = getUsageStats().reduce((sum, s) => sum + s.runCount, 0);
    banner(Object.keys(commands).length, totalRuns);

    const hasCommands = Object.keys(commands).length > 0;
    const { action } = await inquirer.prompt<{ action: string }>([
      {
        type: 'list',
        name: 'action',
        message: 'What do you want to do?',
        loop: false,
        choices: [
          ...(hasCommands
            ? [
                { name: `${icons.run} Run a command`, value: 'run' },
                { name: '📋 Browse all commands', value: 'list' },
              ]
            : []),
          { name: `${icons.spark} Save a new command`, value: 'save' },
          ...(hasCommands
            ? [
                { name: '✏️  Edit a command', value: 'edit' },
                { name: '🗑  Delete a command', value: 'delete' },
                { name: '📊 View stats', value: 'stats' },
              ]
            : []),
          new inquirer.Separator() as never,
          { name: theme.dim('Quit'), value: 'quit' },
        ],
      },
    ]);

    try {
      if (action === 'quit') return;
      if (action === 'save') {
        await saveHandler({});
        await pressEnterToContinue();
      }
      if (action === 'list') {
        listHandler('table');
        await pressEnterToContinue();
      }
      if (action === 'stats') {
        statsHandler();
        await pressEnterToContinue();
      }
      if (action === 'run') {
        const name = await pickCommand('Run which command? (type to filter)');
        if (name) {
          await runHandler(name, undefined, {});
          return; // Hand the terminal back after a run.
        }
      }
      if (action === 'edit') {
        const name = await pickCommand('Edit which command? (type to filter)');
        if (name) {
          await editHandler(name, {});
          await pressEnterToContinue();
        }
      }
      if (action === 'delete') {
        const name = await pickCommand('Delete which command? (type to filter)');
        if (name) await deleteHandler(name, {});
      }
    } catch (error) {
      console.error(theme.error(`\n${(error as Error).message}`));
      await pressEnterToContinue();
    }
  }
}
