import * as path from 'path';
import { resolveName } from './commands';
import { listEffectiveCommands } from './project';
import { getRecentNames, recordExecution } from './recent';
import { executeCommand } from './executor';
import { validateSavedCommand, getDangerWarnings } from './validate';
import { ExecutionResult, SavedCommand } from './types';

export interface RunPlan {
  name: string;
  saved: SavedCommand;
  cwd: string;
  cwdSource: 'saved' | 'current' | 'override';
  dangers: string[];
  /** Extra CLI args (after --) appended to the command line. */
  extraArgs: string[];
  /** Distinct {{placeholder}} names found in the command text. */
  placeholders: string[];
}

const PLACEHOLDER = /\{\{\s*([A-Za-z_][A-Za-z0-9_-]*)\s*\}\}/g;

export function findPlaceholders(command: string): string[] {
  const names = new Set<string>();
  for (const match of command.matchAll(PLACEHOLDER)) names.add(match[1]);
  return [...names];
}

export function fillPlaceholders(command: string, values: Record<string, string>): string {
  return command.replace(PLACEHOLDER, (_, name: string) => values[name] ?? '');
}

/** Resolve a name (or alias or @N) into a concrete execution plan. */
export function planRun(
  nameInput: string,
  pathOverride?: string,
  extraArgs: string[] = []
): RunPlan {
  const effective = listEffectiveCommands();
  const name = effective.commands[nameInput] ? nameInput : resolveName(nameInput, getRecentNames());
  if (!name) {
    throw new Error(
      nameInput.startsWith('@')
        ? `No recent command at ${nameInput}. Run "aliasmate recent" to see history.`
        : `Command "${nameInput}" not found. Run "aliasmate list" to see saved commands.`
    );
  }
  const saved = effective.commands[name];
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

  return {
    name,
    saved,
    cwd,
    cwdSource,
    dangers: getDangerWarnings(saved.command),
    extraArgs,
    placeholders: saved.steps?.length ? [] : findPlaceholders(saved.command),
  };
}

/** Compose the final command line from plan + placeholder values + extra args. */
export function finalCommand(plan: RunPlan, values: Record<string, string> = {}): string {
  let cmd =
    plan.placeholders.length > 0
      ? fillPlaceholders(plan.saved.command, values)
      : plan.saved.command;
  if (plan.extraArgs.length > 0) cmd = `${cmd} ${plan.extraArgs.join(' ')}`;
  return cmd;
}

export interface StepOutcome {
  step: string;
  result: ExecutionResult;
}

/**
 * Execute a plan, recording it in the usage history.
 * Chains (saved.steps) run each referenced command sequentially in its own
 * directory/env, stopping at the first failure.
 */
export async function executePlan(
  plan: RunPlan,
  values: Record<string, string> = {},
  onStep?: (step: string, index: number, total: number) => void
): Promise<ExecutionResult & { steps?: StepOutcome[] }> {
  if (plan.saved.steps?.length) {
    const outcomes: StepOutcome[] = [];
    const started = Date.now();
    for (let i = 0; i < plan.saved.steps.length; i++) {
      const stepName = plan.saved.steps[i];
      const stepPlan = planRun(stepName);
      onStep?.(stepName, i, plan.saved.steps!.length);
      const result = await runSingle(stepPlan, stepPlan.saved.command);
      outcomes.push({ step: stepName, result });
      if (!result.success) {
        const total = {
          success: false,
          exitCode: result.exitCode,
          durationMs: Date.now() - started,
        };
        recordExecution(plan.name, total);
        return { ...total, steps: outcomes };
      }
    }
    const total = { success: true, exitCode: 0, durationMs: Date.now() - started };
    recordExecution(plan.name, total);
    return { ...total, steps: outcomes };
  }

  const result = await runSingle(plan, finalCommand(plan, values));
  recordExecution(plan.name, { exitCode: result.exitCode, durationMs: result.durationMs });
  return result;
}

async function runSingle(plan: RunPlan, command: string): Promise<ExecutionResult> {
  const errors = validateSavedCommand({
    ...plan.saved,
    command,
    directory: plan.cwd,
    pathMode: 'saved',
  }).filter((issue) => issue.level === 'error');
  if (errors.length > 0) {
    throw new Error(errors.map((e) => e.message).join('; '));
  }
  return executeCommand(command, plan.cwd, plan.saved.env);
}
