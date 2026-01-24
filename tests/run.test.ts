import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { runCommand } from '../src/commands/run';
import * as storage from '../src/storage';
import * as executor from '../src/utils/executor';
import * as recent from '../src/utils/recent';

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

  describe('dry-run mode', () => {
    it('should display command preview without executing in dry-run mode', async () => {
      const mockAlias = {
        command: 'echo test',
        directory: '/tmp',
        pathMode: 'saved' as const,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      jest.spyOn(storage, 'getAlias').mockReturnValue(mockAlias);
      const executeSpy = jest.spyOn(executor, 'executeCommand');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('test-alias', undefined, true);

      expect(storage.getAlias).toHaveBeenCalledWith('test-alias');
      expect(executeSpy).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('DRY RUN MODE'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('echo test'));
    });

    it('should highlight dangerous commands in dry-run mode', async () => {
      const mockAlias = {
        command: 'rm -rf /',
        directory: '/tmp',
        pathMode: 'saved' as const,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      jest.spyOn(storage, 'getAlias').mockReturnValue(mockAlias);
      const executeSpy = jest.spyOn(executor, 'executeCommand');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('dangerous-cmd', undefined, true);

      expect(executeSpy).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('WARNING: This command may be dangerous!')
      );
    });

    it('should display working directory and path mode in dry-run', async () => {
      const mockAlias = {
        command: 'npm test',
        directory: '/home/user/project',
        pathMode: 'saved' as const,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      jest.spyOn(storage, 'getAlias').mockReturnValue(mockAlias);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('test-alias', undefined, true);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Working Directory:'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('/home/user/project'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Path Mode:'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('saved'));
    });

    it('should display environment variables info in dry-run mode', async () => {
      const mockAlias = {
        command: 'npm start',
        directory: '/tmp',
        pathMode: 'saved' as const,
        env: {
          NODE_ENV: 'production',
          API_KEY: 'secret123',
        },
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      jest.spyOn(storage, 'getAlias').mockReturnValue(mockAlias);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('test-alias', undefined, true);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Environment Variables:'));
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('2 variable(s) will be loaded')
      );
    });

    it('should show detailed info in dry-run verbose mode', async () => {
      const mockAlias = {
        command: 'npm test',
        directory: '/tmp',
        pathMode: 'saved' as const,
        env: {
          NODE_ENV: 'test',
        },
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      jest.spyOn(storage, 'getAlias').mockReturnValue(mockAlias);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('test-alias', undefined, true, true);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Additional Details:'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Command name: test-alias'));
    });

    it('should show overridden path mode in dry-run mode', async () => {
      const mockAlias = {
        command: 'echo test',
        directory: '/tmp',
        pathMode: 'saved' as const,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      jest.spyOn(storage, 'getAlias').mockReturnValue(mockAlias);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('test-alias', '/custom/path', true);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('overridden'));
    });

    it('should show env overrides warning in dry-run mode', async () => {
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
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('test-alias', undefined, true);

      process.env = originalEnv;

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('will be overridden by current environment')
      );
    });
  });

  describe('@N recent command syntax', () => {
    it('should resolve @N to recent command name', async () => {
      jest.spyOn(recent, 'getRecentCommandByIndex').mockReturnValue('test-cmd');

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
      const recordExecutionSpy = jest.spyOn(recent, 'recordExecution').mockImplementation(() => {});
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('@0');

      expect(recent.getRecentCommandByIndex).toHaveBeenCalledWith(0);
      expect(storage.getAlias).toHaveBeenCalledWith('test-cmd');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Using recent command @0'));
      expect(recordExecutionSpy).toHaveBeenCalledWith('test-cmd');
    });

    it('should handle invalid @N syntax (non-numeric)', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.spyOn(console, 'log').mockImplementation(() => {});

      await expect(runCommand('@abc')).rejects.toThrow('process.exit');

      expect(exitSpy).toHaveBeenCalledWith(expect.any(Number));
    });

    it('should handle invalid @N syntax (negative)', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.spyOn(console, 'log').mockImplementation(() => {});

      await expect(runCommand('@-1')).rejects.toThrow('process.exit');

      expect(exitSpy).toHaveBeenCalledWith(expect.any(Number));
    });

    it('should handle @N when no command at that index', async () => {
      jest.spyOn(recent, 'getRecentCommandByIndex').mockReturnValue(undefined);
      jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.spyOn(console, 'log').mockImplementation(() => {});

      await expect(runCommand('@5')).rejects.toThrow('process.exit');

      expect(recent.getRecentCommandByIndex).toHaveBeenCalledWith(5);
      expect(exitSpy).toHaveBeenCalledWith(expect.any(Number));
    });
  });

  describe('execution tracking', () => {
    it('should record execution after successful command', async () => {
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
      const recordExecutionSpy = jest.spyOn(recent, 'recordExecution').mockImplementation(() => {});
      jest.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('test-cmd');

      expect(recordExecutionSpy).toHaveBeenCalledWith('test-cmd');
    });

    it('should record execution even when command fails', async () => {
      const mockAlias = {
        command: 'exit 1',
        directory: '/tmp',
        pathMode: 'saved' as const,
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
      const recordExecutionSpy = jest.spyOn(recent, 'recordExecution').mockImplementation(() => {});
      jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.spyOn(console, 'log').mockImplementation(() => {});

      await expect(runCommand('test-cmd')).rejects.toThrow('process.exit');

      expect(recordExecutionSpy).toHaveBeenCalledWith('test-cmd');
    });

    it('should NOT record execution in dry-run mode', async () => {
      const mockAlias = {
        command: 'echo test',
        directory: '/tmp',
        pathMode: 'saved' as const,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      jest.spyOn(storage, 'getAlias').mockReturnValue(mockAlias);
      const recordExecutionSpy = jest.spyOn(recent, 'recordExecution').mockImplementation(() => {});
      jest.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('test-cmd', undefined, true);

      expect(recordExecutionSpy).not.toHaveBeenCalled();
    });
  });
});
