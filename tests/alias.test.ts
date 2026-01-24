import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  createAliasCommand,
  listAliasesCommand,
  removeAliasCommand,
  resolveAlias,
  isAlias,
} from '../src/commands/alias';
import * as storage from '../src/storage';

describe('alias commands', () => {
  let exitSpy: jest.SpiedFunction<typeof process.exit>;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    jest.clearAllMocks();
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null) => {
      throw new Error(`process.exit: ${code}`);
    });
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('createAliasCommand', () => {
    it('should create a new alias for an existing command', () => {
      // Mock storage
      jest.spyOn(storage, 'getAlias').mockReturnValue({
        command: 'npm run build',
        directory: '/test/project',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });
      jest.spyOn(storage, 'loadMetadata').mockReturnValue({});
      jest.spyOn(storage, 'saveMetadata').mockReturnValue(true);

      createAliasCommand('b', 'build-prod');

      expect(storage.saveMetadata).toHaveBeenCalledWith({
        command_aliases: {
          b: 'build-prod',
        },
      });
    });

    it('should update an existing alias', () => {
      // Mock storage
      jest.spyOn(storage, 'getAlias').mockReturnValue({
        command: 'npm run deploy',
        directory: '/test/project',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });
      jest.spyOn(storage, 'loadMetadata').mockReturnValue({
        command_aliases: {
          d: 'deploy-staging',
        },
      });
      jest.spyOn(storage, 'saveMetadata').mockReturnValue(true);

      createAliasCommand('d', 'deploy-prod');

      expect(storage.saveMetadata).toHaveBeenCalledWith({
        command_aliases: {
          d: 'deploy-prod',
        },
      });
    });

    it('should exit when target command does not exist', () => {
      jest.spyOn(storage, 'getAlias').mockReturnValue(undefined);

      expect(() => createAliasCommand('b', 'nonexistent')).toThrow('process.exit');
    });

    it('should exit when alias name is empty', () => {
      expect(() => createAliasCommand('', 'build')).toThrow('process.exit');
    });

    it('should exit when command name is empty', () => {
      expect(() => createAliasCommand('b', '')).toThrow('process.exit');
    });

    it('should reject alias names with spaces', () => {
      expect(() => createAliasCommand('my alias', 'build')).toThrow('process.exit');
    });

    it('should reject alias names with special characters', () => {
      expect(() => createAliasCommand('b@d', 'build')).toThrow('process.exit');
      expect(() => createAliasCommand('b!d', 'build')).toThrow('process.exit');
      expect(() => createAliasCommand('b$d', 'build')).toThrow('process.exit');
    });

    it('should accept alias names with alphanumeric, dash, and underscore', () => {
      jest.spyOn(storage, 'getAlias').mockReturnValue({
        command: 'npm run build',
        directory: '/test/project',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });
      jest.spyOn(storage, 'loadMetadata').mockReturnValue({});
      jest.spyOn(storage, 'saveMetadata').mockReturnValue(true);

      expect(() => createAliasCommand('build-1', 'build-prod')).not.toThrow();
      expect(() => createAliasCommand('build_test', 'build-prod')).not.toThrow();
      expect(() => createAliasCommand('b123', 'build-prod')).not.toThrow();
    });

    it('should reject reserved command names', () => {
      const reservedCommands = [
        'prev',
        'run',
        'save',
        'list',
        'ls',
        'search',
        'find',
        'delete',
        'rm',
        'edit',
        'export',
        'import',
        'config',
        'changelog',
        'alias',
        'help',
        'version',
      ];

      for (const reserved of reservedCommands) {
        expect(() => createAliasCommand(reserved, 'build')).toThrow('process.exit');
      }
    });
  });

  describe('listAliasesCommand', () => {
    it('should list all aliases', () => {
      jest.spyOn(storage, 'loadMetadata').mockReturnValue({
        command_aliases: {
          b: 'build-prod',
          d: 'deploy-prod',
        },
      });
      jest.spyOn(storage, 'getAlias').mockImplementation((name: string) => {
        if (name === 'build-prod') {
          return {
            command: 'npm run build',
            directory: '/test/project',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          };
        }
        if (name === 'deploy-prod') {
          return {
            command: 'npm run deploy',
            directory: '/test/project',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          };
        }
        return undefined;
      });

      listAliasesCommand();

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should show message when no aliases exist', () => {
      jest.spyOn(storage, 'loadMetadata').mockReturnValue({});

      listAliasesCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No aliases defined'));
    });

    it('should show warning when target command is missing', () => {
      jest.spyOn(storage, 'loadMetadata').mockReturnValue({
        command_aliases: {
          b: 'build-prod',
        },
      });
      jest.spyOn(storage, 'getAlias').mockReturnValue(undefined);

      listAliasesCommand();

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('removeAliasCommand', () => {
    it('should remove an existing alias', () => {
      jest.spyOn(storage, 'loadMetadata').mockReturnValue({
        command_aliases: {
          b: 'build-prod',
          d: 'deploy-prod',
        },
      });
      jest.spyOn(storage, 'saveMetadata').mockReturnValue(true);

      removeAliasCommand('b');

      expect(storage.saveMetadata).toHaveBeenCalledWith({
        command_aliases: {
          d: 'deploy-prod',
        },
      });
    });

    it('should exit when alias does not exist', () => {
      jest.spyOn(storage, 'loadMetadata').mockReturnValue({});

      expect(() => removeAliasCommand('nonexistent')).toThrow('process.exit');
    });

    it('should exit when alias name is empty', () => {
      expect(() => removeAliasCommand('')).toThrow('process.exit');
    });
  });

  describe('resolveAlias', () => {
    it('should resolve alias to target command name', () => {
      jest.spyOn(storage, 'loadMetadata').mockReturnValue({
        command_aliases: {
          b: 'build-prod',
        },
      });

      const result = resolveAlias('b');

      expect(result).toBe('build-prod');
    });

    it('should return original name if not an alias', () => {
      jest.spyOn(storage, 'loadMetadata').mockReturnValue({
        command_aliases: {
          b: 'build-prod',
        },
      });

      const result = resolveAlias('deploy-prod');

      expect(result).toBe('deploy-prod');
    });

    it('should return original name when no aliases exist', () => {
      jest.spyOn(storage, 'loadMetadata').mockReturnValue({});

      const result = resolveAlias('build-prod');

      expect(result).toBe('build-prod');
    });
  });

  describe('isAlias', () => {
    it('should return true for an existing alias', () => {
      jest.spyOn(storage, 'loadMetadata').mockReturnValue({
        command_aliases: {
          b: 'build-prod',
        },
      });

      const result = isAlias('b');

      expect(result).toBe(true);
    });

    it('should return false for a non-alias', () => {
      jest.spyOn(storage, 'loadMetadata').mockReturnValue({
        command_aliases: {
          b: 'build-prod',
        },
      });

      const result = isAlias('deploy-prod');

      expect(result).toBe(false);
    });

    it('should return false when no aliases exist', () => {
      jest.spyOn(storage, 'loadMetadata').mockReturnValue({});

      const result = isAlias('anything');

      expect(result).toBe(false);
    });
  });
});
