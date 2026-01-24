import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  completionCommand,
  generateBashCompletion,
  generateZshCompletion,
  generateFishCompletion,
} from '../src/commands/completion';
import * as storage from '../src/storage';

describe('completion commands', () => {
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

  describe('generateBashCompletion', () => {
    it('should generate valid bash completion script', () => {
      jest.spyOn(storage, 'loadAliases').mockReturnValue({
        'build-prod': {
          command: 'npm run build',
          directory: '/test/project',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        deploy: {
          command: 'npm run deploy',
          directory: '/test/project',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      });

      const result = generateBashCompletion();

      expect(result).toContain('_aliasmate_completion');
      expect(result).toContain('complete -F _aliasmate_completion aliasmate');
      expect(result).toContain('build-prod deploy');
    });

    it('should include all main commands', () => {
      jest.spyOn(storage, 'loadAliases').mockReturnValue({});

      const result = generateBashCompletion();

      expect(result).toContain('prev');
      expect(result).toContain('run');
      expect(result).toContain('save');
      expect(result).toContain('list');
      expect(result).toContain('export');
      expect(result).toContain('import');
      expect(result).toContain('alias');
      expect(result).toContain('validate');
      expect(result).toContain('completion');
    });

    it('should handle empty command list', () => {
      jest.spyOn(storage, 'loadAliases').mockReturnValue({});

      const result = generateBashCompletion();

      expect(result).toContain('_aliasmate_completion');
      expect(result).toContain('complete -F _aliasmate_completion aliasmate');
    });
  });

  describe('generateZshCompletion', () => {
    it('should generate valid zsh completion script', () => {
      jest.spyOn(storage, 'loadAliases').mockReturnValue({
        'build-prod': {
          command: 'npm run build',
          directory: '/test/project',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        deploy: {
          command: 'npm run deploy',
          directory: '/test/project',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      });

      const result = generateZshCompletion();

      expect(result).toContain('#compdef aliasmate');
      expect(result).toContain('_aliasmate');
      expect(result).toContain('compdef _aliasmate aliasmate');
      expect(result).toContain("'build-prod'");
      expect(result).toContain("'deploy'");
    });

    it('should include command descriptions', () => {
      jest.spyOn(storage, 'loadAliases').mockReturnValue({});

      const result = generateZshCompletion();

      expect(result).toContain('Save previous command from history');
      expect(result).toContain('Run a saved command');
      expect(result).toContain('List all saved commands');
      expect(result).toContain('Generate shell completion script');
    });

    it('should handle empty command list', () => {
      jest.spyOn(storage, 'loadAliases').mockReturnValue({});

      const result = generateZshCompletion();

      expect(result).toContain('#compdef aliasmate');
      expect(result).toContain('_aliasmate');
    });
  });

  describe('generateFishCompletion', () => {
    it('should generate valid fish completion script', () => {
      jest.spyOn(storage, 'loadAliases').mockReturnValue({
        'build-prod': {
          command: 'npm run build',
          directory: '/test/project',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        deploy: {
          command: 'npm run deploy',
          directory: '/test/project',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      });

      const result = generateFishCompletion();

      expect(result).toContain('complete -c aliasmate');
      expect(result).toContain('__fish_use_subcommand');
      expect(result).toContain('build-prod');
      expect(result).toContain('deploy');
    });

    it('should include all main commands with descriptions', () => {
      jest.spyOn(storage, 'loadAliases').mockReturnValue({});

      const result = generateFishCompletion();

      expect(result).toContain('-a "prev"');
      expect(result).toContain('-a "run"');
      expect(result).toContain('-a "save"');
      expect(result).toContain('-a "list"');
      expect(result).toContain('-a "completion"');
      expect(result).toContain('Save previous command from history');
      expect(result).toContain('Run a saved command');
    });

    it('should disable file completion by default', () => {
      jest.spyOn(storage, 'loadAliases').mockReturnValue({});

      const result = generateFishCompletion();

      expect(result).toContain('complete -c aliasmate -f');
    });

    it('should handle empty command list', () => {
      jest.spyOn(storage, 'loadAliases').mockReturnValue({});

      const result = generateFishCompletion();

      expect(result).toContain('complete -c aliasmate');
    });
  });

  describe('completionCommand', () => {
    it('should output bash completion script', () => {
      jest.spyOn(storage, 'loadAliases').mockReturnValue({});

      completionCommand('bash');

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = (consoleLogSpy.mock.calls[0] as string[])[0];
      expect(output).toContain('_aliasmate_completion');
    });

    it('should output zsh completion script', () => {
      jest.spyOn(storage, 'loadAliases').mockReturnValue({});

      completionCommand('zsh');

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = (consoleLogSpy.mock.calls[0] as string[])[0];
      expect(output).toContain('#compdef aliasmate');
    });

    it('should output fish completion script', () => {
      jest.spyOn(storage, 'loadAliases').mockReturnValue({});

      completionCommand('fish');

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = (consoleLogSpy.mock.calls[0] as string[])[0];
      expect(output).toContain('complete -c aliasmate');
    });

    it('should handle uppercase shell names', () => {
      jest.spyOn(storage, 'loadAliases').mockReturnValue({});

      completionCommand('BASH');

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = (consoleLogSpy.mock.calls[0] as string[])[0];
      expect(output).toContain('_aliasmate_completion');
    });

    it('should show usage when no shell is provided', () => {
      completionCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('bash'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('zsh'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('fish'));
    });

    it('should exit with error for unsupported shell', () => {
      jest.spyOn(storage, 'loadAliases').mockReturnValue({});

      expect(() => completionCommand('powershell')).toThrow('process.exit');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Unsupported shell'));
    });

    it('should show examples in usage message', () => {
      completionCommand();

      const logCalls = consoleLogSpy.mock.calls.flat().join('\n');
      expect(logCalls).toContain('source <(aliasmate completion bash)');
      expect(logCalls).toContain('source <(aliasmate completion zsh)');
      expect(logCalls).toContain('~/.config/fish/completions/aliasmate.fish');
    });
  });

  describe('completion script content', () => {
    it('bash completion should include format options', () => {
      jest.spyOn(storage, 'loadAliases').mockReturnValue({});

      const result = generateBashCompletion();

      expect(result).toContain('table json yaml compact');
    });

    it('zsh completion should include format options', () => {
      jest.spyOn(storage, 'loadAliases').mockReturnValue({});

      const result = generateZshCompletion();

      expect(result).toContain('table json yaml compact');
    });

    it('fish completion should include format options', () => {
      jest.spyOn(storage, 'loadAliases').mockReturnValue({});

      const result = generateFishCompletion();

      expect(result).toContain('table json yaml compact');
    });

    it('bash completion should include dry-run option', () => {
      jest.spyOn(storage, 'loadAliases').mockReturnValue({});

      const result = generateBashCompletion();

      expect(result).toContain('--dry-run');
      expect(result).toContain('--verbose');
    });

    it('fish completion should include recent command options', () => {
      jest.spyOn(storage, 'loadAliases').mockReturnValue({});

      const result = generateFishCompletion();

      expect(result).toContain('-l limit');
      expect(result).toContain('-l clear');
    });
  });
});
