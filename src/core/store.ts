import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

/**
 * Config directory resolution. ALIASMATE_HOME overrides the default so tests
 * and power users can point at an isolated directory.
 */
export function getConfigDir(): string {
  const dir = process.env.ALIASMATE_HOME || path.join(os.homedir(), '.config', 'aliasmate');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getConfigPath(): string {
  return path.join(getConfigDir(), 'config.json');
}

export function getMetadataPath(): string {
  return path.join(getConfigDir(), 'metadata.json');
}

export function getOnboardingPath(): string {
  return path.join(getConfigDir(), 'onboarding.json');
}

/**
 * A JSON-backed document with per-process caching and atomic writes.
 * Each file is read at most once per process; writes go through a temp file
 * and rename so a crash can never corrupt user data.
 */
export class JsonFile<T extends object> {
  private cache: T | null = null;

  constructor(
    private readonly filePath: () => string,
    private readonly fallback: () => T
  ) {}

  read(): T {
    if (this.cache !== null) return this.cache;
    const file = this.filePath();
    if (!fs.existsSync(file)) {
      this.cache = this.fallback();
      return this.cache;
    }
    try {
      this.cache = JSON.parse(fs.readFileSync(file, 'utf8')) as T;
    } catch {
      // Corrupt file: preserve it for the user instead of silently clobbering.
      const backup = `${file}.corrupt-${Date.now()}`;
      try {
        fs.copyFileSync(file, backup);
        process.stderr.write(`Warning: could not parse ${file}; backup saved to ${backup}\n`);
      } catch {
        // Best effort only.
      }
      this.cache = this.fallback();
    }
    return this.cache;
  }

  write(data: T): void {
    const file = this.filePath();
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmp, file);
    this.cache = data;
  }

  update(mutate: (data: T) => void): T {
    const data = this.read();
    mutate(data);
    this.write(data);
    return data;
  }

  /** Drop the cache (used by tests when the underlying path changes). */
  invalidate(): void {
    this.cache = null;
  }
}

export const configFile = new JsonFile<Record<string, unknown>>(getConfigPath, () => ({}));
export const metadataFile = new JsonFile<Record<string, unknown>>(getMetadataPath, () => ({}));

export function getMetadata<T>(key: string): T | undefined {
  return metadataFile.read()[key] as T | undefined;
}

export function setMetadata<T>(key: string, value: T): void {
  metadataFile.update((data) => {
    data[key] = value;
  });
}
