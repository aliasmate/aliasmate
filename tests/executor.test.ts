import { describe, it, expect } from '@jest/globals';
import { executeCommand, type ExecutionResult } from '../src/utils/executor';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

describe('executor', () => {
  describe('executeCommand', () => {
    it('should execute simple command successfully', async () => {
      const tempDir = os.tmpdir();
      const result = await executeCommand('echo "test"', tempDir);

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
    });

    it('should throw error for empty command', async () => {
      const tempDir = os.tmpdir();
      await expect(executeCommand('', tempDir)).rejects.toThrow('Command cannot be empty');
    });

    it('should throw error for whitespace-only command', async () => {
      const tempDir = os.tmpdir();
      await expect(executeCommand('   ', tempDir)).rejects.toThrow('Command cannot be empty');
    });

    it('should throw error for non-existent directory', async () => {
      await expect(executeCommand('echo test', '/nonexistent/directory')).rejects.toThrow(
        'does not exist'
      );
    });

    it('should throw error if path is a file not a directory', async () => {
      const tempFile = path.join(os.tmpdir(), 'test-file.txt');
      fs.writeFileSync(tempFile, 'test');

      try {
        await expect(executeCommand('echo test', tempFile)).rejects.toThrow('not a directory');
      } finally {
        fs.unlinkSync(tempFile);
      }
    });

    it('should return failure for command that exits with error', async () => {
      const tempDir = os.tmpdir();
      const result = await executeCommand('exit 1', tempDir);

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
    });

    it('should resolve directory path', async () => {
      const tempDir = os.tmpdir();
      const result = await executeCommand('pwd', tempDir);

      expect(result.success).toBe(true);
    });

    it('should handle commands with shell operators', async () => {
      const tempDir = os.tmpdir();
      const result = await executeCommand('echo "hello" && echo "world"', tempDir);

      expect(result.success).toBe(true);
    });
  });

  describe('ExecutionResult', () => {
    it('should have correct structure for success', async () => {
      const tempDir = os.tmpdir();
      const result: ExecutionResult = await executeCommand('echo test', tempDir);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('stdout');
      expect(result).toHaveProperty('stderr');
      expect(result).toHaveProperty('exitCode');
    });

    it('should have correct structure for failure', async () => {
      const tempDir = os.tmpdir();
      const result: ExecutionResult = await executeCommand('exit 42', tempDir);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('stdout');
      expect(result).toHaveProperty('stderr');
      expect(result).toHaveProperty('exitCode');
      expect(result.exitCode).toBe(42);
    });
  });
});
