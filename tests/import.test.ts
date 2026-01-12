import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { importCommand } from '../src/commands/import';
import * as storage from '../src/storage';
import * as prompts from '../src/utils/prompts';
import * as fs from 'fs';

describe('import command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(importData));
    jest.spyOn(storage, 'loadAliases').mockReturnValue({});
    jest.spyOn(storage, 'saveAliases').mockReturnValue(true);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await importCommand('/tmp/import.json');

    expect(storage.saveAliases).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should handle file not found', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    await expect(importCommand('/nonexistent.json')).rejects.toThrow();
  });

  it('should handle invalid JSON', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue('invalid json');

    await expect(importCommand('/tmp/invalid.json')).rejects.toThrow();
  });

  it('should handle conflicts with overwrite', async () => {
    const importData = {
      aliases: {
        'existing': {
          command: 'echo new',
          directory: '/new',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    };

    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(importData));
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
        'existing': {
          command: 'echo new',
          directory: '/new',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    };

    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(importData));
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
        'existing': {
          command: 'echo new',
          directory: '/new',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    };

    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(importData));
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

    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(importData));
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await importCommand('/tmp/empty.json');

    expect(consoleSpy).toHaveBeenCalled();
  });
});
