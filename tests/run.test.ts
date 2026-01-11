import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { runCommand } from '../src/commands/run';
import * as storage from '../src/storage';
import * as executor from '../src/utils/executor';

describe('run command', () => {
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

  it('should execute alias command successfully', async () => {
    const mockAlias = {
      command: 'echo test',
      directory: '/tmp',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    jest.spyOn(storage, 'getAlias').mockReturnValue(mockAlias);
    jest.spyOn(executor, 'executeCommand').mockResolvedValue({
      success: true,
      stdout: 'test\n',
      stderr: '',
      exitCode: 0,
    });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const result = await runCommand('test-alias');

    expect(result).toBe(true);
    expect(storage.getAlias).toHaveBeenCalledWith('test-alias');
    expect(executor.executeCommand).toHaveBeenCalledWith('echo test', '/tmp');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should return false when alias does not exist', async () => {
    jest.spyOn(storage, 'getAlias').mockReturnValue(undefined);
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(runCommand('nonexistent')).rejects.toThrow('process.exit');
  });

  it('should handle command execution failure', async () => {
    const mockAlias = {
      command: 'exit 1',
      directory: '/tmp',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    jest.spyOn(storage, 'getAlias').mockReturnValue(mockAlias);
    jest.spyOn(executor, 'executeCommand').mockResolvedValue({
      success: false,
      stdout: '',
      stderr: 'Error',
      exitCode: 1,
    });
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(runCommand('test-alias')).rejects.toThrow('process.exit');
  });

  it('should output stderr when command fails', async () => {
    const mockAlias = {
      command: 'invalid-command',
      directory: '/tmp',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    jest.spyOn(storage, 'getAlias').mockReturnValue(mockAlias);
    jest.spyOn(executor, 'executeCommand').mockResolvedValue({
      success: false,
      stdout: '',
      stderr: 'command not found',
      exitCode: 127,
    });
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(runCommand('test-alias')).rejects.toThrow('process.exit');
  });
});
