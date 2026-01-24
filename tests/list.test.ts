import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { listCommand } from '../src/commands/list';
import * as storage from '../src/storage';

describe('list command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should list all aliases', () => {
    const mockAliases = {
      'test-alias': {
        command: 'echo test',
        directory: '/test',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      'another-alias': {
        command: 'ls -la',
        directory: '/home',
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      },
    };

    jest.spyOn(storage, 'loadAliases').mockReturnValue(mockAliases);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    listCommand();

    expect(consoleSpy).toHaveBeenCalled();
    expect(storage.loadAliases).toHaveBeenCalled();
  });

  it('should handle empty aliases', () => {
    jest.spyOn(storage, 'loadAliases').mockReturnValue({});
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    listCommand();

    expect(consoleSpy).toHaveBeenCalled();
    expect(storage.loadAliases).toHaveBeenCalled();
  });

  it('should display alias details correctly', () => {
    const mockAliases = {
      test: {
        command: 'echo hello',
        directory: '/tmp',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    };

    jest.spyOn(storage, 'loadAliases').mockReturnValue(mockAliases);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    listCommand();

    // Verify that key information is logged
    expect(consoleSpy).toHaveBeenCalled();
    const calls = consoleSpy.mock.calls.flat().join(' ');
    expect(calls).toContain('test');
  });

  it('should format as JSON when specified', () => {
    const mockAliases = {
      test: {
        command: 'echo hello',
        directory: '/tmp',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    };

    jest.spyOn(storage, 'loadAliases').mockReturnValue(mockAliases);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    listCommand('json');

    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(output as string);
    expect(parsed.test).toBeDefined();
    expect(parsed.test.command).toBe('echo hello');
  });

  it('should format as YAML when specified', () => {
    const mockAliases = {
      test: {
        command: 'echo hello',
        directory: '/tmp',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    };

    jest.spyOn(storage, 'loadAliases').mockReturnValue(mockAliases);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    listCommand('yaml');

    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0][0] as string;
    expect(output).toContain('test:');
    expect(output).toContain('command: "echo hello"');
  });

  it('should format as compact when specified', () => {
    const mockAliases = {
      test: {
        command: 'echo hello',
        directory: '/tmp',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    };

    jest.spyOn(storage, 'loadAliases').mockReturnValue(mockAliases);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    listCommand('compact');

    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0][0] as string;
    expect(output).toContain(' | ');
    expect(output).toContain('test');
  });

  it('should output empty JSON for no commands in JSON format', () => {
    jest.spyOn(storage, 'loadAliases').mockReturnValue({});
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    listCommand('json');

    expect(consoleSpy).toHaveBeenCalledWith('{}');
  });

  it('should output empty string for no commands in YAML format', () => {
    jest.spyOn(storage, 'loadAliases').mockReturnValue({});
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    listCommand('yaml');

    expect(consoleSpy).toHaveBeenCalledWith('');
  });
});
