import { describe, it, expect } from '@jest/globals';
import * as path from 'path';
import * as os from 'os';
import { resolvePath, isValidDirectory, sanitizeCommandName } from '../src/utils/paths';

describe('paths', () => {
  describe('resolvePath', () => {
    it('should return base path for empty input', () => {
      const basePath = '/home/user';
      expect(resolvePath('', basePath)).toBe(basePath);
    });

    it('should return normalized absolute path', () => {
      const result = resolvePath('/absolute/path');
      expect(path.isAbsolute(result)).toBe(true);
      expect(result).toBe(path.normalize('/absolute/path'));
    });

    it('should return base path for current directory', () => {
      const basePath = '/home/user';
      expect(resolvePath('.', basePath)).toBe(basePath);
    });

    it('should return parent directory for ..', () => {
      const basePath = '/home/user/project';
      expect(resolvePath('..', basePath)).toBe('/home/user');
    });

    it('should resolve relative path against base path', () => {
      const basePath = '/home/user';
      const result = resolvePath('project', basePath);
      expect(result).toBe(path.resolve(basePath, 'project'));
    });

    it('should use process.cwd() as default base path', () => {
      const cwd = process.cwd();
      const result = resolvePath('test');
      expect(result).toBe(path.resolve(cwd, 'test'));
    });

    it('should normalize paths with multiple slashes', () => {
      const basePath = '/home/user';
      const result = resolvePath('./project//subfolder', basePath);
      expect(result).toContain('project');
      expect(result).toContain('subfolder');
    });
  });

  describe('isValidDirectory', () => {
    it('should return true for existing directory', () => {
      const tempDir = os.tmpdir();
      expect(isValidDirectory(tempDir)).toBe(true);
    });

    it('should return false for non-existent directory', () => {
      expect(isValidDirectory('/nonexistent/directory/path')).toBe(false);
    });

    it('should return false for file path', () => {
      // __filename in jest points to the test file
      expect(isValidDirectory(__filename)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidDirectory('')).toBe(false);
    });
  });

  describe('sanitizeCommandName', () => {
    it('should trim whitespace', () => {
      expect(sanitizeCommandName('  test  ')).toBe('test');
    });

    it('should replace spaces with hyphens', () => {
      expect(sanitizeCommandName('my command name')).toBe('my-command-name');
    });

    it('should remove invalid characters', () => {
      expect(sanitizeCommandName('test!@#$%')).toBe('test');
    });

    it('should convert to lowercase', () => {
      expect(sanitizeCommandName('TestCommand')).toBe('testcommand');
    });

    it('should handle multiple spaces', () => {
      expect(sanitizeCommandName('test   command')).toBe('test-command');
    });

    it('should preserve valid characters', () => {
      expect(sanitizeCommandName('test-command_123')).toBe('test-command_123');
    });

    it('should handle mixed invalid characters', () => {
      expect(sanitizeCommandName('my@command!name#123')).toBe('mycommandname123');
    });

    it('should handle empty string', () => {
      expect(sanitizeCommandName('')).toBe('');
    });

    it('should handle only invalid characters', () => {
      expect(sanitizeCommandName('!@#$%^&*()')).toBe('');
    });
  });
});
