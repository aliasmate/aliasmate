import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs';
import { checkAndShowOnboarding, hasCompletedOnboarding } from '../src/utils/onboarding';

// Mock dependencies
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
}));
jest.mock('../src/storage', () => ({
  getConfigDir: jest.fn(() => '/mock/config'),
}));

describe('onboarding system', () => {
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('checkAndShowOnboarding', () => {
    it('should show welcome message for first install', () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = checkAndShowOnboarding();

      expect(result).toBe(true);
      expect(consoleLogSpy).toHaveBeenCalled();
      // Check for welcome message
      const logCalls = consoleLogSpy.mock.calls.map((call) => call.join(' '));
      const hasWelcome = logCalls.some((log) => log.includes('Welcome to AliasMate'));
      expect(hasWelcome).toBe(true);
    });

    it('should show upgrade message when version changes', () => {
      const oldState = {
        version: '1.2.0',
        lastShownVersion: '1.2.0',
        hasSeenWelcome: true,
        installDate: '2024-01-01T00:00:00.000Z',
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(oldState) as any);

      const result = checkAndShowOnboarding();

      expect(result).toBe(true);
      expect(consoleLogSpy).toHaveBeenCalled();
      const logCalls = consoleLogSpy.mock.calls.map((call) => call.join(' '));
      const hasUpgrade = logCalls.some((log) => log.includes('upgraded'));
      expect(hasUpgrade).toBe(true);
    });

    it('should not show onboarding for same version', () => {
      const currentState = {
        version: '1.5.1',
        lastShownVersion: '1.5.1',
        hasSeenWelcome: true,
        installDate: '2024-01-01T00:00:00.000Z',
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(currentState) as any);

      const result = checkAndShowOnboarding();

      expect(result).toBe(false);
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should handle corrupted onboarding file', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid json' as any);

      const result = checkAndShowOnboarding();

      expect(result).toBe(true); // Shows onboarding as if first install
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should save onboarding state after showing', () => {
      mockFs.existsSync.mockReturnValue(false);

      checkAndShowOnboarding();

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('onboarding.json'),
        expect.stringContaining('1.5.1'),
        'utf8'
      );
    });
  });

  describe('hasCompletedOnboarding', () => {
    it('should return true when onboarding is complete', () => {
      const state = {
        version: '1.3.0',
        lastShownVersion: '1.3.0',
        hasSeenWelcome: true,
        installDate: '2024-01-01T00:00:00.000Z',
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(state) as any);

      const result = hasCompletedOnboarding();

      expect(result).toBe(true);
    });

    it('should return false when no onboarding file exists', () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = hasCompletedOnboarding();

      expect(result).toBe(false);
    });

    it('should return false when onboarding file is corrupted', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid' as any);

      const result = hasCompletedOnboarding();

      expect(result).toBe(false);
    });
  });

  describe('onboarding content', () => {
    it('should include quick tour in first install', () => {
      mockFs.existsSync.mockReturnValue(false);

      checkAndShowOnboarding();

      const logCalls = consoleLogSpy.mock.calls.map((call) => call.join(' '));
      const hasTour = logCalls.some((log) => log.includes('Quick Tour'));
      const hasProTips = logCalls.some((log) => log.includes('Pro Tips'));

      expect(hasTour).toBe(true);
      expect(hasProTips).toBe(true);
    });

    it('should mention new features in upgrade message', () => {
      const oldState = {
        version: '1.0.0',
        lastShownVersion: '1.0.0',
        hasSeenWelcome: true,
        installDate: '2024-01-01T00:00:00.000Z',
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(oldState) as any);

      checkAndShowOnboarding();

      const logCalls = consoleLogSpy.mock.calls.map((call) => call.join(' '));
      // Should show what's new or changelog link
      const hasWhatsNew = logCalls.some(
        (log) => log.includes("What's new") || log.includes('changelog')
      );

      expect(hasWhatsNew).toBe(true);
    });
  });
});
