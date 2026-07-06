import * as fs from 'fs';
import * as path from 'path';
import { useTempConfigDir, cleanupTempConfigDir } from './helpers';
import { saveCommand, getCommand, deleteCommand } from '../src/core/commands';
import { exportHandler, importHandler } from '../src/cli/transfer';

let dir: string;
beforeEach(() => {
  dir = useTempConfigDir();
});
afterEach(() => cleanupTempConfigDir(dir));

describe('export / import round trip', () => {
  it('restores commands including real secret values with --full', async () => {
    saveCommand({
      name: 'deploy',
      command: './deploy.sh',
      directory: '/tmp',
      env: { API_KEY: 'supersecret-value', NODE_ENV: 'prod' },
    });
    const file = path.join(dir, 'backup.json');
    exportHandler(file, { full: true });

    deleteCommand('deploy');
    expect(getCommand('deploy')).toBeUndefined();

    await importHandler(file);
    const restored = getCommand('deploy')!;
    expect(restored.command).toBe('./deploy.sh');
    expect(restored.env).toEqual({ API_KEY: 'supersecret-value', NODE_ENV: 'prod' });
  });

  it('masks secrets by default', () => {
    saveCommand({
      name: 'deploy',
      command: './deploy.sh',
      directory: '/tmp',
      env: { API_KEY: 'supersecret-value' },
    });
    const file = path.join(dir, 'share.json');
    exportHandler(file, {});
    const exported = JSON.parse(fs.readFileSync(file, 'utf8'));
    expect(exported.deploy.env.API_KEY).not.toBe('supersecret-value');
    expect(exported.deploy.env.API_KEY).toContain('***');
  });

  it('skips conflicting names non-interactively without data loss', async () => {
    saveCommand({ name: 'keep', command: 'echo original', directory: '/tmp' });
    const file = path.join(dir, 'in.json');
    exportHandler(file, { full: true });
    saveCommand({ name: 'keep', command: 'echo changed', directory: '/tmp' });
    await importHandler(file);
    expect(getCommand('keep')!.command).toBe('echo changed');
  });
});
