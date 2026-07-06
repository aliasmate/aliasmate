import * as readline from 'readline';
import { planRun, executePlan, finalCommand, RunPlan } from '../core/runner';
import { maskSensitive } from '../core/env';
import { prettyPath } from '../ui/format';
import { theme, icons, warn } from '../ui/theme';

export interface RunOptions {
  dryRun?: boolean;
  verbose?: boolean;
  /** Extra args (after --) appended to the command. */
  extraArgs?: string[];
}

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function collectPlaceholders(plan: RunPlan): Promise<Record<string, string>> {
  if (plan.placeholders.length === 0) return {};
  if (!process.stdin.isTTY) {
    throw new Error(
      `Command has placeholders (${plan.placeholders.map((p) => `{{${p}}}`).join(', ')}) that need an interactive terminal`
    );
  }
  const values: Record<string, string> = {};
  for (const name of plan.placeholders) {
    values[name] = (await ask(`${theme.accent('?')} ${theme.faint(name)} `)).trim();
  }
  return values;
}

function printDryRun(plan: RunPlan, command: string, verbose: boolean): void {
  const label = (t: string) => theme.faint(t.padEnd(9));
  console.log(
    `\n${icons.dot} ${theme.heading(plan.name)} ${theme.dim('· dry run — nothing will execute')}\n`
  );
  if (plan.saved.steps?.length) {
    console.log(`  ${label('chain')}${plan.saved.steps.join(theme.faint(' → '))}`);
  } else {
    console.log(`  ${label('command')}${command}`);
  }
  console.log(`  ${label('where')}${theme.dim(`${prettyPath(plan.cwd)} (${plan.cwdSource})`)}`);
  const env = plan.saved.env ?? {};
  const envCount = Object.keys(env).length;
  if (envCount > 0) {
    console.log(`  ${label('env')}${theme.dim(`${envCount} variable${envCount > 1 ? 's' : ''}`)}`);
    if (verbose) {
      for (const [k, v] of Object.entries(maskSensitive(env))) {
        console.log(`  ${' '.repeat(9)}${theme.dim(`${k}=${v}`)}`);
      }
    }
  }
  for (const danger of plan.dangers) {
    warn(`looks dangerous: ${danger}`);
  }
  console.log(theme.faint('\n  run without --dry-run to execute'));
}

export async function runHandler(
  name: string,
  pathOverride: string | undefined,
  options: RunOptions
): Promise<void> {
  const plan = planRun(name, pathOverride, options.extraArgs ?? []);

  if (options.dryRun) {
    printDryRun(plan, finalCommand(plan), options.verbose ?? false);
    return;
  }

  const values = await collectPlaceholders(plan);
  const command = finalCommand(plan, values);

  if (plan.saved.steps?.length) {
    console.log(
      `${icons.dot} ${theme.heading(plan.name)} ${theme.faint('·')} ${theme.dim(`chain of ${plan.saved.steps.length}`)}`
    );
  } else {
    console.log(
      `${icons.dot} ${theme.heading(plan.name)} ${theme.faint('·')} ${theme.dim(command)}`
    );
    console.log(`  ${theme.faint(prettyPath(plan.cwd))}`);
  }
  console.log();
  for (const danger of plan.dangers) {
    warn(`looks dangerous: ${danger}`);
  }

  const result = await executePlan(plan, values, (step, index, total) => {
    console.log(`${theme.accent(`[${index + 1}/${total}]`)} ${theme.heading(step)}`);
  });

  if (result.success) {
    console.log(`\n${icons.ok} ${theme.faint(`done · ${(result.durationMs / 1000).toFixed(1)}s`)}`);
  } else {
    const failedStep = result.steps?.find((s) => !s.result.success);
    const at = failedStep ? ` at ${theme.heading(failedStep.step)}` : '';
    console.error(
      `\n${icons.fail} ${theme.error(`exit ${result.exitCode}`)}${at} ${theme.faint(`· ${(result.durationMs / 1000).toFixed(1)}s`)}`
    );
    process.exitCode = result.exitCode;
  }
}
