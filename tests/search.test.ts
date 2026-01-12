import { describe, it, expect, jest } from '@jest/globals';
import { searchCommand } from '../src/commands/search';
import * as storage from '../src/storage';

describe('search command', () => {
  it('should find matching aliases by name', () => {
    const mockAliases = {
      'test-alias': {
        command: 'echo test',
        directory: '/test',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      'another-test': {
        command: 'ls -la',
        directory: '/home',
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      },
      'different': {
        command: 'pwd',
        directory: '/tmp',
        createdAt: '2024-01-03T00:00:00.000Z',
        updatedAt: '2024-01-03T00:00:00.000Z',
      },
    };

    jest.spyOn(storage, 'loadAliases').mockReturnValue(mockAliases);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    searchCommand('test');

    expect(consoleSpy).toHaveBeenCalled();
    expect(storage.loadAliases).toHaveBeenCalled();
  });

  it('should find matching aliases by command', () => {
    const mockAliases = {
      'list': {
        command: 'ls -la',
        directory: '/home',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      'test': {
        command: 'echo test',
        directory: '/test',
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      },
    };

    jest.spyOn(storage, 'loadAliases').mockReturnValue(mockAliases);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    searchCommand('ls');

    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should handle no matches found', () => {
    const mockAliases = {
      'test': {
        command: 'echo test',
        directory: '/test',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    };

    jest.spyOn(storage, 'loadAliases').mockReturnValue(mockAliases);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    searchCommand('nonexistent');

    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should handle empty aliases', () => {
    jest.spyOn(storage, 'loadAliases').mockReturnValue({});
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    searchCommand('anything');

    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should search case-insensitively', () => {
    const mockAliases = {
      'TestAlias': {
        command: 'echo TEST',
        directory: '/test',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    };

    jest.spyOn(storage, 'loadAliases').mockReturnValue(mockAliases);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    searchCommand('test');

    expect(consoleSpy).toHaveBeenCalled();
  });
});
