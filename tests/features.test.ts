import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { useTempConfigDir, cleanupTempConfigDir } from './helpers';
import { saveCommand, deleteCommand, renameCommand, getCommand } from '../src/core/commands';
import {
  planRun,
  executePlan,
  findPlaceholders,
  fillPlaceholders,
  finalCommand,
} from '../src/core/runner';
import { undoLast, peekUndo } from '../src/core/undo';
import { getExecutionHistory } from '../src/core/recent';
import {
  loadProjectCommands,
  listEffectiveCommands,
  saveProjectCommand,
} from '../src/core/project';
import { getSuggestion } from '../src/core/suggest';

let dir: string;
let projectDir: string;
beforeEach(() => {
  dir = useTempConfigDir();
  projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aliasmate-proj-'));
});
afterEach(() => {
  cleanupTempConfigDir(dir);
  fs.rmSync(projectDir, { recursive: true, force: true });
});

describe('placeholders', () => {
  it('finds and fills {{placeholders}}', () => {
    expect(findPlaceholders('git checkout {{branch}} && echo {{branch}} {{msg}}')).toEqual([
      'branch',
      'msg',
    ]);
    expect(fillPlaceholders('git checkout {{ branch }}', { branch: 'main' })).toBe(
      'git checkout main'
    );
  });

  it('threads placeholder values and extra args into the final command', () => {
    saveCommand({ name: 'co', command: 'git checkout {{branch}}', directory: os.tmpdir() });
    const plan = planRun('co', undefined, ['--force']);
    expect(plan.placeholders).toEqual(['branch']);
    expect(finalCommand(plan, { branch: 'dev' })).toBe('git checkout dev --force');
  });
});

describe('chains', () => {
  it('runs steps in order and stops on failure', async () => {
    const marker = path.join(projectDir, 'step.txt');
    saveCommand({ name: 'one', command: `echo one >> ${marker}`, directory: os.tmpdir() });
    saveCommand({ name: 'boom', command: 'exit 7', directory: os.tmpdir() });
    saveCommand({ name: 'never', command: `echo never >> ${marker}`, directory: os.tmpdir() });
    saveCommand({
      name: 'pipeline',
      command: 'chain',
      directory: os.tmpdir(),
      steps: ['one', 'boom', 'never'],
    });
    const result = await executePlan(planRun('pipeline'));
    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(7);
    expect(result.steps?.map((s) => s.step)).toEqual(['one', 'boom']);
    expect(fs.readFileSync(marker, 'utf8')).toBe('one\n');
  });
});

describe('execution outcomes', () => {
  it('records exit codes in history', async () => {
    saveCommand({ name: 'fails', command: 'exit 2', directory: os.tmpdir() });
    await executePlan(planRun('fails'));
    const entry = getExecutionHistory()[0];
    expect(entry.commandName).toBe('fails');
    expect(entry.exitCode).toBe(2);
    expect(typeof entry.durationMs).toBe('number');
  });
});

describe('undo', () => {
  it('reverts delete, rename, and edit', () => {
    saveCommand({ name: 'victim', command: 'echo 1', directory: '/tmp' });

    deleteCommand('victim');
    expect(peekUndo()).toBe('delete victim');
    undoLast();
    expect(getCommand('victim')).toBeDefined();

    renameCommand('victim', 'renamed');
    undoLast();
    expect(getCommand('victim')).toBeDefined();
    expect(getCommand('renamed')).toBeUndefined();

    saveCommand({ name: 'victim', command: 'echo 2', directory: '/tmp' });
    undoLast();
    expect(getCommand('victim')!.command).toBe('echo 1');
  });

  it('returns null when there is nothing to undo', () => {
    expect(undoLast()).toBeNull();
  });
});

describe('project commands', () => {
  it('loads .aliasmate.json with project-relative directories', () => {
    fs.writeFileSync(
      path.join(projectDir, '.aliasmate.json'),
      JSON.stringify({ build: { command: 'make', directory: 'sub' } })
    );
    const commands = loadProjectCommands(projectDir);
    expect(commands.build.command).toBe('make');
    expect(commands.build.directory).toBe(path.join(projectDir, 'sub'));
  });

  it('overlays project commands on top of globals', () => {
    saveCommand({ name: 'build', command: 'global-make', directory: '/tmp' });
    saveCommand({ name: 'other', command: 'echo', directory: '/tmp' });
    fs.writeFileSync(
      path.join(projectDir, '.aliasmate.json'),
      JSON.stringify({ build: { command: 'project-make' } })
    );
    const effective = listEffectiveCommands(projectDir);
    expect(effective.commands.build.command).toBe('project-make');
    expect(effective.commands.other.command).toBe('echo');
    expect(effective.projectNames.has('build')).toBe(true);
  });

  it('writes project commands with relative directories', () => {
    saveCommand({ name: 'lint', command: 'eslint .', directory: projectDir });
    const file = saveProjectCommand('lint', getCommand('lint')!, projectDir);
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    expect(raw.lint.directory).toBe('.');
  });
});

describe('suggestions', () => {
  it('suggests a repeated unsaved command from the raw log', () => {
    const rawLog = path.join(dir, 'raw.log');
    fs.writeFileSync(
      rawLog,
      ['npm run dev', 'ls', 'npm run dev', 'git status', 'npm run dev', ''].join('\n')
    );
    const suggestion = getSuggestion();
    expect(suggestion).toEqual({ command: 'npm run dev', count: 3 });
  });

  it('ignores saved and trivial commands', () => {
    saveCommand({ name: 'dev', command: 'npm run dev', directory: '/tmp' });
    fs.writeFileSync(
      path.join(dir, 'raw.log'),
      ['npm run dev', 'npm run dev', 'npm run dev', 'cd ..', 'cd ..', 'cd ..', ''].join('\n')
    );
    expect(getSuggestion()).toBeNull();
  });
});
