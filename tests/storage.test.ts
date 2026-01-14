import { describe, it, expect, beforeEach } from '@jest/globals';
import * as path from 'path';
import {
  loadAliases,
  saveAliases,
  getAlias,
  setAlias,
  deleteAlias,
  aliasExists,
  loadMetadata,
  saveMetadata,
  getMetadata,
  setMetadata,
  type AliasConfig,
} from '../src/storage';

// Simple tests that use real filesystem without mocking homedir
describe('storage', () => {
  describe('loadAliases and saveAliases', () => {
    it('should save and load aliases', () => {
      const testAliases: AliasConfig = {
        test: {
          command: 'echo test',
          directory: '/test',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      const result = saveAliases(testAliases);
      expect(result).toBe(true);

      const loaded = loadAliases();
      expect(loaded.test).toBeDefined();
      expect(loaded.test.command).toBe('echo test');
    });

    it('should handle empty aliases', () => {
      saveAliases({});
      const loaded = loadAliases();
      expect(loaded).toEqual({});
    });
  });

  describe('getAlias', () => {
    beforeEach(() => {
      saveAliases({});
    });

    it('should return alias if it exists', () => {
      setAlias('test', 'echo test', '/test');
      const retrieved = getAlias('test');
      expect(retrieved).toBeDefined();
      expect(retrieved?.command).toBe('echo test');
    });

    it('should return undefined if alias does not exist', () => {
      const retrieved = getAlias('nonexistent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('setAlias', () => {
    beforeEach(() => {
      saveAliases({});
    });

    it('should create new alias', () => {
      const result = setAlias('test', 'echo test', '/test');
      expect(result).toBe(true);

      const alias = getAlias('test');
      expect(alias).toBeDefined();
      expect(alias?.command).toBe('echo test');
    });

    it('should update existing alias', () => {
      setAlias('test', 'echo first', '/test');
      setAlias('test', 'echo second', '/test');

      const alias = getAlias('test');
      expect(alias?.command).toBe('echo second');
    });

    it('should throw error for empty name', () => {
      expect(() => setAlias('', 'echo test', '/test')).toThrow();
    });

    it('should throw error for empty command', () => {
      expect(() => setAlias('test', '', '/test')).toThrow();
    });

    it('should throw error for empty directory', () => {
      expect(() => setAlias('test', 'echo test', '')).toThrow();
    });

    it('should trim command', () => {
      setAlias('test', '  echo test  ', '/test');
      const alias = getAlias('test');
      expect(alias?.command).toBe('echo test');
    });

    it('should normalize directory path', () => {
      setAlias('test', 'echo test', '/test/./subdir');
      const alias = getAlias('test');
      expect(alias?.directory).toBe(path.resolve('/test/./subdir'));
    });
  });

  describe('deleteAlias', () => {
    beforeEach(() => {
      saveAliases({});
    });

    it('should delete existing alias', () => {
      setAlias('test', 'echo test', '/test');
      const result = deleteAlias('test');

      expect(result).toBe(true);
      expect(getAlias('test')).toBeUndefined();
    });

    it('should return false if alias does not exist', () => {
      const result = deleteAlias('nonexistent');
      expect(result).toBe(false);
    });

    it('should not affect other aliases', () => {
      setAlias('test1', 'echo 1', '/test');
      setAlias('test2', 'echo 2', '/test');

      deleteAlias('test1');

      expect(getAlias('test1')).toBeUndefined();
      expect(getAlias('test2')).toBeDefined();
    });
  });

  describe('aliasExists', () => {
    beforeEach(() => {
      saveAliases({});
    });

    it('should return true for existing alias', () => {
      setAlias('test', 'echo test', '/test');
      expect(aliasExists('test')).toBe(true);
    });

    it('should return false for non-existing alias', () => {
      expect(aliasExists('nonexistent')).toBe(false);
    });
  });

  describe('metadata storage', () => {
    beforeEach(() => {
      saveMetadata({});
    });

    it('should save and load metadata', () => {
      const testMetadata = {
        test: { value: 'test data' },
        number: 42,
      };

      const result = saveMetadata(testMetadata);
      expect(result).toBe(true);

      const loaded = loadMetadata();
      expect(loaded.test).toEqual({ value: 'test data' });
      expect(loaded.number).toBe(42);
    });

    it('should handle empty metadata', () => {
      saveMetadata({});
      const loaded = loadMetadata();
      expect(loaded).toEqual({});
    });

    it('should get specific metadata by key', () => {
      setMetadata('testKey', { data: 'test value' });
      const retrieved = getMetadata<{ data: string }>('testKey');
      expect(retrieved).toEqual({ data: 'test value' });
    });

    it('should return undefined for non-existing metadata key', () => {
      const retrieved = getMetadata('nonexistent');
      expect(retrieved).toBeUndefined();
    });

    it('should update existing metadata key', () => {
      setMetadata('key', 'value1');
      expect(getMetadata('key')).toBe('value1');

      setMetadata('key', 'value2');
      expect(getMetadata('key')).toBe('value2');
    });

    it('should handle complex metadata types', () => {
      interface ComplexType {
        lastCheckDate: string;
        count: number;
        nested: {
          value: string;
        };
      }

      const complexData: ComplexType = {
        lastCheckDate: '2024-01-01',
        count: 5,
        nested: {
          value: 'nested data',
        },
      };

      setMetadata('complex', complexData);
      const retrieved = getMetadata<ComplexType>('complex');
      expect(retrieved).toEqual(complexData);
    });
  });
});
