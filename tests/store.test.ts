import * as fs from 'fs';
import * as path from 'path';
import { useTempConfigDir, cleanupTempConfigDir } from './helpers';
import { JsonFile, getConfigPath, getMetadata, setMetadata } from '../src/core/store';

let dir: string;
beforeEach(() => {
  dir = useTempConfigDir();
});
afterEach(() => cleanupTempConfigDir(dir));

describe('JsonFile', () => {
  it('returns the fallback when the file is missing', () => {
    const file = new JsonFile(
      () => path.join(dir, 'x.json'),
      () => ({ a: 1 })
    );
    expect(file.read()).toEqual({ a: 1 });
  });

  it('writes atomically and reads back through the cache', () => {
    const file = new JsonFile<Record<string, number>>(
      () => path.join(dir, 'x.json'),
      () => ({})
    );
    file.write({ n: 42 });
    expect(file.read()).toEqual({ n: 42 });
    expect(JSON.parse(fs.readFileSync(path.join(dir, 'x.json'), 'utf8'))).toEqual({ n: 42 });
    expect(fs.existsSync(path.join(dir, 'x.json.tmp'))).toBe(false);
  });

  it('backs up corrupt files instead of clobbering them', () => {
    const target = path.join(dir, 'x.json');
    fs.writeFileSync(target, 'not json{{{');
    const file = new JsonFile(
      () => target,
      () => ({ fresh: true })
    );
    expect(file.read()).toEqual({ fresh: true });
    const backups = fs.readdirSync(dir).filter((f) => f.includes('corrupt'));
    expect(backups).toHaveLength(1);
  });
});

describe('metadata helpers', () => {
  it('round-trips values', () => {
    expect(getMetadata('k')).toBeUndefined();
    setMetadata('k', { deep: [1, 2] });
    expect(getMetadata('k')).toEqual({ deep: [1, 2] });
  });
});

describe('config paths', () => {
  it('respects ALIASMATE_HOME', () => {
    expect(getConfigPath()).toBe(path.join(dir, 'config.json'));
  });
});
