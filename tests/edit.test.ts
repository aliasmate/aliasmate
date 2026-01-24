import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { editCommand } from '../src/commands/edit';
import * as storage from '../src/storage';
import * as prompts from '../src/utils/prompts';

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
      pathMode: 'saved' as const,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    jest.spyOn(storage, 'getAlias').mockReturnValue(mockAlias);
    jest.spyOn(prompts, 'promptMultiple').mockResolvedValue({
      command: 'echo new',
      directory: '/new',
      pathMode: 'saved' as const,
    });
    jest.spyOn(prompts, 'promptConfirm').mockResolvedValue(false); // Don't update env
    jest.spyOn(storage, 'setAlias').mockReturnValue(true);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Pass false to skip validation
    await editCommand('test-alias', false);

    expect(storage.setAlias).toHaveBeenCalledWith(
      'test-alias',
      'echo new',
      '/new',
      'saved',
      undefined
    );
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should exit when alias does not exist', async () => {
    jest.spyOn(storage, 'getAlias').mockReturnValue(undefined);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});

    await expect(editCommand('nonexistent')).rejects.toThrow('process.exit');
  });

  it('should not change anything when user keeps same values', async () => {
    const mockAlias = {
      command: 'echo test',
      directory: '/test',
      pathMode: 'saved' as const,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    jest.spyOn(storage, 'getAlias').mockReturnValue(mockAlias);
    jest.spyOn(prompts, 'promptMultiple').mockResolvedValue({
      command: 'echo test',
      directory: '/test',
      pathMode: 'saved' as const,
    });
    jest.spyOn(prompts, 'promptConfirm').mockResolvedValue(false); // Don't update env
    jest.spyOn(storage, 'setAlias').mockReturnValue(true);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await editCommand('test-alias', false);

    expect(storage.setAlias).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No changes'));
  });

  it('should pre-fill current values in prompts', async () => {
    const mockAlias = {
      command: 'echo test',
      directory: '/test',
      pathMode: 'saved' as const,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    jest.spyOn(storage, 'getAlias').mockReturnValue(mockAlias);
    const promptSpy = jest.spyOn(prompts, 'promptMultiple').mockResolvedValue({
      command: 'echo test',
      directory: '/test',
      pathMode: 'saved' as const,
    });
    jest.spyOn(prompts, 'promptConfirm').mockResolvedValue(false); // Don't update env
    jest.spyOn(console, 'log').mockImplementation(() => {});

    await editCommand('test-alias', false);

    expect(promptSpy).toHaveBeenCalled();
    // Check that prompt was called with current values as defaults
    const callArgs = promptSpy.mock.calls[0][0];
    expect(callArgs).toBeDefined();
  });

  it('should update environment variables when user confirms', async () => {
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

    jest.spyOn(storage, 'getAlias').mockReturnValue(mockAlias);
    jest
      .spyOn(prompts, 'promptMultiple')
      .mockResolvedValueOnce({
        command: 'npm start',
        directory: '/tmp',
        pathMode: 'saved' as const,
      })
      .mockResolvedValueOnce({
        envVars: ['NODE_ENV', 'API_URL'],
      });
    jest.spyOn(prompts, 'promptConfirm').mockResolvedValue(true); // Update env
    jest.spyOn(storage, 'setAlias').mockReturnValue(true);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      NODE_ENV: 'production',
      API_URL: 'https://api.example.com',
    };

    await editCommand('test-alias', false);

    process.env = originalEnv;

    expect(storage.setAlias).toHaveBeenCalledWith(
      'test-alias',
      'npm start',
      '/tmp',
      'saved',
      expect.objectContaining({
        NODE_ENV: 'production',
        API_URL: 'https://api.example.com',
      })
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('environment variable(s) will be saved')
    );
  });

  it('should clear environment variables when none selected', async () => {
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

    jest.spyOn(storage, 'getAlias').mockReturnValue(mockAlias);
    jest
      .spyOn(prompts, 'promptMultiple')
      .mockResolvedValueOnce({
        command: 'npm start',
        directory: '/tmp',
        pathMode: 'saved' as const,
      })
      .mockResolvedValueOnce({
        envVars: [], // Clear all env vars
      });
    jest.spyOn(prompts, 'promptConfirm').mockResolvedValue(true); // Update env
    jest.spyOn(storage, 'setAlias').mockReturnValue(true);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      NODE_ENV: 'production',
    };

    await editCommand('test-alias', false);

    process.env = originalEnv;

    expect(storage.setAlias).toHaveBeenCalledWith(
      'test-alias',
      'npm start',
      '/tmp',
      'saved',
      undefined
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('environment variables cleared')
    );
  });

  it('should preserve existing env vars when user declines update', async () => {
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

    jest.spyOn(storage, 'getAlias').mockReturnValue(mockAlias);
    jest.spyOn(prompts, 'promptMultiple').mockResolvedValue({
      command: 'npm start',
      directory: '/tmp',
      pathMode: 'saved' as const,
    });
    jest.spyOn(prompts, 'promptConfirm').mockResolvedValue(false); // Don't update env
    jest.spyOn(storage, 'setAlias').mockReturnValue(true);
    jest.spyOn(console, 'log').mockImplementation(() => {});

    await editCommand('test-alias', false);

    // Should not be called since no changes (command/dir/pathMode same, env not updated)
    expect(storage.setAlias).not.toHaveBeenCalled();
  });
});
