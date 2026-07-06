import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { configFile, metadataFile } from '../src/core/store';

/** Point AliasMate at a throwaway config dir and reset caches. */
export function useTempConfigDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aliasmate-test-'));
  process.env.ALIASMATE_HOME = dir;
  configFile.invalidate();
  metadataFile.invalidate();
  return dir;
}

export function cleanupTempConfigDir(dir: string): void {
  delete process.env.ALIASMATE_HOME;
  fs.rmSync(dir, { recursive: true, force: true });
  configFile.invalidate();
  metadataFile.invalidate();
}
