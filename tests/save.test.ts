import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { saveCommand } from '../src/commands/save';
import * as storage from '../src/storage';
import * as prompts from '../src/utils/prompts';

describe('save command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save a new alias', async () => {
    jest.spyOn(prompts, 'promptMultiple').mockResolvedValue({
      name: 'test-alias',
      command: 'echo test',
      directory: '/tmp',
      pathMode: 'saved' as const,
    });
    jest.spyOn(storage, 'aliasExists').mockReturnValue(false);
    jest.spyOn(storage, 'setAlias').mockReturnValue(true);
    jest.spyOn(prompts, 'promptConfirm').mockResolvedValue(false); // Don't capture env
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await saveCommand(undefined, false); // Skip validation

    expect(storage.setAlias).toHaveBeenCalledWith(
      'test-alias',
      'echo test',
      '/tmp',
      'saved',
      undefined
    );
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should prompt for overwrite when alias exists', async () => {
    jest.spyOn(prompts, 'promptMultiple').mockResolvedValue({
      name: 'existing',
      command: 'echo test',
      directory: '/tmp',
      pathMode: 'saved' as const,
    });
    jest.spyOn(storage, 'aliasExists').mockReturnValue(true);
    jest
      .spyOn(prompts, 'promptConfirm')
      .mockResolvedValueOnce(true) // Overwrite
      .mockResolvedValueOnce(false); // Don't capture env
    jest.spyOn(storage, 'setAlias').mockReturnValue(true);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await saveCommand(undefined, false); // Skip validation

    expect(storage.setAlias).toHaveBeenCalledWith(
      'existing',
      'echo test',
      '/tmp',
      'saved',
      undefined
    );
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should not overwrite when user declines', async () => {
    jest.spyOn(prompts, 'promptMultiple').mockResolvedValue({
      name: 'existing',
      command: 'echo test',
      directory: '/tmp',
      pathMode: 'saved' as const,
    });
    jest.spyOn(storage, 'aliasExists').mockReturnValue(true);
    jest
      .spyOn(prompts, 'promptConfirm')
      .mockResolvedValueOnce(false) // Don't overwrite
      .mockResolvedValueOnce(false); // No more aliases
    jest.spyOn(storage, 'setAlias').mockReturnValue(true);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await saveCommand(undefined, false); // Skip validation

    expect(storage.setAlias).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should save alias with different path modes', async () => {
    jest.spyOn(prompts, 'promptMultiple').mockResolvedValue({
      name: 'test-current',
      command: 'echo test',
      directory: '/tmp',
      pathMode: 'current' as const,
    });
    jest.spyOn(storage, 'aliasExists').mockReturnValue(false);
    jest.spyOn(storage, 'setAlias').mockReturnValue(true);
    jest.spyOn(prompts, 'promptConfirm').mockResolvedValue(false); // Don't capture env
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await saveCommand(undefined, false); // Skip validation

    expect(storage.setAlias).toHaveBeenCalledWith(
      'test-current',
      'echo test',
      '/tmp',
      'current',
      undefined
    );
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should use provided cwd as default', async () => {
    const promptSpy = jest.spyOn(prompts, 'promptMultiple').mockResolvedValue({
      name: 'test',
      command: 'echo test',
      directory: '/custom/path',
      pathMode: 'saved' as const,
    });
    jest.spyOn(storage, 'aliasExists').mockReturnValue(false);
    jest.spyOn(storage, 'setAlias').mockReturnValue(true);
    jest.spyOn(prompts, 'promptConfirm').mockResolvedValue(false); // Don't capture env

    await saveCommand('/custom/path', false); // Skip validation

    // The custom path should be used as the default in prompts
    expect(promptSpy).toHaveBeenCalled();
    const callArgs = promptSpy.mock.calls[0][0];
    const dirPrompt = callArgs.find((p: any) => p.name === 'directory') as any;
    expect(dirPrompt.default).toBe('/custom/path');
  });

  it('should capture environment variables when user confirms', async () => {
    jest
      .spyOn(prompts, 'promptMultiple')
      .mockResolvedValueOnce({
        name: 'test-env',
        command: 'npm start',
        directory: '/tmp',
        pathMode: 'saved' as const,
      })
      .mockResolvedValueOnce({
        envVars: ['APP_ENV', 'API_URL'],
      });
    jest.spyOn(storage, 'aliasExists').mockReturnValue(false);
    jest.spyOn(storage, 'setAlias').mockReturnValue(true);
    jest.spyOn(prompts, 'promptConfirm').mockResolvedValue(true); // Capture env
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Mock process.env to have user variables
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      APP_ENV: 'production',
      API_URL: 'https://api.example.com',
      PATH: '/usr/bin',
    };

    await saveCommand(undefined, false); // Skip validation

    process.env = originalEnv;

    expect(storage.setAlias).toHaveBeenCalledWith(
      'test-env',
      'npm start',
      '/tmp',
      'saved',
      expect.objectContaining({
        APP_ENV: 'production',
        API_URL: 'https://api.example.com',
      })
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('environment variable(s) will be saved')
    );
  });

  it('should not capture env vars when user declines', async () => {
    jest.spyOn(prompts, 'promptMultiple').mockResolvedValue({
      name: 'test-no-env',
      command: 'npm test',
      directory: '/tmp',
      pathMode: 'saved' as const,
    });
    jest.spyOn(storage, 'aliasExists').mockReturnValue(false);
    jest.spyOn(storage, 'setAlias').mockReturnValue(true);
    jest.spyOn(prompts, 'promptConfirm').mockResolvedValue(false); // Don't capture env
    jest.spyOn(console, 'log').mockImplementation(() => {});

    await saveCommand(undefined, false); // Skip validation

    expect(storage.setAlias).toHaveBeenCalledWith(
      'test-no-env',
      'npm test',
      '/tmp',
      'saved',
      undefined
    );
  });

  it('should handle empty environment variable selection', async () => {
    jest
      .spyOn(prompts, 'promptMultiple')
      .mockResolvedValueOnce({
        name: 'test-empty-env',
        command: 'echo test',
        directory: '/tmp',
        pathMode: 'saved' as const,
      })
      .mockResolvedValueOnce({
        envVars: [], // No vars selected
      });
    jest.spyOn(storage, 'aliasExists').mockReturnValue(false);
    jest.spyOn(storage, 'setAlias').mockReturnValue(true);
    jest.spyOn(prompts, 'promptConfirm').mockResolvedValue(true); // Try to capture env
    jest.spyOn(console, 'log').mockImplementation(() => {});

    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      MY_VAR: 'value',
    };

    await saveCommand(undefined, false); // Skip validation

    process.env = originalEnv;

    // Should save without env vars when none selected
    expect(storage.setAlias).toHaveBeenCalledWith(
      'test-empty-env',
      'echo test',
      '/tmp',
      'saved',
      undefined
    );
  });
});
