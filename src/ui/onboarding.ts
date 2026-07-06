import * as fs from 'fs';
import { getOnboardingPath } from '../core/store';
import { theme, icons } from './theme';

interface OnboardingState {
  lastSeenVersion?: string;
}

function readState(): OnboardingState {
  const file = getOnboardingPath();
  if (!fs.existsSync(file)) return {};
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as OnboardingState;
  } catch {
    return {};
  }
}

function writeState(state: OnboardingState): void {
  try {
    fs.writeFileSync(getOnboardingPath(), JSON.stringify(state, null, 2), 'utf8');
  } catch {
    // Onboarding is best-effort; never block the CLI.
  }
}

/** Show the welcome tour on first run, a short note on upgrades. */
export function maybeShowOnboarding(currentVersion: string): boolean {
  const state = readState();
  if (state.lastSeenVersion === currentVersion) return false;
  const firstRun = !state.lastSeenVersion;
  writeState({ lastSeenVersion: currentVersion });

  if (firstRun) {
    console.log();
    console.log(theme.brand('  ⚡ Welcome to AliasMate!'));
    console.log(theme.dim('  Save commands once, run them from anywhere.\n'));
    console.log(
      `  ${icons.spark} After running any command:  ${theme.name('aliasmate prev <name>')}`
    );
    console.log(`  ${icons.run} Run it from anywhere:       ${theme.name('aliasmate run <name>')}`);
    console.log(
      `  📋 Browse everything:          ${theme.name('aliasmate')} ${theme.dim('(interactive menu)')}`
    );
    console.log();
    console.log(theme.dim('  Tip: install tab completion with "aliasmate completion install"'));
    console.log();
  } else {
    console.log(
      theme.dim(
        `\n${icons.spark} AliasMate updated to v${currentVersion} — see CHANGELOG for details.\n`
      )
    );
  }
  return true;
}
