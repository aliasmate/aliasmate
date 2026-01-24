import { describe, it, expect } from '@jest/globals';
import {
  formatAsJSON,
  formatAsYAML,
  formatAsTable,
  formatAsCompact,
  formatAliases,
  isValidFormat,
} from '../src/utils/formatters';
import { CommandAlias } from '../src/storage';

describe('formatters', () => {
  const mockAliases: Record<string, CommandAlias> = {
    'test-cmd': {
      command: 'echo hello',
      directory: '/tmp',
      pathMode: 'saved',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    'build-prod': {
      command: 'npm run build --production',
      directory: '/home/user/project',
      pathMode: 'current',
      env: {
        NODE_ENV: 'production',
        API_KEY: 'secret123',
      },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  };

  describe('isValidFormat', () => {
    it('should return true for valid formats', () => {
      expect(isValidFormat('json')).toBe(true);
      expect(isValidFormat('yaml')).toBe(true);
      expect(isValidFormat('table')).toBe(true);
      expect(isValidFormat('compact')).toBe(true);
    });

    it('should return false for invalid formats', () => {
      expect(isValidFormat('xml')).toBe(false);
      expect(isValidFormat('csv')).toBe(false);
      expect(isValidFormat('')).toBe(false);
      expect(isValidFormat('JSON')).toBe(false); // case-sensitive
    });
  });

  describe('formatAsJSON', () => {
    it('should format aliases as pretty JSON', () => {
      const result = formatAsJSON(mockAliases, true);
      expect(result).toContain('"test-cmd"');
      expect(result).toContain('"echo hello"');
      expect(result).toContain('  '); // indentation
      const parsed = JSON.parse(result);
      expect(parsed['test-cmd']).toBeDefined();
      expect(parsed['test-cmd'].command).toBe('echo hello');
    });

    it('should format aliases as compact JSON when pretty is false', () => {
      const result = formatAsJSON(mockAliases, false);
      expect(result).not.toContain('\n');
      expect(result).toContain('"test-cmd"');
      const parsed = JSON.parse(result);
      expect(parsed['test-cmd']).toBeDefined();
    });

    it('should handle empty aliases', () => {
      const result = formatAsJSON({}, true);
      expect(result).toBe('{}');
    });

    it('should include environment variables', () => {
      const result = formatAsJSON(mockAliases, true);
      expect(result).toContain('"NODE_ENV"');
      expect(result).toContain('"production"');
    });
  });

  describe('formatAsYAML', () => {
    it('should format aliases as YAML', () => {
      const result = formatAsYAML(mockAliases);
      expect(result).toContain('test-cmd:');
      expect(result).toContain('command: "echo hello"');
      expect(result).toContain('directory: "/tmp"');
      expect(result).toContain('pathMode: saved');
    });

    it('should handle environment variables in YAML', () => {
      const result = formatAsYAML(mockAliases);
      expect(result).toContain('env:');
      expect(result).toContain('NODE_ENV: "production"');
      expect(result).toContain('API_KEY: "secret123"');
    });

    it('should escape quotes in YAML', () => {
      const aliasWithQuotes: Record<string, CommandAlias> = {
        test: {
          command: 'echo "hello world"',
          directory: '/tmp',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      };
      const result = formatAsYAML(aliasWithQuotes);
      expect(result).toContain('echo \\"hello world\\"');
    });

    it('should handle empty aliases', () => {
      const result = formatAsYAML({});
      expect(result).toBe('');
    });

    it('should include timestamps', () => {
      const result = formatAsYAML(mockAliases);
      expect(result).toContain('createdAt:');
      expect(result).toContain('updatedAt:');
    });
  });

  describe('formatAsTable', () => {
    it('should format aliases as table with colors', () => {
      const result = formatAsTable(mockAliases);
      expect(result).toContain('Saved commands (2)');
      expect(result).toContain('test-cmd');
      expect(result).toContain('echo hello');
      expect(result).toContain('/tmp');
    });

    it('should show path mode icons', () => {
      const result = formatAsTable(mockAliases);
      expect(result).toContain('📁 Saved');
      expect(result).toContain('📍 Current');
    });

    it('should show environment variable count', () => {
      const result = formatAsTable(mockAliases);
      expect(result).toContain('Environment Variables: 2 saved');
    });

    it('should handle empty aliases', () => {
      const result = formatAsTable({});
      expect(result).toContain('No saved commands found');
    });

    it('should truncate long commands', () => {
      const longCommand: Record<string, CommandAlias> = {
        long: {
          command: 'a'.repeat(150),
          directory: '/tmp',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      };
      const result = formatAsTable(longCommand);
      expect(result).toContain('...');
      // The result should not contain the full 150-character command
      expect(result).not.toContain('a'.repeat(150));
    });
  });

  describe('formatAsCompact', () => {
    it('should format aliases in compact format', () => {
      const result = formatAsCompact(mockAliases);
      expect(result).toContain('test-cmd');
      expect(result).toContain('echo hello');
      expect(result).toContain('/tmp');
      expect(result).toContain('saved');
    });

    it('should show environment variable count', () => {
      const result = formatAsCompact(mockAliases);
      expect(result).toContain('2 env vars');
    });

    it('should handle empty aliases', () => {
      const result = formatAsCompact({});
      expect(result).toBe('No saved commands found.');
    });

    it('should truncate long commands for compact display', () => {
      const longCommand: Record<string, CommandAlias> = {
        long: {
          command: 'a'.repeat(100),
          directory: '/tmp',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      };
      const result = formatAsCompact(longCommand);
      expect(result).toContain('...');
    });

    it('should use pipe separator', () => {
      const result = formatAsCompact(mockAliases);
      expect(result).toContain(' | ');
    });
  });

  describe('formatAliases', () => {
    it('should format as table by default', () => {
      const result = formatAliases(mockAliases);
      expect(result).toContain('Saved commands');
    });

    it('should format as JSON when specified', () => {
      const result = formatAliases(mockAliases, 'json');
      const parsed = JSON.parse(result);
      expect(parsed['test-cmd']).toBeDefined();
    });

    it('should format as YAML when specified', () => {
      const result = formatAliases(mockAliases, 'yaml');
      expect(result).toContain('test-cmd:');
      expect(result).toContain('command:');
    });

    it('should format as compact when specified', () => {
      const result = formatAliases(mockAliases, 'compact');
      expect(result).toContain(' | ');
    });

    it('should throw error for invalid format', () => {
      expect(() => {
        formatAliases(mockAliases, 'invalid' as any);
      }).toThrow('Unsupported format: invalid');
    });
  });
});
