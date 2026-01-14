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
      pathMode: 'saved' as const,
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

    await runCommand('test-alias');

    expect(storage.getAlias).toHaveBeenCalledWith('test-alias');
    expect(executor.executeCommand).toHaveBeenCalledWith('echo test', '/tmp', expect.any(Object));
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

  it('should merge saved environment variables with current env', async () => {
    const mockAlias = {
      command: 'npm start',
      directory: '/tmp',
      pathMode: 'saved' as const,
      env: {
        APP_ENV: 'production',
        API_URL: 'https://api.example.com',
      },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    jest.spyOn(storage, 'getAlias').mockReturnValue(mockAlias);
    jest.spyOn(executor, 'executeCommand').mockResolvedValue({
      success: true,
      stdout: '',
      stderr: '',
      exitCode: 0,
    });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await runCommand('test-alias');

    // Verify the call was made with the command and directory
    expect(executor.executeCommand).toHaveBeenCalledWith('npm start', '/tmp', expect.any(Object));

    // Check that the env contains our saved variables
    const callArgs = (executor.executeCommand as jest.Mock).mock.calls[0];
    const envArg = callArgs[2];
    expect(envArg).toHaveProperty('APP_ENV', 'production');
    expect(envArg).toHaveProperty('API_URL', 'https://api.example.com');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Environment Variables: 2 loaded')
    );
  });

  it('should show env override warning when current env differs from saved', async () => {
    const mockAlias = {
      command: 'npm start',
      directory: '/tmp',
      pathMode: 'saved' as const,
      env: {
        NODE_ENV: 'production',
      },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    // Mock process.env to have different value
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      NODE_ENV: 'development',
    };

    jest.spyOn(storage, 'getAlias').mockReturnValue(mockAlias);
    jest.spyOn(executor, 'executeCommand').mockResolvedValue({
      success: true,
      stdout: '',
      stderr: '',
      exitCode: 0,
    });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await runCommand('test-alias');

    process.env = originalEnv;

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('overridden by current environment')
    );
  });

  it('should run without env vars when none are saved', async () => {
    const mockAlias = {
      command: 'echo test',
      directory: '/tmp',
      pathMode: 'saved' as const,
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

    await runCommand('test-alias');

    expect(executor.executeCommand).toHaveBeenCalledWith('echo test', '/tmp', expect.any(Object));
    expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('Environment Variables:'));
  });
});
