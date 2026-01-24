import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as fs from 'fs';
import { execSync } from 'child_process';
import {
  validateCommandExists,
  validateDirectory,
  validateShellSyntax,
  validateEnvVars,
  validateCommandAlias,
} from '../src/utils/validator';

// Mock fs and child_process
jest.mock('fs');
jest.mock('child_process');

describe('validator utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCommandExists', () => {
    it('should reject empty command', () => {
      const result = validateCommandExists('');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Command cannot be empty');
    });

    it('should reject whitespace-only command', () => {
      const result = validateCommandExists('   ');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Command cannot be empty');
    });

    it('should accept shell builtins', () => {
      const builtins = ['cd', 'echo', 'export', 'pwd', 'exit', 'test'];
      for (const builtin of builtins) {
        const result = validateCommandExists(builtin);
        expect(result.valid).toBe(true);
      }
    });

    it('should accept shell builtins with arguments', () => {
      const result = validateCommandExists('cd /home/user');
      expect(result.valid).toBe(true);
      expect(result.warning).toBeUndefined();
    });

    it('should skip validation for commands starting with shell operators', () => {
      const operators = ['|', '&', ';', '<', '>', '(', ')'];
      for (const op of operators) {
        const result = validateCommandExists(`${op}test`);
        expect(result.valid).toBe(true);
        expect(result.warning).toBe(true);
      }
    });

    it('should validate executable file paths', () => {
      const mockStats = {
        isFile: jest.fn().mockReturnValue(true),
        isDirectory: jest.fn().mockReturnValue(false),
      };
      (fs.statSync as jest.Mock).mockReturnValue(mockStats);
      (fs.accessSync as jest.Mock).mockImplementation(() => {});

      const result = validateCommandExists('./scripts/build.sh');
      expect(result.valid).toBe(true);
    });

    it('should reject path that is not a file', () => {
      const mockStats = {
        isFile: jest.fn().mockReturnValue(false),
        isDirectory: jest.fn().mockReturnValue(true),
      };
      (fs.statSync as jest.Mock).mockReturnValue(mockStats);

      const result = validateCommandExists('./scripts/');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('exists but is not a file');
    });

    it('should reject non-existent file path', () => {
      (fs.statSync as jest.Mock).mockImplementation(() => {
        throw new Error('ENOENT');
      });

      const result = validateCommandExists('./nonexistent.sh');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should warn if file exists but is not executable (Unix)', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'linux' });

      const mockStats = {
        isFile: jest.fn().mockReturnValue(true),
        isDirectory: jest.fn().mockReturnValue(false),
      };
      (fs.statSync as jest.Mock).mockReturnValue(mockStats);
      (fs.accessSync as jest.Mock).mockImplementation(() => {
        throw new Error('EACCES');
      });

      const result = validateCommandExists('./script.sh');
      expect(result.valid).toBe(true);
      expect(result.warning).toBe(true);
      expect(result.message).toContain('may not be executable');

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should accept commands found in PATH', () => {
      (execSync as jest.Mock).mockImplementation(() => '/usr/bin/npm');

      const result = validateCommandExists('npm install');
      expect(result.valid).toBe(true);
      expect(result.warning).toBeUndefined();
    });

    it('should warn if command not found in PATH', () => {
      (execSync as jest.Mock).mockImplementation(() => {
        throw new Error('not found');
      });

      const result = validateCommandExists('nonexistent-command');
      expect(result.valid).toBe(true);
      expect(result.warning).toBe(true);
      expect(result.message).toContain('not found in PATH');
    });

    it('should use "which" on Unix-like systems', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'linux' });

      (execSync as jest.Mock).mockImplementation(() => '/usr/bin/npm');

      validateCommandExists('npm');
      expect(execSync).toHaveBeenCalledWith('which npm', { stdio: 'ignore' });

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should use "where" on Windows', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });

      (execSync as jest.Mock).mockImplementation(() => 'C:\\Windows\\System32\\npm.exe');

      validateCommandExists('npm');
      expect(execSync).toHaveBeenCalledWith('where npm', { stdio: 'ignore' });

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });
  });

  describe('validateDirectory', () => {
    it('should reject empty directory path', () => {
      const result = validateDirectory('');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Directory cannot be empty');
    });

    it('should reject whitespace-only directory path', () => {
      const result = validateDirectory('   ');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Directory cannot be empty');
    });

    it('should accept valid directory with permissions', () => {
      const mockStats = {
        isFile: jest.fn().mockReturnValue(false),
        isDirectory: jest.fn().mockReturnValue(true),
      };
      (fs.statSync as jest.Mock).mockReturnValue(mockStats);
      (fs.accessSync as jest.Mock).mockImplementation(() => {});

      const result = validateDirectory('/home/user/project');
      expect(result.valid).toBe(true);
      expect(result.warning).toBeUndefined();
    });

    it('should reject path that is not a directory', () => {
      const mockStats = {
        isFile: jest.fn().mockReturnValue(true),
        isDirectory: jest.fn().mockReturnValue(false),
      };
      (fs.statSync as jest.Mock).mockReturnValue(mockStats);

      const result = validateDirectory('/home/user/file.txt');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('exists but is not a directory');
    });

    it('should reject non-existent directory', () => {
      (fs.statSync as jest.Mock).mockImplementation(() => {
        throw new Error('ENOENT');
      });

      const result = validateDirectory('/nonexistent/path');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('does not exist');
    });

    it('should reject directory without read permissions', () => {
      const mockStats = {
        isFile: jest.fn().mockReturnValue(false),
        isDirectory: jest.fn().mockReturnValue(true),
      };
      (fs.statSync as jest.Mock).mockReturnValue(mockStats);
      (fs.accessSync as jest.Mock).mockImplementation((_path, mode) => {
        if (mode === fs.constants.R_OK) {
          throw new Error('EACCES');
        }
      });

      const result = validateDirectory('/restricted');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('not readable');
    });

    it('should warn if directory is not writable', () => {
      const mockStats = {
        isFile: jest.fn().mockReturnValue(false),
        isDirectory: jest.fn().mockReturnValue(true),
      };
      (fs.statSync as jest.Mock).mockReturnValue(mockStats);
      (fs.accessSync as jest.Mock).mockImplementation((_path, mode) => {
        if (mode === fs.constants.W_OK) {
          throw new Error('EACCES');
        }
      });

      const result = validateDirectory('/readonly');
      expect(result.valid).toBe(true);
      expect(result.warning).toBe(true);
      expect(result.message).toContain('not writable');
    });
  });

  describe('validateShellSyntax', () => {
    it('should reject empty command', () => {
      const result = validateShellSyntax('');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Command cannot be empty');
    });

    it('should reject unclosed single quote', () => {
      const result = validateShellSyntax("echo 'hello");
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Unclosed single quote');
    });

    it('should reject unclosed double quote', () => {
      const result = validateShellSyntax('echo "hello');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Unclosed double quote');
    });

    it('should reject unclosed backtick', () => {
      const result = validateShellSyntax('echo `date');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Unclosed backtick');
    });

    it('should accept properly quoted strings', () => {
      const commands = [
        "echo 'hello world'",
        'echo "hello world"',
        'echo `date`',
        `echo 'single' "double" \`backtick\``,
      ];
      for (const cmd of commands) {
        const result = validateShellSyntax(cmd);
        expect(result.valid).toBe(true);
      }
    });

    it('should reject unmatched closing parenthesis', () => {
      const result = validateShellSyntax('echo )');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Unmatched closing parenthesis');
    });

    it('should reject unmatched opening parenthesis', () => {
      const result = validateShellSyntax('echo (hello');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Unmatched opening parenthesis');
    });

    it('should accept matched parentheses', () => {
      const result = validateShellSyntax('(cd /tmp && ls)');
      expect(result.valid).toBe(true);
    });

    it('should reject unmatched closing brace', () => {
      const result = validateShellSyntax('echo }');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Unmatched closing brace');
    });

    it('should reject unmatched opening brace', () => {
      const result = validateShellSyntax('echo {hello');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Unmatched opening brace');
    });

    it('should accept matched braces', () => {
      const result = validateShellSyntax('echo {a,b,c}');
      expect(result.valid).toBe(true);
    });

    it('should reject unmatched closing bracket', () => {
      const result = validateShellSyntax('echo ]');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Unmatched closing bracket');
    });

    it('should reject unmatched opening bracket', () => {
      const result = validateShellSyntax('[ -f test.txt');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Unmatched opening bracket');
    });

    it('should accept matched brackets', () => {
      const result = validateShellSyntax('[ -f test.txt ]');
      expect(result.valid).toBe(true);
    });

    it('should reject command ending with pipe', () => {
      const result = validateShellSyntax('ls |');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('ends with pipe or ampersand');
    });

    it('should reject command ending with ampersand', () => {
      const result = validateShellSyntax('npm install &');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('ends with pipe or ampersand');
    });

    it('should accept valid pipes', () => {
      const result = validateShellSyntax('ls | grep test');
      expect(result.valid).toBe(true);
    });

    it('should accept logical OR operator', () => {
      const result = validateShellSyntax('npm test || echo failed');
      expect(result.valid).toBe(true);
    });

    it('should accept logical AND operator', () => {
      const result = validateShellSyntax('npm install && npm test');
      expect(result.valid).toBe(true);
    });

    it('should accept complex valid commands', () => {
      const commands = [
        'npm run build && npm test',
        'docker build -t myapp . && docker run myapp',
        'git add . && git commit -m "update" && git push',
        '(cd /tmp && ls) || echo "failed"',
        'echo "test" | grep test',
      ];
      for (const cmd of commands) {
        const result = validateShellSyntax(cmd);
        expect(result.valid).toBe(true);
      }
    });
  });

  describe('validateEnvVars', () => {
    it('should accept empty object', () => {
      const result = validateEnvVars({});
      expect(result.valid).toBe(true);
    });

    it('should accept valid environment variable names', () => {
      const envVars = {
        PATH: '/usr/bin',
        NODE_ENV: 'production',
        MY_VAR_123: 'value',
        _PRIVATE: 'secret',
      };
      const result = validateEnvVars(envVars);
      expect(result.valid).toBe(true);
    });

    it('should reject variable names starting with numbers', () => {
      const result = validateEnvVars({ '123VAR': 'value' });
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Invalid environment variable names');
    });

    it('should reject variable names with hyphens', () => {
      const result = validateEnvVars({ 'MY-VAR': 'value' });
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Invalid environment variable names');
    });

    it('should reject variable names with spaces', () => {
      const result = validateEnvVars({ 'MY VAR': 'value' });
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Invalid environment variable names');
    });

    it('should reject variable names with special characters', () => {
      const invalidNames = ['MY@VAR', 'MY$VAR', 'MY!VAR', 'MY.VAR'];
      for (const name of invalidNames) {
        const result = validateEnvVars({ [name]: 'value' });
        expect(result.valid).toBe(false);
        expect(result.message).toContain('Invalid environment variable names');
      }
    });

    it('should list all invalid variable names', () => {
      const result = validateEnvVars({
        VALID_VAR: 'ok',
        '123INVALID': 'bad',
        'ALSO-INVALID': 'bad',
      });
      expect(result.valid).toBe(false);
      expect(result.message).toContain('123INVALID');
      expect(result.message).toContain('ALSO-INVALID');
    });
  });

  describe('validateCommandAlias', () => {
    beforeEach(() => {
      // Setup default mocks for a valid scenario
      const mockStats = {
        isFile: jest.fn().mockReturnValue(false),
        isDirectory: jest.fn().mockReturnValue(true),
      };
      (fs.statSync as jest.Mock).mockReturnValue(mockStats);
      (fs.accessSync as jest.Mock).mockImplementation(() => {});
      (execSync as jest.Mock).mockImplementation(() => '/usr/bin/npm');
    });

    it('should validate command with no issues', () => {
      const report = validateCommandAlias('npm run build', '/home/user/project');
      expect(report.valid).toBe(true);
      expect(report.issues.length).toBe(0);
    });

    it('should return errors for invalid command syntax', () => {
      const report = validateCommandAlias('echo "unclosed', '/home/user/project');
      expect(report.valid).toBe(false);
      const errors = report.issues.filter((i) => i.type === 'error');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].field).toBe('command');
    });

    it('should return errors for non-existent directory', () => {
      (fs.statSync as jest.Mock).mockImplementation(() => {
        throw new Error('ENOENT');
      });

      const report = validateCommandAlias('npm run build', '/nonexistent');
      expect(report.valid).toBe(false);
      const errors = report.issues.filter((i) => i.type === 'error');
      expect(errors.some((e) => e.field === 'directory')).toBe(true);
    });

    it('should return warnings for commands not in PATH', () => {
      (execSync as jest.Mock).mockImplementation(() => {
        throw new Error('not found');
      });

      const report = validateCommandAlias('nonexistent-cmd', '/home/user/project');
      expect(report.valid).toBe(true); // Warnings don't fail validation
      const warnings = report.issues.filter((i) => i.type === 'warning');
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].field).toBe('command');
    });

    it('should validate environment variables', () => {
      const report = validateCommandAlias('npm run build', '/home/user/project', {
        NODE_ENV: 'production',
      });
      expect(report.valid).toBe(true);
    });

    it('should return errors for invalid environment variables', () => {
      const report = validateCommandAlias('npm run build', '/home/user/project', {
        '123INVALID': 'value',
      });
      expect(report.valid).toBe(false);
      const errors = report.issues.filter((i) => i.type === 'error');
      expect(errors.some((e) => e.field === 'environment')).toBe(true);
    });

    it('should collect multiple errors and warnings', () => {
      (fs.statSync as jest.Mock).mockImplementation(() => {
        throw new Error('ENOENT');
      });
      (execSync as jest.Mock).mockImplementation(() => {
        throw new Error('not found');
      });

      const report = validateCommandAlias('nonexistent-cmd', '/nonexistent', {
        '123BAD': 'value',
      });
      expect(report.valid).toBe(false);
      expect(report.issues.length).toBeGreaterThan(1);
    });

    it('should distinguish between errors and warnings', () => {
      (execSync as jest.Mock).mockImplementation(() => {
        throw new Error('not found');
      });

      const report = validateCommandAlias('some-cmd', '/home/user/project');
      const errors = report.issues.filter((i) => i.type === 'error');
      const warnings = report.issues.filter((i) => i.type === 'warning');

      expect(errors.length).toBe(0);
      expect(warnings.length).toBeGreaterThan(0);
      expect(report.valid).toBe(true); // Valid with warnings
    });

    it('should validate complex commands', () => {
      const report = validateCommandAlias(
        'npm install && npm run build && npm test',
        '/home/user/project',
        { NODE_ENV: 'production', CI: 'true' }
      );
      expect(report.valid).toBe(true);
    });
  });
});
