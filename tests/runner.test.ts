import * as os from 'os';
import { useTempConfigDir, cleanupTempConfigDir } from './helpers';
import { saveCommand, setShortcutAlias } from '../src/core/commands';
import { recordExecution, getExecutionHistory } from '../src/core/recent';
import { planRun, executePlan } from '../src/core/runner';

let dir: string;
beforeEach(() => {
  dir = useTempConfigDir();
});
afterEach(() => cleanupTempConfigDir(dir));

describe('planRun', () => {
  it('resolves saved directory mode', () => {
    saveCommand({ name: 'build', command: 'echo hi', directory: os.tmpdir() });
    const plan = planRun('build');
    expect(plan.name).toBe('build');
    expect(plan.cwdSource).toBe('saved');
  });

  it('uses cwd for current path mode', () => {
    saveCommand({ name: 'lint', command: 'echo hi', directory: '/tmp', pathMode: 'current' });
    const plan = planRun('lint');
    expect(plan.cwd).toBe(process.cwd());
    expect(plan.cwdSource).toBe('current');
  });

  it('honors path override', () => {
    saveCommand({ name: 'build', command: 'echo hi', directory: '/tmp' });
    const plan = planRun('build', os.tmpdir());
    expect(plan.cwdSource).toBe('override');
  });

  it('resolves aliases and @N', () => {
    saveCommand({ name: 'build', command: 'echo hi', directory: os.tmpdir() });
    setShortcutAlias('b', 'build');
    recordExecution('build');
    expect(planRun('b').name).toBe('build');
    expect(planRun('@0').name).toBe('build');
  });

  it('throws helpful errors for unknown names', () => {
    expect(() => planRun('missing')).toThrow(/not found/);
    expect(() => planRun('@3')).toThrow(/recent/i);
  });

  it('flags dangerous commands', () => {
    saveCommand({ name: 'nuke', command: 'rm -rf /tmp/x', directory: os.tmpdir() });
    expect(planRun('nuke').dangers.length).toBeGreaterThan(0);
  });
});

describe('executePlan', () => {
  it('runs a real command and records history', async () => {
    saveCommand({ name: 'hello', command: 'echo hello', directory: os.tmpdir() });
    const result = await executePlan(planRun('hello'));
    expect(result.success).toBe(true);
    expect(getExecutionHistory()[0].commandName).toBe('hello');
  });

  it('reports failing exit codes', async () => {
    saveCommand({ name: 'boom', command: 'exit 3', directory: os.tmpdir() });
    const result = await executePlan(planRun('boom'));
    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(3);
  });

  it('applies saved env vars', async () => {
    saveCommand({
      name: 'envcheck',
      command: 'test "$ALIASMATE_TEST_VAR" = "42"',
      directory: os.tmpdir(),
      env: { ALIASMATE_TEST_VAR: '42' },
    });
    const result = await executePlan(planRun('envcheck'));
    expect(result.success).toBe(true);
  });

  it('blocks execution when the directory is missing', async () => {
    saveCommand({ name: 'bad', command: 'echo hi', directory: os.tmpdir() });
    await expect(executePlan(planRun('bad', '/definitely/not/a/dir'))).rejects.toThrow(/Directory/);
  });
});
