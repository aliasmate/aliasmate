import * as path from 'path';
import { getCommand, resolveName } from './commands';
import { getRecentNames, recordExecution } from './recent';
import { executeCommand } from './executor';
import { validateSavedCommand, getDangerWarnings } from './validate';
import { SavedCommand } from './types';

export interface RunPlan {
  name: string;
  saved: SavedCommand;
  cwd: string;
  cwdSource: 'saved' | 'current' | 'override';
  dangers: string[];
}

/** Resolve a name (or alias or @N) into a concrete execution plan. */
export function planRun(nameInput: string, pathOverride?: string): RunPlan {
  const name = resolveName(nameInput, getRecentNames());
  if (!name) {
    throw new Error(
      nameInput.startsWith('@')
        ? `No recent command at ${nameInput}. Run "aliasmate recent" to see history.`
        : `Command "${nameInput}" not found. Run "aliasmate list" to see saved commands.`
    );
  }
  const saved = getCommand(name);
  if (!saved) throw new Error(`Command "${name}" not found`);

  let cwd: string;
  let cwdSource: RunPlan['cwdSource'];
  if (pathOverride) {
    cwd = path.resolve(pathOverride);
    cwdSource = 'override';
  } else if ((saved.pathMode ?? 'saved') === 'current') {
    cwd = process.cwd();
    cwdSource = 'current';
  } else {
    cwd = saved.directory;
    cwdSource = 'saved';
  }

  return { name, saved, cwd, cwdSource, dangers: getDangerWarnings(saved.command) };
}

/** Execute a plan, recording it in the usage history. */
export async function executePlan(plan: RunPlan) {
  const errors = validateSavedCommand({
    ...plan.saved,
    directory: plan.cwd,
    pathMode: 'saved',
  }).filter((issue) => issue.level === 'error');
  if (errors.length > 0) {
    throw new Error(errors.map((e) => e.message).join('; '));
  }
  recordExecution(plan.name);
  return executeCommand(plan.saved.command, plan.cwd, plan.saved.env);
}
