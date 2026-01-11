import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { deleteCommand } from '../src/commands/delete';
import * as storage from '../src/storage';

describe('delete command', () => {
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

  it('should delete alias when it exists', () => {
    // Mock storage
    jest.spyOn(storage, 'getAlias').mockReturnValue({
      command: 'echo test',
      directory: '/test',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    });
    jest.spyOn(storage, 'deleteAlias').mockReturnValue(true);
    jest.spyOn(console, 'log').mockImplementation(() => {});

    deleteCommand('test-alias');

    expect(storage.deleteAlias).toHaveBeenCalledWith('test-alias');
  });

  it('should exit when alias does not exist', () => {
    jest.spyOn(storage, 'getAlias').mockReturnValue(undefined);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});

    expect(() => deleteCommand('nonexistent')).toThrow('process.exit');
  });

  it('should exit when name is empty', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => deleteCommand('')).toThrow('process.exit');
  });
});
