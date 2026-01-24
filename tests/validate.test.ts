import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { validateCommand, validateAllCommands } from '../src/commands/validate';
import * as storage from '../src/storage';
import * as validator from '../src/utils/validator';

describe('validate command', () => {
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

  describe('validateCommand', () => {
    it('should exit when command name is empty', () => {
      expect(() => validateCommand('')).toThrow('process.exit');
    });

    it('should exit when command name is whitespace only', () => {
      expect(() => validateCommand('   ')).toThrow('process.exit');
    });

    it('should exit when command does not exist', () => {
      jest.spyOn(storage, 'getAlias').mockReturnValue(undefined);

      expect(() => validateCommand('nonexistent')).toThrow('process.exit');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should validate command with no issues', () => {
      jest.spyOn(storage, 'getAlias').mockReturnValue({
        command: 'npm run build',
        directory: '/home/user/project',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });
      jest.spyOn(validator, 'validateCommandAlias').mockReturnValue({
        valid: true,
        issues: [],
      });

      validateCommand('build');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No issues found'));
    });

    it('should display command details when validation passes', () => {
      jest.spyOn(storage, 'getAlias').mockReturnValue({
        command: 'npm run build',
        directory: '/home/user/project',
        env: { NODE_ENV: 'production' },
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });
      jest.spyOn(validator, 'validateCommandAlias').mockReturnValue({
        valid: true,
        issues: [],
      });

      validateCommand('build');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('npm run build'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('/home/user/project'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Environment Variables'));
    });

    it('should display errors when validation fails', () => {
      jest.spyOn(storage, 'getAlias').mockReturnValue({
        command: 'echo "unclosed',
        directory: '/nonexistent',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });
      jest.spyOn(validator, 'validateCommandAlias').mockReturnValue({
        valid: false,
        issues: [
          {
            type: 'error',
            field: 'command',
            message: 'Unclosed double quote in command',
          },
          {
            type: 'error',
            field: 'directory',
            message: 'Directory "/nonexistent" does not exist',
          },
        ],
      });

      expect(() => validateCommand('bad-command')).toThrow('process.exit');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('error(s) found'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Unclosed double quote'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Validation failed'));
    });

    it('should display warnings when validation passes with warnings', () => {
      jest.spyOn(storage, 'getAlias').mockReturnValue({
        command: 'nonexistent-cmd',
        directory: '/home/user/project',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });
      jest.spyOn(validator, 'validateCommandAlias').mockReturnValue({
        valid: true,
        issues: [
          {
            type: 'warning',
            field: 'command',
            message: 'Command "nonexistent-cmd" not found in PATH',
          },
        ],
      });

      validateCommand('cmd-with-warning');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('warning(s) found'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('not found in PATH'));
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Validation passed with warnings')
      );
    });

    it('should display both errors and warnings', () => {
      jest.spyOn(storage, 'getAlias').mockReturnValue({
        command: 'echo "test',
        directory: '/home/user/project',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });
      jest.spyOn(validator, 'validateCommandAlias').mockReturnValue({
        valid: false,
        issues: [
          {
            type: 'error',
            field: 'command',
            message: 'Unclosed double quote',
          },
          {
            type: 'warning',
            field: 'command',
            message: 'Command not found in PATH',
          },
        ],
      });

      expect(() => validateCommand('mixed-issues')).toThrow('process.exit');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('error(s) found'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('warning(s) found'));
    });
  });

  describe('validateAllCommands', () => {
    it('should show message when no commands exist', () => {
      jest.spyOn(storage, 'loadAliases').mockReturnValue({});

      validateAllCommands();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('No commands to validate')
      );
    });

    it('should validate all commands and display summary', () => {
      jest.spyOn(storage, 'loadAliases').mockReturnValue({
        build: {
          command: 'npm run build',
          directory: '/home/user/project',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        test: {
          command: 'npm test',
          directory: '/home/user/project',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      });
      jest.spyOn(validator, 'validateCommandAlias').mockReturnValue({
        valid: true,
        issues: [],
      });

      validateAllCommands();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Validating 2 command(s)')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total commands: 2'));
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('All commands passed validation')
      );
    });

    it('should display commands alphabetically', () => {
      jest.spyOn(storage, 'loadAliases').mockReturnValue({
        zebra: {
          command: 'echo zebra',
          directory: '/home/user/project',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        alpha: {
          command: 'echo alpha',
          directory: '/home/user/project',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      });
      jest.spyOn(validator, 'validateCommandAlias').mockReturnValue({
        valid: true,
        issues: [],
      });

      validateAllCommands();

      const calls = consoleLogSpy.mock.calls.map((call) => call[0]);
      const alphaIndex = calls.findIndex((msg) => msg.includes('✓ alpha'));
      const zebraIndex = calls.findIndex((msg) => msg.includes('✓ zebra'));

      expect(alphaIndex).toBeLessThan(zebraIndex);
    });

    it('should count commands with warnings correctly', () => {
      jest.spyOn(storage, 'loadAliases').mockReturnValue({
        cmd1: {
          command: 'npm run build',
          directory: '/home/user/project',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        cmd2: {
          command: 'nonexistent-cmd',
          directory: '/home/user/project',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      });

      let callCount = 0;
      jest.spyOn(validator, 'validateCommandAlias').mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { valid: true, issues: [] };
        }
        return {
          valid: true,
          issues: [
            {
              type: 'warning',
              field: 'command',
              message: 'Command not found',
            },
          ],
        };
      });

      validateAllCommands();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('✓ Passed: 1'));
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('With warnings: 1 (1 warnings)')
      );
    });

    it('should exit with error status when commands have errors', () => {
      jest.spyOn(storage, 'loadAliases').mockReturnValue({
        'bad-cmd': {
          command: 'echo "unclosed',
          directory: '/home/user/project',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      });
      jest.spyOn(validator, 'validateCommandAlias').mockReturnValue({
        valid: false,
        issues: [
          {
            type: 'error',
            field: 'command',
            message: 'Unclosed quote',
          },
        ],
      });

      expect(() => validateAllCommands()).toThrow('process.exit');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('With errors: 1'));
    });

    it('should display detailed errors for each command', () => {
      jest.spyOn(storage, 'loadAliases').mockReturnValue({
        'bad-cmd': {
          command: 'echo "unclosed',
          directory: '/nonexistent',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      });
      jest.spyOn(validator, 'validateCommandAlias').mockReturnValue({
        valid: false,
        issues: [
          {
            type: 'error',
            field: 'command',
            message: 'Unclosed quote',
          },
          {
            type: 'error',
            field: 'directory',
            message: 'Directory does not exist',
          },
        ],
      });

      expect(() => validateAllCommands()).toThrow('process.exit');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('✗ bad-cmd'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Unclosed quote'));
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Directory does not exist')
      );
    });

    it('should show both errors and warnings for same command', () => {
      jest.spyOn(storage, 'loadAliases').mockReturnValue({
        'mixed-cmd': {
          command: 'echo "test',
          directory: '/home/user/project',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      });
      jest.spyOn(validator, 'validateCommandAlias').mockReturnValue({
        valid: false,
        issues: [
          {
            type: 'error',
            field: 'command',
            message: 'Unclosed quote',
          },
          {
            type: 'warning',
            field: 'command',
            message: 'Command not found',
          },
        ],
      });

      expect(() => validateAllCommands()).toThrow('process.exit');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Unclosed quote'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Command not found'));
    });

    it('should list all commands with errors at the end', () => {
      jest.spyOn(storage, 'loadAliases').mockReturnValue({
        good: {
          command: 'npm test',
          directory: '/home/user/project',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        bad1: {
          command: 'echo "test',
          directory: '/home/user/project',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        bad2: {
          command: 'nonexistent |',
          directory: '/home/user/project',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      });

      let callIndex = 0;
      const names = ['bad1', 'bad2', 'good'];
      jest.spyOn(validator, 'validateCommandAlias').mockImplementation(() => {
        const name = names[callIndex++];
        if (name === 'good') {
          return { valid: true, issues: [] };
        }
        return {
          valid: false,
          issues: [{ type: 'error', field: 'command', message: 'Error' }],
        };
      });

      expect(() => validateAllCommands()).toThrow('process.exit');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Commands with errors:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('- bad1'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('- bad2'));
    });

    it('should suggest running validate with specific command name', () => {
      jest.spyOn(storage, 'loadAliases').mockReturnValue({
        'bad-cmd': {
          command: 'echo "test',
          directory: '/home/user/project',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      });
      jest.spyOn(validator, 'validateCommandAlias').mockReturnValue({
        valid: false,
        issues: [{ type: 'error', field: 'command', message: 'Error' }],
      });

      expect(() => validateAllCommands()).toThrow('process.exit');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('aliasmate validate <name>')
      );
    });
  });
});
