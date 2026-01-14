import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { runCommand } from '../src/commands/run';
import * as storage from '../src/storage';
import * as executor from '../src/utils/executor';

describe('path mode feature', () => {
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

  describe('saved path mode', () => {
    it('should run command in saved directory', async () => {
      const mockAlias = {
        command: 'echo test',
        directory: '/saved/path',
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
      jest.spyOn(console, 'log').mockImplementation(() => {});

      // Mock process.cwd to return different path
      const originalCwd = process.cwd;
      process.cwd = jest.fn(() => '/different/path') as any;

      await runCommand('test-alias');

      expect(executor.executeCommand).toHaveBeenCalledWith('echo test', '/saved/path', expect.any(Object));

      process.cwd = originalCwd;
    });

    it('should use saved directory even when cwd is different', async () => {
      const mockAlias = {
        command: 'npm test',
        directory: '/project/root',
        pathMode: 'saved' as const,
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
      jest.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('test-alias');

      // Should use the saved directory, not current
      expect(executor.executeCommand).toHaveBeenCalledWith('npm test', '/project/root', expect.any(Object));
    });
  });

  describe('current path mode', () => {
    it('should run command in current working directory', async () => {
      const mockAlias = {
        command: 'eslint .',
        directory: '/ignored/path',
        pathMode: 'current' as const,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      const currentDir = '/actual/current/dir';
      const originalCwd = process.cwd;
      process.cwd = jest.fn(() => currentDir) as any;

      jest.spyOn(storage, 'getAlias').mockReturnValue(mockAlias);
      jest.spyOn(executor, 'executeCommand').mockResolvedValue({
        success: true,
        stdout: '',
        stderr: '',
        exitCode: 0,
      });
      jest.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('test-alias');

      // Should use current directory, not saved one
      expect(executor.executeCommand).toHaveBeenCalledWith('eslint .', currentDir, expect.any(Object));

      process.cwd = originalCwd;
    });

    it('should respect current directory for reusable commands', async () => {
      const mockAlias = {
        command: 'git status',
        directory: '/old/repo',
        pathMode: 'current' as const,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      const currentRepo = '/new/repo';
      const originalCwd = process.cwd;
      process.cwd = jest.fn(() => currentRepo) as any;

      jest.spyOn(storage, 'getAlias').mockReturnValue(mockAlias);
      jest.spyOn(executor, 'executeCommand').mockResolvedValue({
        success: true,
        stdout: 'On branch main\n',
        stderr: '',
        exitCode: 0,
      });
      jest.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('test-alias');

      expect(executor.executeCommand).toHaveBeenCalledWith('git status', currentRepo, expect.any(Object));

      process.cwd = originalCwd;
    });
  });

  describe('backward compatibility', () => {
    it('should default to saved mode when pathMode is undefined', async () => {
      const mockAlias = {
        command: 'echo test',
        directory: '/saved/path',
        // pathMode is undefined (old format)
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
      jest.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('test-alias');

      // Should behave like 'saved' mode (backward compatible)
      expect(executor.executeCommand).toHaveBeenCalledWith('echo test', '/saved/path', expect.any(Object));
    });
  });

  describe('path override', () => {
    it('should override path mode when explicit path is provided', async () => {
      const mockAlias = {
        command: 'npm build',
        directory: '/saved/path',
        pathMode: 'saved' as const,
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
      jest.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('test-alias', '/override/path');

      // Should use override path, ignoring path mode
      expect(executor.executeCommand).toHaveBeenCalledWith('npm build', '/override/path', expect.any(Object));
    });

    it('should override current mode with explicit path', async () => {
      const mockAlias = {
        command: 'eslint .',
        directory: '/ignored',
        pathMode: 'current' as const,
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
      jest.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('test-alias', '/specific/path');

      expect(executor.executeCommand).toHaveBeenCalledWith('eslint .', '/specific/path', expect.any(Object));
    });
  });
});
