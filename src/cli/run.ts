import { planRun, executePlan, RunPlan } from '../core/runner';
import { maskSensitive } from '../core/env';
import { prettyPath } from '../ui/format';
import { theme, icons, warn } from '../ui/theme';

export interface RunOptions {
  dryRun?: boolean;
  verbose?: boolean;
}

function printDryRun(plan: RunPlan, verbose: boolean): void {
  const label = (t: string) => theme.faint(t.padEnd(9));
  console.log(
    `\n${icons.dot} ${theme.heading(plan.name)} ${theme.dim('· dry run — nothing will execute')}\n`
  );
  console.log(`  ${label('command')}${plan.saved.command}`);
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
  const plan = planRun(name, pathOverride);

  if (options.dryRun) {
    printDryRun(plan, options.verbose ?? false);
    return;
  }

  console.log(
    `${icons.dot} ${theme.heading(plan.name)} ${theme.faint('·')} ${theme.dim(plan.saved.command)}`
  );
  console.log(`  ${theme.faint(prettyPath(plan.cwd))}\n`);
  for (const danger of plan.dangers) {
    warn(`looks dangerous: ${danger}`);
  }

  const result = await executePlan(plan);
  if (result.success) {
    console.log(`\n${icons.ok} ${theme.faint(`done · ${(result.durationMs / 1000).toFixed(1)}s`)}`);
  } else {
    console.error(
      `\n${icons.fail} ${theme.error(`exit ${result.exitCode}`)} ${theme.faint(`· ${(result.durationMs / 1000).toFixed(1)}s`)}`
    );
    process.exitCode = result.exitCode;
  }
}
