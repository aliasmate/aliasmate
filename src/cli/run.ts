import { planRun, executePlan, RunPlan } from '../core/runner';
import { maskSensitive } from '../core/env';
import { theme, icons, warn } from '../ui/theme';

export interface RunOptions {
  dryRun?: boolean;
  verbose?: boolean;
}

function printDryRun(plan: RunPlan, verbose: boolean): void {
  console.log(theme.heading('\n🔍 Dry run — nothing will be executed\n'));
  console.log(`  ${theme.dim('Command:')}   ${plan.saved.command}`);
  console.log(`  ${theme.dim('Directory:')} ${plan.cwd} ${theme.dim(`(${plan.cwdSource})`)}`);
  const env = plan.saved.env ?? {};
  const envCount = Object.keys(env).length;
  if (envCount > 0) {
    console.log(`  ${theme.dim('Env vars:')}  ${envCount}`);
    if (verbose) {
      for (const [k, v] of Object.entries(maskSensitive(env))) {
        console.log(`    ${theme.dim(`${k}=${v}`)}`);
      }
    }
  }
  for (const danger of plan.dangers) {
    warn(`This command looks dangerous: ${danger}`);
  }
  console.log(theme.dim('\nRun without --dry-run to execute.'));
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

  console.log(`${icons.run} ${theme.name(plan.name)} ${theme.dim('in')} ${theme.dim(plan.cwd)}`);
  console.log(theme.dim(`  ${plan.saved.command}\n`));
  for (const danger of plan.dangers) {
    warn(`This command looks dangerous: ${danger}`);
  }

  const result = await executePlan(plan);
  if (result.success) {
    console.log(`\n${icons.ok} ${theme.dim(`Done in ${(result.durationMs / 1000).toFixed(1)}s`)}`);
  } else {
    console.error(`\n${icons.fail} ${theme.error(`Exited with code ${result.exitCode}`)}`);
    process.exitCode = result.exitCode;
  }
}
