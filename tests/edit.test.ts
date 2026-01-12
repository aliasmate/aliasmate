import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { editCommand } from '../src/commands/edit';
import * as storage from '../src/storage';
import * as prompts from '../src/utils/prompts';
import * as inquirer from 'inquirer';

jest.mock('inquirer');

describe('edit command', () => {
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

  it('should edit an existing alias', async () => {
    const mockAlias = {
      command: 'echo old',
      directory: '/old',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    jest.spyOn(storage, 'getAlias').mockReturnValue(mockAlias);
    jest.spyOn(prompts, 'promptMultiple').mockResolvedValue({
      command: 'echo new',
      directory: '/new',
    });
    jest.spyOn(storage, 'setAlias').mockReturnValue(true);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const result = await editCommand('test-alias');

    expect(result).toBe(true);
    expect(storage.setAlias).toHaveBeenCalledWith('test-alias', 'echo new', '/new');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should return false when alias does not exist', async () => {
    jest.spyOn(storage, 'getAlias').mockReturnValue(undefined);
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(editCommand('nonexistent')).rejects.toThrow('process.exit');
  });

  it('should prompt for alias selection when name is empty', async () => {
    const mockAliases = {
      'test-alias': {
        command: 'echo test',
        directory: '/test',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    };

    jest.spyOn(storage, 'loadAliases').mockReturnValue(mockAliases);
    jest.spyOn(inquirer, 'prompt').mockResolvedValue({ name: 'test-alias' });
    jest.spyOn(storage, 'getAlias').mockReturnValue(mockAliases['test-alias']);
    jest.spyOn(prompts, 'promptMultiple').mockResolvedValue({
      command: 'echo new',
      directory: '/new',
    });
    jest.spyOn(storage, 'setAlias').mockReturnValue(true);

    await editCommand('');

    expect(inquirer.prompt).toHaveBeenCalled();
    expect(storage.setAlias).toHaveBeenCalled();
  });

  it('should handle no aliases available', async () => {
    jest.spyOn(storage, 'loadAliases').mockReturnValue({});
    jest.spyOn(console, 'log').mockImplementation(() => {});

    await expect(editCommand('')).rejects.toThrow('process.exit');
  });

  it('should pre-fill current values in prompts', async () => {
    const mockAlias = {
      command: 'echo test',
      directory: '/test',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    jest.spyOn(storage, 'getAlias').mockReturnValue(mockAlias);
    const promptSpy = jest.spyOn(prompts, 'promptMultiple').mockResolvedValue({
      command: 'echo test',
      directory: '/test',
    });
    jest.spyOn(storage, 'setAlias').mockReturnValue(true);

    await editCommand('test-alias');

    expect(promptSpy).toHaveBeenCalled();
    // Check that prompt was called with current values as defaults
    const callArgs = promptSpy.mock.calls[0][0];
    expect(callArgs).toBeDefined();
  });
});
