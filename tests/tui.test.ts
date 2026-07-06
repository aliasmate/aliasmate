import { useTempConfigDir, cleanupTempConfigDir } from './helpers';
import { saveCommand, getCommand, listCommands } from '../src/core/commands';
import { recordExecution } from '../src/core/recent';
import { Tui, fuzzyMatch } from '../src/ui/interactive';

let dir: string;
beforeEach(() => {
  dir = useTempConfigDir();
});
afterEach(() => cleanupTempConfigDir(dir));

/** Drive the TUI with synthetic keypresses; rendering goes to a sink. */
function makeTui(): Tui {
  return new Tui(() => undefined);
}

function press(
  tui: Tui,
  keys: Array<string | { name: string; shift?: boolean; ctrl?: boolean }>
): void {
  for (const k of keys) {
    if (typeof k === 'string') {
      for (const ch of k) tui.handleKey(ch, { name: ch, sequence: ch });
    } else {
      tui.handleKey(undefined, { ...k, sequence: '' });
    }
  }
}

function type(tui: Tui, text: string): void {
  press(tui, [text]);
}

const enter = { name: 'return' };
const esc = { name: 'escape' };
const down = { name: 'down' };

describe('fuzzyMatch', () => {
  it('matches subsequences case-insensitively', () => {
    expect(fuzzyMatch('dp', 'deploy-prod')).toBe(true);
    expect(fuzzyMatch('DEPLOY', 'deploy-prod')).toBe(true);
    expect(fuzzyMatch('xyz', 'deploy-prod')).toBe(false);
    expect(fuzzyMatch('', 'anything')).toBe(true);
  });
});

describe('Tui browse & run', () => {
  it('resolves a run action for the selected command', async () => {
    saveCommand({ name: 'alpha', command: 'echo a', directory: '/tmp' });
    saveCommand({ name: 'beta', command: 'echo b', directory: '/tmp' });
    const tui = makeTui();
    tui.refresh();
    const pending = tui.waitForAction();
    press(tui, [down, enter]);
    await expect(pending).resolves.toEqual({ kind: 'run', name: 'beta' });
  });

  it('sorts by usage so the hottest command is first', async () => {
    saveCommand({ name: 'alpha', command: 'echo a', directory: '/tmp' });
    saveCommand({ name: 'beta', command: 'echo b', directory: '/tmp' });
    recordExecution('beta');
    const tui = makeTui();
    tui.refresh();
    const pending = tui.waitForAction();
    press(tui, [enter]);
    await expect(pending).resolves.toEqual({ kind: 'run', name: 'beta' });
  });

  it('quits with q resolving null', async () => {
    const tui = makeTui();
    const pending = tui.waitForAction();
    press(tui, ['q']);
    await expect(pending).resolves.toBeNull();
  });
});

describe('Tui filter', () => {
  it('filters with / and runs the match on enter', async () => {
    saveCommand({ name: 'build', command: 'make', directory: '/tmp' });
    saveCommand({ name: 'deploy-prod', command: 'sh deploy.sh', directory: '/tmp' });
    const tui = makeTui();
    tui.refresh();
    const pending = tui.waitForAction();
    press(tui, ['/']);
    type(tui, 'dep');
    press(tui, [enter]);
    await expect(pending).resolves.toEqual({ kind: 'run', name: 'deploy-prod' });
  });

  it('keeps the highlighted row when the filter is cleared', async () => {
    saveCommand({ name: 'build', command: 'make', directory: '/tmp' });
    saveCommand({ name: 'deploy-prod', command: 'sh deploy.sh', directory: '/tmp' });
    recordExecution('build'); // build sorts first in the full list
    const tui = makeTui();
    tui.refresh();
    const pending = tui.waitForAction();
    press(tui, ['/']);
    type(tui, 'dep');
    press(tui, [esc, enter]); // clear filter, then run — should still be deploy-prod
    await expect(pending).resolves.toEqual({ kind: 'run', name: 'deploy-prod' });
  });
});

describe('Tui delete', () => {
  it('deletes the selected command after y confirmation', () => {
    saveCommand({ name: 'doomed', command: 'echo x', directory: '/tmp' });
    const tui = makeTui();
    tui.refresh();
    void tui.waitForAction();
    press(tui, ['d', 'y']);
    expect(getCommand('doomed')).toBeUndefined();
  });

  it('keeps the command when the confirmation is declined', () => {
    saveCommand({ name: 'safe', command: 'echo x', directory: '/tmp' });
    const tui = makeTui();
    tui.refresh();
    void tui.waitForAction();
    press(tui, ['d', 'n']);
    expect(getCommand('safe')).toBeDefined();
  });
});

describe('Tui form', () => {
  function fillAndSubmit(tui: Tui): void {
    press(tui, [enter, enter, enter, enter]); // through directory, pathMode, env → submit
  }

  it('creates a command from the form', () => {
    const tui = makeTui();
    void tui.waitForAction();
    press(tui, ['n']);
    type(tui, 'from-form');
    press(tui, [enter]);
    type(tui, 'echo created');
    fillAndSubmit(tui);
    const saved = getCommand('from-form')!;
    expect(saved.command).toBe('echo created');
    expect(saved.pathMode).toBe('saved');
  });

  it('rejects invalid names inside the form without saving', () => {
    const tui = makeTui();
    void tui.waitForAction();
    press(tui, ['n']);
    type(tui, 'run'); // reserved
    press(tui, [enter]);
    type(tui, 'echo x');
    fillAndSubmit(tui);
    expect(Object.keys(listCommands())).toHaveLength(0);
  });

  it('rejects duplicate names', () => {
    saveCommand({ name: 'taken', command: 'echo 1', directory: '/tmp' });
    const tui = makeTui();
    tui.refresh();
    void tui.waitForAction();
    press(tui, ['n']);
    type(tui, 'taken');
    press(tui, [enter]);
    type(tui, 'echo 2');
    fillAndSubmit(tui);
    expect(getCommand('taken')!.command).toBe('echo 1');
  });

  it('toggles path mode with space', () => {
    const tui = makeTui();
    void tui.waitForAction();
    press(tui, ['n']);
    type(tui, 'util');
    press(tui, [enter]);
    type(tui, 'echo u');
    press(tui, [enter, enter]); // to pathMode field
    press(tui, [{ name: 'space' }]);
    press(tui, [enter, enter]); // env → submit
    expect(getCommand('util')!.pathMode).toBe('current');
  });

  it('edits the selected command keeping its name and env', () => {
    saveCommand({ name: 'keepme', command: 'echo old', directory: '/tmp', env: { FOO: 'bar' } });
    const tui = makeTui();
    tui.refresh();
    void tui.waitForAction();
    press(tui, ['e']);
    // command field is active; clear "echo old" then retype
    press(
      tui,
      Array.from({ length: 8 }, () => ({ name: 'backspace' }))
    );
    type(tui, 'echo new');
    press(tui, [enter, enter, enter, enter]); // directory, pathMode, env → submit
    const saved = getCommand('keepme')!;
    expect(saved.command).toBe('echo new');
    expect(saved.env).toEqual({ FOO: 'bar' });
  });

  it('cancels with esc leaving nothing saved', () => {
    const tui = makeTui();
    void tui.waitForAction();
    press(tui, ['n']);
    type(tui, 'ghost');
    press(tui, [esc]);
    expect(Object.keys(listCommands())).toHaveLength(0);
  });

  it('opens prefilled via openForm (prev flow) and saves on submit', () => {
    const tui = makeTui();
    void tui.waitForAction();
    tui.openForm({ name: 'from-prev', command: 'git status', directory: '/tmp' });
    press(tui, [enter, enter, enter, enter]); // accept all prefilled fields
    const saved = getCommand('from-prev')!;
    expect(saved.command).toBe('git status');
  });
});

describe('Tui stats', () => {
  it('enters and leaves the stats view', async () => {
    saveCommand({ name: 'a', command: 'echo', directory: '/tmp' });
    recordExecution('a');
    const tui = makeTui();
    tui.refresh();
    const pending = tui.waitForAction();
    press(tui, ['s']); // stats
    press(tui, ['x']); // any key back to browse
    press(tui, ['q']);
    await expect(pending).resolves.toBeNull();
  });
});
