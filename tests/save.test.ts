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
    jest.spyOn(prompts, 'promptConfirm').mockResolvedValue(false); // No more aliases
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await saveCommand();

    expect(storage.setAlias).toHaveBeenCalledWith('test-alias', 'echo test', '/tmp', 'saved');
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
      .mockResolvedValueOnce(false); // No more aliases
    jest.spyOn(storage, 'setAlias').mockReturnValue(true);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await saveCommand();

    expect(storage.setAlias).toHaveBeenCalledWith('existing', 'echo test', '/tmp', 'saved');
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

    await saveCommand();

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
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await saveCommand();

    expect(storage.setAlias).toHaveBeenCalledWith('test-current', 'echo test', '/tmp', 'current');
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

    await saveCommand('/custom/path');

    // The custom path should be used as the default in prompts
    expect(promptSpy).toHaveBeenCalled();
    const callArgs = promptSpy.mock.calls[0][0];
    const dirPrompt = callArgs.find((p: any) => p.name === 'directory') as any;
    expect(dirPrompt.default).toBe('/custom/path');
  });
});
