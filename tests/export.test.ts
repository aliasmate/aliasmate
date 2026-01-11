import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { exportCommand } from '../src/commands/export';
import * as storage from '../src/storage';
import * as fs from 'fs';

describe('export command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export aliases to file', async () => {
    const mockAliases = {
      'test-alias': {
        command: 'echo test',
        directory: '/test',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    };

    jest.spyOn(storage, 'loadAliases').mockReturnValue(mockAliases);
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const result = await exportCommand('/tmp/export.json');

    expect(result).toBe(true);
    expect(fs.writeFileSync).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should handle empty aliases', async () => {
    jest.spyOn(storage, 'loadAliases').mockReturnValue({});
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const result = await exportCommand('/tmp/export.json');

    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should handle write errors', async () => {
    const mockAliases = {
      'test': {
        command: 'echo test',
        directory: '/test',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    };

    jest.spyOn(storage, 'loadAliases').mockReturnValue(mockAliases);
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {
      throw new Error('Write failed');
    });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await exportCommand('/tmp/export.json');

    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should use default filename if not provided', async () => {
    const mockAliases = {
      'test': {
        command: 'echo test',
        directory: '/test',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    };

    jest.spyOn(storage, 'loadAliases').mockReturnValue(mockAliases);
    const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    await exportCommand('');

    expect(writeSpy).toHaveBeenCalled();
    // Check that it used a default filename
    const callArgs = writeSpy.mock.calls[0];
    expect(callArgs[0]).toContain('aliases');
  });

  it('should format JSON output correctly', async () => {
    const mockAliases = {
      'test': {
        command: 'echo test',
        directory: '/test',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    };

    jest.spyOn(storage, 'loadAliases').mockReturnValue(mockAliases);
    const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    await exportCommand('/tmp/export.json');

    const writtenData = writeSpy.mock.calls[0][1];
    expect(typeof writtenData).toBe('string');
    expect(() => JSON.parse(writtenData as string)).not.toThrow();
  });
});
