import { useTempConfigDir, cleanupTempConfigDir } from './helpers';
import {
  saveCommand,
  getCommand,
  deleteCommand,
  listCommands,
  searchCommands,
  renameCommand,
  setShortcutAlias,
  listAliases,
  removeShortcutAlias,
  resolveName,
} from '../src/core/commands';

let dir: string;
beforeEach(() => {
  dir = useTempConfigDir();
});
afterEach(() => cleanupTempConfigDir(dir));

describe('saveCommand', () => {
  it('saves and retrieves a command', () => {
    saveCommand({ name: 'build', command: 'npm run build', directory: '/tmp' });
    const cmd = getCommand('build')!;
    expect(cmd.command).toBe('npm run build');
    expect(cmd.pathMode).toBe('saved');
    expect(cmd.createdAt).toBeTruthy();
  });

  it('preserves createdAt on update', () => {
    saveCommand({ name: 'build', command: 'a', directory: '/tmp' });
    const created = getCommand('build')!.createdAt;
    saveCommand({ name: 'build', command: 'b', directory: '/tmp' });
    expect(getCommand('build')!.createdAt).toBe(created);
    expect(getCommand('build')!.command).toBe('b');
  });

  it('rejects empty and invalid names', () => {
    expect(() => saveCommand({ name: '', command: 'x', directory: '/tmp' })).toThrow();
    expect(() => saveCommand({ name: 'has space', command: 'x', directory: '/tmp' })).toThrow();
    expect(() => saveCommand({ name: '@0', command: 'x', directory: '/tmp' })).toThrow();
  });

  it('omits empty env objects', () => {
    saveCommand({ name: 'x', command: 'echo', directory: '/tmp', env: {} });
    expect(getCommand('x')!.env).toBeUndefined();
  });
});

describe('deleteCommand', () => {
  it('deletes a command and its aliases', () => {
    saveCommand({ name: 'build', command: 'npm run build', directory: '/tmp' });
    setShortcutAlias('b', 'build');
    expect(deleteCommand('build')).toBe(true);
    expect(getCommand('build')).toBeUndefined();
    expect(listAliases()).toEqual({});
  });

  it('returns false for missing commands', () => {
    expect(deleteCommand('nope')).toBe(false);
  });
});

describe('renameCommand', () => {
  it('renames preserving data', () => {
    saveCommand({ name: 'old', command: 'echo hi', directory: '/tmp' });
    renameCommand('old', 'new');
    expect(getCommand('old')).toBeUndefined();
    expect(getCommand('new')!.command).toBe('echo hi');
  });
});

describe('searchCommands', () => {
  it('matches name, command text, and directory case-insensitively', () => {
    saveCommand({ name: 'build', command: 'npm run build', directory: '/tmp/projA' });
    saveCommand({ name: 'test', command: 'pytest', directory: '/tmp/projB' });
    expect(Object.keys(searchCommands('BUILD'))).toEqual(['build']);
    expect(Object.keys(searchCommands('pytest'))).toEqual(['test']);
    expect(Object.keys(searchCommands('projb'))).toEqual(['test']);
    expect(Object.keys(searchCommands('zzz'))).toEqual([]);
  });
});

describe('aliases', () => {
  it('creates, lists, and removes aliases', () => {
    saveCommand({ name: 'build', command: 'x', directory: '/tmp' });
    setShortcutAlias('b', 'build');
    expect(listAliases()).toEqual({ b: 'build' });
    expect(removeShortcutAlias('b')).toBe(true);
    expect(removeShortcutAlias('b')).toBe(false);
  });

  it('rejects reserved names and missing targets', () => {
    saveCommand({ name: 'build', command: 'x', directory: '/tmp' });
    expect(() => setShortcutAlias('run', 'build')).toThrow(/reserved/);
    expect(() => setShortcutAlias('b', 'missing')).toThrow(/not found/);
  });
});

describe('resolveName', () => {
  it('resolves direct names, aliases, and @N references', () => {
    saveCommand({ name: 'build', command: 'x', directory: '/tmp' });
    setShortcutAlias('b', 'build');
    expect(resolveName('build')).toBe('build');
    expect(resolveName('b')).toBe('build');
    expect(resolveName('@0', ['build'])).toBe('build');
    expect(resolveName('@5', ['build'])).toBeUndefined();
    expect(resolveName('@x', ['build'])).toBeUndefined();
    expect(resolveName('missing')).toBeUndefined();
  });
});

describe('persistence', () => {
  it('lists everything that was saved', () => {
    saveCommand({ name: 'a', command: '1', directory: '/tmp' });
    saveCommand({ name: 'b', command: '2', directory: '/tmp' });
    expect(Object.keys(listCommands()).sort()).toEqual(['a', 'b']);
  });
});
