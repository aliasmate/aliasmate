import * as fs from 'fs';
import { getOnboardingPath } from '../core/store';
import { listCommands, saveCommand } from '../core/commands';
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

  if (firstRun && Object.keys(listCommands()).length === 0) {
    // A couple of harmless examples so the TUI isn't an empty room.
    saveCommand(
      {
        name: 'example-hello',
        command: 'echo "aliasmate works — delete me with d in the TUI"',
        directory: process.cwd(),
        pathMode: 'current',
        description: 'example command — safe to delete',
        tags: ['example'],
      },
      { undo: false }
    );
    saveCommand(
      {
        name: 'example-branch',
        command: 'git checkout {{branch}}',
        directory: process.cwd(),
        pathMode: 'current',
        description: 'example with a {{placeholder}} — prompts at run time',
        tags: ['example'],
      },
      { undo: false }
    );
  }

  if (firstRun) {
    console.log();
    console.log(
      ` ${icons.dot} ${theme.heading('aliasmate')} ${theme.dim('· save commands once, run them from anywhere')}`
    );
    console.log();
    console.log(
      `   ${theme.faint('capture'.padEnd(9))}${theme.dim('after any command:')}  aliasmate prev <name>`
    );
    console.log(
      `   ${theme.faint('run'.padEnd(9))}${theme.dim('from anywhere:')}      aliasmate run <name>`
    );
    console.log(
      `   ${theme.faint('browse'.padEnd(9))}${theme.dim('full-screen TUI:')}    aliasmate`
    );
    console.log();
    console.log(theme.faint('   tab completion: aliasmate completion install'));
    console.log();
  } else {
    console.log(
      theme.dim(
        `\n${icons.dot} aliasmate updated to v${currentVersion} — see CHANGELOG for details.\n`
      )
    );
  }
  return true;
}
