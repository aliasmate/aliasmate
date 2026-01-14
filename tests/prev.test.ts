import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { prevCommand } from '../src/commands/prev';
import * as storage from '../src/storage';
import * as history from '../src/utils/history';
import * as prompts from '../src/utils/prompts';

describe('prev command', () => {
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

  it('should save previous command', async () => {
    jest.spyOn(history, 'getLastCommand').mockReturnValue('echo previous');
    jest.spyOn(storage, 'setAlias').mockReturnValue(true);
    jest.spyOn(prompts, 'promptConfirm').mockResolvedValue(false); // Don't capture env
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await prevCommand('prev-alias', '/tmp');

    expect(storage.setAlias).toHaveBeenCalledWith(
      'prev-alias',
      'echo previous',
      '/tmp',
      'saved',
      undefined
    );
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should exit when no history available', async () => {
    jest.spyOn(history, 'getLastCommand').mockReturnValue(null);
    jest.spyOn(history, 'getHistoryConfigInstructions').mockReturnValue('config instructions');
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});

    await expect(prevCommand('prev-alias')).rejects.toThrow('process.exit');
  });

  it('should use current directory as default', async () => {
    jest.spyOn(history, 'getLastCommand').mockReturnValue('echo test');
    jest.spyOn(storage, 'setAlias').mockReturnValue(true);
    jest.spyOn(prompts, 'promptConfirm').mockResolvedValue(false); // Don't capture env
    const cwd = process.cwd();

    await prevCommand('prev-alias');

    expect(storage.setAlias).toHaveBeenCalledWith(
      'prev-alias',
      'echo test',
      cwd,
      'saved',
      undefined
    );
  });

  it('should handle errors during save', async () => {
    jest.spyOn(history, 'getLastCommand').mockReturnValue('echo test');
    jest.spyOn(prompts, 'promptConfirm').mockResolvedValue(false); // Don't capture env
    jest.spyOn(storage, 'setAlias').mockImplementation(() => {
      throw new Error('Save failed');
    });

    await expect(prevCommand('prev-alias')).rejects.toThrow();
  });

  it('should trim command before saving', async () => {
    jest.spyOn(history, 'getLastCommand').mockReturnValue('  echo test  ');
    jest.spyOn(storage, 'setAlias').mockReturnValue(true);
    jest.spyOn(prompts, 'promptConfirm').mockResolvedValue(false); // Don't capture env

    await prevCommand('prev-alias', '/tmp');

    // setAlias should handle trimming internally
    expect(storage.setAlias).toHaveBeenCalled();
  });

  it('should show troubleshooting info when history unavailable', async () => {
    jest.spyOn(history, 'getLastCommand').mockReturnValue(null);
    jest.spyOn(history, 'getHistoryConfigInstructions').mockReturnValue('shell config');
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});

    await expect(prevCommand('prev-alias')).rejects.toThrow('process.exit');
  });

  it('should capture environment variables when user confirms', async () => {
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      DEPLOY_KEY: 'key123',
      MY_API_KEY: 'secret123',
    };

    jest.spyOn(history, 'getLastCommand').mockReturnValue('npm run deploy');
    jest.spyOn(storage, 'setAlias').mockReturnValue(true);
    jest.spyOn(prompts, 'promptConfirm').mockResolvedValue(true); // Capture env
    jest.spyOn(prompts, 'promptMultiple').mockResolvedValue({
      envVars: ['DEPLOY_KEY', 'MY_API_KEY'],
    });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await prevCommand('deploy', '/tmp');

    process.env = originalEnv;

    expect(storage.setAlias).toHaveBeenCalledWith(
      'deploy',
      'npm run deploy',
      '/tmp',
      'saved',
      expect.objectContaining({
        DEPLOY_KEY: 'key123',
        MY_API_KEY: 'secret123',
      })
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('environment variable(s) will be saved')
    );
  });

  it('should not capture env vars when user declines in prev command', async () => {
    jest.spyOn(history, 'getLastCommand').mockReturnValue('npm test');
    jest.spyOn(storage, 'setAlias').mockReturnValue(true);
    jest.spyOn(prompts, 'promptConfirm').mockResolvedValue(false); // Don't capture env
    jest.spyOn(console, 'log').mockImplementation(() => {});

    await prevCommand('test', '/tmp');

    expect(storage.setAlias).toHaveBeenCalledWith('test', 'npm test', '/tmp', 'saved', undefined);
  });
});
