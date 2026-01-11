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
    });
    jest.spyOn(storage, 'aliasExists').mockReturnValue(false);
    jest.spyOn(storage, 'setAlias').mockReturnValue(true);
    jest.spyOn(prompts, 'promptConfirm').mockResolvedValue(false); // No more aliases
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await saveCommand();

    expect(storage.setAlias).toHaveBeenCalledWith('test-alias', 'echo test', '/tmp');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should prompt for overwrite when alias exists', async () => {
    jest.spyOn(prompts, 'promptMultiple').mockResolvedValue({
      name: 'existing',
      command: 'echo test',
      directory: '/tmp',
    });
    jest.spyOn(storage, 'aliasExists').mockReturnValue(true);
    jest
      .spyOn(prompts, 'promptConfirm')
      .mockResolvedValueOnce(true) // Overwrite
      .mockResolvedValueOnce(false); // No more aliases
    jest.spyOn(storage, 'setAlias').mockReturnValue(true);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await saveCommand();

    expect(storage.setAlias).toHaveBeenCalledWith('existing', 'echo test', '/tmp');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should not overwrite when user declines', async () => {
    jest.spyOn(prompts, 'promptMultiple').mockResolvedValue({
      name: 'existing',
      command: 'echo test',
      directory: '/tmp',
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

  it('should allow saving multiple aliases', async () => {
    jest
      .spyOn(prompts, 'promptMultiple')
      .mockResolvedValueOnce({
        name: 'alias1',
        command: 'echo 1',
        directory: '/tmp',
      })
      .mockResolvedValueOnce({
        name: 'alias2',
        command: 'echo 2',
        directory: '/tmp',
      });
    jest.spyOn(storage, 'aliasExists').mockReturnValue(false);
    jest.spyOn(storage, 'setAlias').mockReturnValue(true);
    jest
      .spyOn(prompts, 'promptConfirm')
      .mockResolvedValueOnce(true) // Save another
      .mockResolvedValueOnce(false); // Stop

    await saveCommand();

    expect(storage.setAlias).toHaveBeenCalledTimes(2);
    expect(storage.setAlias).toHaveBeenCalledWith('alias1', 'echo 1', '/tmp');
    expect(storage.setAlias).toHaveBeenCalledWith('alias2', 'echo 2', '/tmp');
  });

  it('should use provided cwd as default', async () => {
    jest.spyOn(prompts, 'promptMultiple').mockResolvedValue({
      name: 'test',
      command: 'echo test',
      directory: '/custom/path',
    });
    jest.spyOn(storage, 'aliasExists').mockReturnValue(false);
    jest.spyOn(storage, 'setAlias').mockReturnValue(true);
    jest.spyOn(prompts, 'promptConfirm').mockResolvedValue(false);

    await saveCommand('/custom/path');

    expect(storage.setAlias).toHaveBeenCalledWith('test', 'echo test', '/custom/path');
  });
});
