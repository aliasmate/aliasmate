import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { exportCommand } from '../src/commands/export';
import * as storage from '../src/storage';
import * as fs from 'fs';

// Mock fs module properly
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

describe('export command', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;
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
    mockFs.existsSync.mockReturnValue(false);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    exportCommand('/tmp/export.json');

    expect(mockFs.writeFileSync).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should handle empty aliases', () => {
    jest.spyOn(storage, 'loadAliases').mockReturnValue({});
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    exportCommand('/tmp/export.json');

    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should handle write errors', () => {
    const mockAliases = {
      test: {
        command: 'echo test',
        directory: '/test',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    };

    jest.spyOn(storage, 'loadAliases').mockReturnValue(mockAliases);
    mockFs.existsSync.mockReturnValue(false);
    mockFs.writeFileSync.mockImplementation(() => {
      throw new Error('Write failed');
    });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => exportCommand('/tmp/export.json')).toThrow('process.exit');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should use default filename if not provided', () => {
    const mockAliases = {
      test: {
        command: 'echo test',
        directory: '/test',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    };

    jest.spyOn(storage, 'loadAliases').mockReturnValue(mockAliases);
    mockFs.existsSync.mockReturnValue(false);

    // Empty path should cause exitWithError
    expect(() => exportCommand('')).toThrow('process.exit');
  });

  it('should format JSON output correctly', () => {
    const mockAliases = {
      test: {
        command: 'echo test',
        directory: '/test',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    };

    jest.spyOn(storage, 'loadAliases').mockReturnValue(mockAliases);
    jest.spyOn(console, 'log').mockImplementation(() => {});
    // First call: check if file exists (false), second call: check if directory exists (true)
    mockFs.existsSync
      .mockReturnValueOnce(false) // file doesn't exist
      .mockReturnValueOnce(true); // directory exists
    mockFs.writeFileSync.mockReturnValue(undefined);

    exportCommand('/tmp/export.json');

    expect(mockFs.writeFileSync).toHaveBeenCalled();
    const writtenData = mockFs.writeFileSync.mock.calls[0][1];
    expect(typeof writtenData).toBe('string');
    expect(() => JSON.parse(writtenData as string)).not.toThrow();
  });
});
