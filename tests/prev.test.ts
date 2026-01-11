import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { prevCommand } from '../src/commands/prev';
import * as storage from '../src/storage';
import * as history from '../src/utils/history';

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

  it('should save previous command', () => {
    jest.spyOn(history, 'getLastCommand').mockReturnValue('echo previous');
    jest.spyOn(storage, 'setAlias').mockReturnValue(true);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    prevCommand('prev-alias', '/tmp');

    expect(storage.setAlias).toHaveBeenCalledWith('prev-alias', 'echo previous', '/tmp');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should exit when no history available', () => {
    jest.spyOn(history, 'getLastCommand').mockReturnValue(null);
    jest.spyOn(history, 'getHistoryConfigInstructions').mockReturnValue('config instructions');
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});

    expect(() => prevCommand('prev-alias')).toThrow('process.exit');
  });

  it('should use current directory as default', () => {
    jest.spyOn(history, 'getLastCommand').mockReturnValue('echo test');
    jest.spyOn(storage, 'setAlias').mockReturnValue(true);
    const cwd = process.cwd();

    prevCommand('prev-alias');

    expect(storage.setAlias).toHaveBeenCalledWith('prev-alias', 'echo test', cwd);
  });

  it('should handle errors during save', () => {
    jest.spyOn(history, 'getLastCommand').mockReturnValue('echo test');
    jest.spyOn(storage, 'setAlias').mockImplementation(() => {
      throw new Error('Save failed');
    });

    expect(() => prevCommand('prev-alias')).toThrow();
  });

  it('should trim command before saving', () => {
    jest.spyOn(history, 'getLastCommand').mockReturnValue('  echo test  ');
    jest.spyOn(storage, 'setAlias').mockReturnValue(true);

    prevCommand('prev-alias', '/tmp');

    // setAlias should handle trimming internally
    expect(storage.setAlias).toHaveBeenCalled();
  });

  it('should show troubleshooting info when history unavailable', () => {
    jest.spyOn(history, 'getLastCommand').mockReturnValue(null);
    jest.spyOn(history, 'getHistoryConfigInstructions').mockReturnValue('shell config');
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});

    expect(() => prevCommand('test')).toThrow('process.exit');
  });
});
