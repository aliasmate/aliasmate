import { describe, it, expect, beforeEach } from '@jest/globals';
import { recentCommand } from '../src/commands/recent';
import * as storage from '../src/storage';
import * as recent from '../src/utils/recent';

describe('recent command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display message when no recent commands', () => {
    jest.spyOn(recent, 'getRecentCommandsWithTimestamps').mockReturnValue([]);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    recentCommand({});

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No recent commands found'));
  });

  it('should display recent commands with timestamps', () => {
    const mockHistory = [
      {
        commandName: 'test1',
        executedAt: new Date().toISOString(),
      },
      {
        commandName: 'test2',
        executedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      },
    ];

    jest.spyOn(recent, 'getRecentCommandsWithTimestamps').mockReturnValue(mockHistory);
    jest.spyOn(recent, 'getRecentConfig').mockReturnValue({ maxSize: 50 });
    jest.spyOn(storage, 'getAlias').mockImplementation((name: string) => ({
      command: `echo ${name}`,
      directory: '/tmp',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    recentCommand({});

    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls.map((call) => call.join(' ')).join('\n');
    expect(output).toContain('Recent commands');
    expect(output).toContain('@0');
    expect(output).toContain('test1');
  });

  it('should respect limit option', () => {
    const mockHistory = [
      { commandName: 'test1', executedAt: new Date().toISOString() },
      { commandName: 'test2', executedAt: new Date().toISOString() },
      { commandName: 'test3', executedAt: new Date().toISOString() },
    ];

    jest.spyOn(recent, 'getRecentCommandsWithTimestamps').mockReturnValue(mockHistory);
    jest.spyOn(recent, 'getRecentConfig').mockReturnValue({ maxSize: 50 });
    jest.spyOn(storage, 'getAlias').mockImplementation((name: string) => ({
      command: `echo ${name}`,
      directory: '/tmp',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    jest.spyOn(console, 'log').mockImplementation(() => {});

    recentCommand({ limit: 2 });

    expect(recent.getRecentCommandsWithTimestamps).toHaveBeenCalledWith(2);
  });

  it('should clear execution history when --clear flag is used', () => {
    const clearSpy = jest.spyOn(recent, 'clearExecutionHistory').mockReturnValue(true);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    recentCommand({ clear: true });

    expect(clearSpy).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('history cleared'));
  });

  it('should show error when clear fails', () => {
    jest.spyOn(recent, 'clearExecutionHistory').mockReturnValue(false);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation((code?: string | number | null) => {
        throw new Error(`process.exit: ${code}`);
      });

    expect(() => recentCommand({ clear: true })).toThrow('process.exit');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to clear execution history')
    );

    exitSpy.mockRestore();
  });

  it('should indicate when a command no longer exists', () => {
    const mockHistory = [{ commandName: 'deleted-cmd', executedAt: new Date().toISOString() }];

    jest.spyOn(recent, 'getRecentCommandsWithTimestamps').mockReturnValue(mockHistory);
    jest.spyOn(recent, 'getRecentConfig').mockReturnValue({ maxSize: 50 });
    jest.spyOn(storage, 'getAlias').mockReturnValue(undefined);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    recentCommand({});

    const output = consoleSpy.mock.calls.map((call) => call.join(' ')).join('\n');
    expect(output).toContain('Command no longer exists');
  });

  it('should show execution count for commands run multiple times', () => {
    const mockHistory = [
      { commandName: 'test1', executedAt: new Date().toISOString() },
      { commandName: 'test2', executedAt: new Date().toISOString() },
      { commandName: 'test1', executedAt: new Date(Date.now() - 3600000).toISOString() },
    ];

    jest.spyOn(recent, 'getRecentCommandsWithTimestamps').mockReturnValue(mockHistory);
    jest.spyOn(recent, 'getRecentConfig').mockReturnValue({ maxSize: 50 });
    jest.spyOn(storage, 'getAlias').mockImplementation((name: string) => ({
      command: `echo ${name}`,
      directory: '/tmp',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    recentCommand({});

    const output = consoleSpy.mock.calls.map((call) => call.join(' ')).join('\n');
    expect(output).toContain('2 times');
  });
});
