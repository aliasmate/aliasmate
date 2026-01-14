import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { getLastCommand, getHistoryConfigInstructions } from '../src/utils/history';
import * as fs from 'fs';

// Mock fs module properly
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

describe('history utility', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.ALIASMATE_LAST_CMD;
  });

  describe('getLastCommand', () => {
    it('should return command from environment variable', () => {
      process.env.ALIASMATE_LAST_CMD = 'echo test from env';

      const result = getLastCommand();

      expect(result).toBe('echo test from env');
    });

    it('should ignore aliasmate commands from env variable', () => {
      process.env.ALIASMATE_LAST_CMD = 'aliasmate list';
      mockFs.existsSync.mockReturnValue(false);

      const result = getLastCommand();

      expect(result).toBeNull();
    });

    it('should handle missing history file', () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = getLastCommand();

      expect(result).toBeNull();
    });

    it('should parse command from history file', () => {
      const mockHistory = 'echo line1\necho line2\necho line3';
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockHistory as any);

      const result = getLastCommand();

      expect(result).toBeTruthy();
    });

    it('should skip aliasmate commands in history', () => {
      const mockHistory = 'echo test\naliasmate list\necho previous';
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockHistory as any);

      const result = getLastCommand();

      // Should skip the aliasmate command and return the one before
      expect(result).not.toContain('aliasmate');
    });

    it('should skip exit commands in history', () => {
      const mockHistory = 'echo previous\nexit\nnpm run dev';
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockHistory as any);

      const result = getLastCommand();

      // Should skip the exit command and return npm run dev (most recent non-exit)
      expect(result).toBe('npm run dev');
    });

    it('should skip quit commands in history', () => {
      const mockHistory = 'echo previous\nquit\ndocker compose up';
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockHistory as any);

      const result = getLastCommand();

      // Should skip the quit command and return docker compose up (most recent non-quit)
      expect(result).toBe('docker compose up');
    });

    it('should handle empty history file', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('' as any);

      const result = getLastCommand();

      expect(result).toBeNull();
    });

    it('should handle read errors', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('Read error');
      });

      const result = getLastCommand();

      expect(result).toBeNull();
    });
  });

  // describe('getCurrentShell', () => {
  //   it('should detect shell from SHELL environment variable', () => {
  //     const originalShell = process.env.SHELL;
  //     process.env.SHELL = '/bin/zsh';

  //     const result = getCurrentShell();

  //     expect(result).toBe('zsh');

  //     if (originalShell) {
  //       process.env.SHELL = originalShell;
  //     } else {
  //       delete process.env.SHELL;
  //     }
  //   });

  //   it('should return powershell on Windows', () => {
  //     jest.spyOn(os, 'platform').mockReturnValue('win32');

  //     const result = getCurrentShell();

  //     expect(result).toBe('powershell');
  //   });

  //   it('should return unknown for unrecognized shell', () => {
  //     const originalShell = process.env.SHELL;
  //     delete process.env.SHELL;
  //     jest.spyOn(os, 'platform').mockReturnValue('linux');

  //     const result = getCurrentShell();

  //     expect(['bash', 'zsh', 'unknown']).toContain(result);

  //     if (originalShell) {
  //       process.env.SHELL = originalShell;
  //     }
  //   });
  // });

  describe('getHistoryConfigInstructions', () => {
    // it('should return zsh instructions', () => {
    //   const instructions = getHistoryConfigInstructions('zsh');

    //   expect(instructions).toContain('zsh');
    //   expect(instructions).toContain('setopt');
    // });

    // it('should return bash instructions', () => {
    //   const instructions = getHistoryConfigInstructions('bash');

    //   expect(instructions).toContain('bash');
    //   expect(instructions).toContain('PROMPT_COMMAND');
    // });

    // it('should return PowerShell instructions', () => {
    //   const instructions = getHistoryConfigInstructions('powershell');

    //   expect(instructions).toContain('PowerShell');
    // });

    // it('should return generic instructions for unknown shell', () => {
    //   const instructions = getHistoryConfigInstructions('unknown');

    //   expect(instructions).toBeTruthy();
    // });

    it('should use current shell if not specified', () => {
      const instructions = getHistoryConfigInstructions();

      expect(instructions).toBeTruthy();
      expect(typeof instructions).toBe('string');
    });
  });
});
