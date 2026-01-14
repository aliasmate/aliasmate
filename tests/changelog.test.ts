/**
 * Tests for changelog utilities
 */

import { describe, it, expect } from '@jest/globals';
import {
  getVersionsInRange,
  getVersionChanges,
  getCumulativeChanges,
  getUpgradeSummary,
} from '../src/utils/changelog';

describe('Changelog Utilities', () => {
  describe('version comparison', () => {
    it('should get versions in range', () => {
      const versions = getVersionsInRange('1.2.0', '1.4.0');
      expect(versions).toContain('1.2.0');
      expect(versions).toContain('1.3.0');
      expect(versions).toContain('1.4.0');
    });

    it('should handle single version range', () => {
      const versions = getVersionsInRange('1.3.0', '1.3.0');
      expect(versions).toContain('1.3.0');
      expect(versions.length).toBe(1);
    });

    it('should return empty array for non-existent versions', () => {
      const versions = getVersionsInRange('9.9.9', '9.9.10');
      expect(versions.length).toBe(0);
    });
  });

  describe('getVersionChanges', () => {
    it('should retrieve changes for a specific version', () => {
      const changes = getVersionChanges('1.0.0');
      expect(changes).toBeTruthy();
      expect(changes?.version).toBe('1.0.0');
      expect(changes?.sections).toBeTruthy();
    });

    it('should return null for non-existent version', () => {
      const changes = getVersionChanges('99.99.99');
      expect(changes).toBeNull();
    });

    it('should have correct structure', () => {
      const changes = getVersionChanges('1.4.0');
      expect(changes).toBeTruthy();
      expect(changes?.version).toBe('1.4.0');
      expect(changes?.date).toBeTruthy();
      expect(changes?.sections).toBeTruthy();
    });
  });

  describe('getCumulativeChanges', () => {
    it('should get cumulative changes across versions', () => {
      const changes = getCumulativeChanges('1.2.0', '1.4.0');
      expect(changes.length).toBeGreaterThan(0);
      expect(changes.some((c) => c.version === '1.2.0')).toBe(true);
      expect(changes.some((c) => c.version === '1.3.0')).toBe(true);
      expect(changes.some((c) => c.version === '1.4.0')).toBe(true);
    });

    it('should return changes in order', () => {
      const changes = getCumulativeChanges('1.0.0', '1.4.0');
      expect(changes.length).toBeGreaterThan(1);
      // Should be sorted by version
      for (let i = 1; i < changes.length; i++) {
        const prev = changes[i - 1].version.split('.').map(Number);
        const curr = changes[i].version.split('.').map(Number);
        const prevNum = prev[0] * 10000 + prev[1] * 100 + prev[2];
        const currNum = curr[0] * 10000 + curr[1] * 100 + curr[2];
        expect(currNum).toBeGreaterThanOrEqual(prevNum);
      }
    });
  });

  describe('getUpgradeSummary', () => {
    it('should return highlights from version range', () => {
      const summary = getUpgradeSummary('1.0.0', '1.4.0');
      expect(Array.isArray(summary)).toBe(true);
      expect(summary.length).toBeGreaterThan(0);
      expect(summary.length).toBeLessThanOrEqual(5); // Max 5 highlights
    });

    it('should prioritize important changes', () => {
      const summary = getUpgradeSummary('1.2.0', '1.3.0');
      expect(Array.isArray(summary)).toBe(true);
      // Should include added items and security items if present
      summary.forEach((item) => {
        expect(typeof item).toBe('string');
        expect(item.length).toBeGreaterThan(0);
      });
    });

    it('should return empty array for invalid range', () => {
      const summary = getUpgradeSummary('99.0.0', '99.0.1');
      expect(Array.isArray(summary)).toBe(true);
      expect(summary.length).toBe(0);
    });
  });

  describe('data validation', () => {
    it('should have valid changelog entries for all versions', () => {
      const versions = ['1.0.0', '1.1.0', '1.2.0', '1.3.0', '1.3.1', '1.4.0'];
      versions.forEach((version) => {
        const changes = getVersionChanges(version);
        expect(changes).toBeTruthy();
        expect(changes?.version).toBe(version);
        expect(changes?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
        expect(changes?.sections).toBeTruthy();
      });
    });

    it('should have at least one section in each entry', () => {
      const versions = ['1.0.0', '1.1.0', '1.2.0', '1.3.0', '1.3.1', '1.4.0'];
      versions.forEach((version) => {
        const changes = getVersionChanges(version);
        expect(changes).toBeTruthy();
        const sectionKeys = Object.keys(changes?.sections || {});
        expect(sectionKeys.length).toBeGreaterThan(0);
      });
    });
  });
});
