import { describe, it, expect, jest } from '@jest/globals';
import { listCommand } from '../src/commands/list';
import * as storage from '../src/storage';

describe('list command', () => {
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
      'test': {
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
});
