import inquirer from 'inquirer';
import { listCommands } from '../core/commands';
import { getUsageStats } from '../core/recent';
import { truncate } from './format';
import { theme, icons } from './theme';

type Action =
  | { kind: 'run'; name: string }
  | { kind: 'save' }
  | { kind: 'edit'; name: string }
  | { kind: 'delete'; name: string }
  | { kind: 'stats' }
  | { kind: 'quit' };

function banner(commandCount: number, totalRuns: number): void {
  console.log();
  console.log(theme.brand('  ⚡ AliasMate'));
  console.log(theme.dim(`  ${commandCount} saved commands · ${totalRuns} total runs`));
  console.log();
}

async function pickCommand(message: string): Promise<string | null> {
  const commands = listCommands();
  const counts = new Map(getUsageStats().map((s) => [s.name, s.runCount]));
  const names = Object.keys(commands).sort(
    (a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || a.localeCompare(b)
  );
  if (names.length === 0) return null;

  const { picked } = await inquirer.prompt<{ picked: string }>([
    {
      type: 'list',
      name: 'picked',
      message,
      pageSize: 12,
      loop: false,
      choices: [
        ...names.map((name) => {
          const runs = counts.get(name) ?? 0;
          const runsLabel = runs > 0 ? theme.dim(` · ${icons.fire} ${runs}`) : '';
          return {
            name: `${name.padEnd(18)} ${theme.dim(truncate(commands[name].command, 50))}${runsLabel}`,
            value: name,
            short: name,
          };
        }),
        new inquirer.Separator(),
        { name: theme.dim('← Back'), value: '__back__' },
      ],
    },
  ]);
  return picked === '__back__' ? null : picked;
}

/**
 * The zero-args experience: a menu that makes running your most-used
 * commands a two-keystroke habit.
 */
export async function interactiveHome(): Promise<void> {
  // Lazy imports keep the plain-command startup path fast.
  const { runHandler } = await import('../cli/run');
  const { saveHandler } = await import('../cli/save');
  const { editHandler, deleteHandler, statsHandler } = await import('../cli/manage');

  for (;;) {
    const commands = listCommands();
    const stats = getUsageStats();
    const totalRuns = stats.reduce((sum, s) => sum + s.runCount, 0);
    banner(Object.keys(commands).length, totalRuns);

    const hasCommands = Object.keys(commands).length > 0;
    const { action } = await inquirer.prompt<{ action: Action['kind'] }>([
      {
        type: 'list',
        name: 'action',
        message: 'What do you want to do?',
        loop: false,
        choices: [
          ...(hasCommands ? [{ name: `${icons.run} Run a command`, value: 'run' as const }] : []),
          { name: `${icons.spark} Save a new command`, value: 'save' as const },
          ...(hasCommands
            ? [
                { name: '✏️  Edit a command', value: 'edit' as const },
                { name: '🗑  Delete a command', value: 'delete' as const },
                { name: '📊 View stats', value: 'stats' as const },
              ]
            : []),
          new inquirer.Separator() as never,
          { name: theme.dim('Quit'), value: 'quit' as const },
        ],
      },
    ]);

    try {
      if (action === 'quit') return;
      if (action === 'save') await saveHandler({});
      if (action === 'stats') statsHandler();
      if (action === 'run') {
        const name = await pickCommand('Run which command?');
        if (name) {
          await runHandler(name, undefined, {});
          return; // Hand the terminal back after a run.
        }
      }
      if (action === 'edit') {
        const name = await pickCommand('Edit which command?');
        if (name) await editHandler(name, {});
      }
      if (action === 'delete') {
        const name = await pickCommand('Delete which command?');
        if (name) await deleteHandler(name, {});
      }
    } catch (error) {
      console.error(theme.error(`\n${(error as Error).message}`));
    }
  }
}
