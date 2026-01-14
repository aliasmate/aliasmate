import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { importCommand } from '../src/commands/import';
import * as storage from '../src/storage';
import * as prompts from '../src/utils/prompts';
import * as fs from 'fs';

// Mock fs module properly
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

describe('import command', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;
  let exitSpy: jest.SpiedFunction<typeof process.exit>;

  beforeEach(() => {
    jest.clearAllMocks();
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null) => {
      throw new Error(`process.exit: ${code}`);
    });
  });

  afterEach(() => {
    exitSpy.mockRestore();
  });

  it('should import aliases from file', async () => {
    const importData = {
      aliases: {
        'imported-alias': {
          command: 'echo imported',
          directory: '/imported',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    };

    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify(importData) as any);
    jest.spyOn(storage, 'loadAliases').mockReturnValue({});
    jest.spyOn(storage, 'saveAliases').mockReturnValue(true);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await importCommand('/tmp/import.json');

    expect(storage.saveAliases).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should handle file not found', async () => {
    mockFs.existsSync.mockReturnValue(false);
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(importCommand('/nonexistent.json')).rejects.toThrow('process.exit');
  });

  it('should handle invalid JSON', async () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('invalid json' as any);

    await expect(importCommand('/tmp/invalid.json')).rejects.toThrow('process.exit');
  });

  it('should handle conflicts with overwrite', async () => {
    const importData = {
      aliases: {
        existing: {
          command: 'echo new',
          directory: '/new',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    };

    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify(importData) as any);
    jest.spyOn(storage, 'loadAliases').mockReturnValue({
      existing: {
        command: 'echo old',
        directory: '/old',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    });
    jest.spyOn(storage, 'aliasExists').mockReturnValue(true);
    jest.spyOn(prompts, 'promptList').mockResolvedValue('overwrite');
    jest.spyOn(storage, 'saveAliases').mockReturnValue(true);

    await importCommand('/tmp/import.json');

    expect(storage.saveAliases).toHaveBeenCalled();
  });

  it('should handle conflicts with skip', async () => {
    const importData = {
      aliases: {
        existing: {
          command: 'echo new',
          directory: '/new',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    };

    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify(importData) as any);
    jest.spyOn(storage, 'loadAliases').mockReturnValue({
      existing: {
        command: 'echo old',
        directory: '/old',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    });
    jest.spyOn(storage, 'aliasExists').mockReturnValue(true);
    jest.spyOn(prompts, 'promptList').mockResolvedValue('skip');
    jest.spyOn(storage, 'saveAliases').mockReturnValue(true);

    await importCommand('/tmp/import.json');

    expect(storage.saveAliases).toHaveBeenCalled();
    // Original should be preserved
  });

  it('should handle conflicts with rename', async () => {
    const importData = {
      aliases: {
        existing: {
          command: 'echo new',
          directory: '/new',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    };

    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify(importData) as any);
    jest.spyOn(storage, 'loadAliases').mockReturnValue({
      existing: {
        command: 'echo old',
        directory: '/old',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    });
    jest.spyOn(storage, 'aliasExists').mockReturnValue(true);
    jest.spyOn(prompts, 'promptList').mockResolvedValue('rename');
    jest.spyOn(prompts, 'promptText').mockResolvedValue('existing-renamed');
    jest.spyOn(storage, 'saveAliases').mockReturnValue(true);

    await importCommand('/tmp/import.json');

    expect(prompts.promptText).toHaveBeenCalled();
    expect(storage.saveAliases).toHaveBeenCalled();
  });

  it('should handle empty import file', async () => {
    const importData = { aliases: {} };

    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify(importData) as any);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await importCommand('/tmp/empty.json');

    expect(consoleSpy).toHaveBeenCalled();
  });
});
