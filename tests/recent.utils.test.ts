import { describe, it, expect, beforeEach } from '@jest/globals';
import * as recent from '../src/utils/recent';
import * as storage from '../src/storage';

// Mock the storage module
jest.mock('../src/storage');

describe('recent utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRecentConfig', () => {
    it('should return default config when none exists', () => {
      jest.spyOn(storage, 'getMetadata').mockReturnValue(null);

      const config = recent.getRecentConfig();

      expect(config).toEqual({ maxSize: 50 });
    });

    it('should return stored config when it exists', () => {
      const customConfig = { maxSize: 100 };
      jest.spyOn(storage, 'getMetadata').mockReturnValue(customConfig);

      const config = recent.getRecentConfig();

      expect(config).toEqual(customConfig);
    });
  });

  describe('setRecentConfig', () => {
    it('should save config to metadata storage', () => {
      const setMetadataSpy = jest.spyOn(storage, 'setMetadata').mockReturnValue(true);
      const customConfig = { maxSize: 75 };

      const result = recent.setRecentConfig(customConfig);

      expect(result).toBe(true);
      expect(setMetadataSpy).toHaveBeenCalledWith('recent_config', customConfig);
    });
  });

  describe('getExecutionHistory', () => {
    it('should return empty array when no history exists', () => {
      jest.spyOn(storage, 'getMetadata').mockReturnValue(null);

      const history = recent.getExecutionHistory();

      expect(history).toEqual([]);
    });

    it('should return stored history when it exists', () => {
      const mockHistory: recent.ExecutionEntry[] = [
        { commandName: 'test1', executedAt: '2026-01-22T10:00:00.000Z' },
        { commandName: 'test2', executedAt: '2026-01-22T09:00:00.000Z' },
      ];
      jest.spyOn(storage, 'getMetadata').mockReturnValue(mockHistory);

      const history = recent.getExecutionHistory();

      expect(history).toEqual(mockHistory);
    });
  });

  describe('recordExecution', () => {
    it('should add new entry to beginning of history', () => {
      const existingHistory: recent.ExecutionEntry[] = [
        { commandName: 'old-cmd', executedAt: '2026-01-22T09:00:00.000Z' },
      ];
      jest.spyOn(storage, 'getMetadata').mockImplementation((key: string) => {
        if (key === 'execution_history') return existingHistory;
        if (key === 'recent_config') return null;
        return null;
      });
      const setMetadataSpy = jest.spyOn(storage, 'setMetadata').mockReturnValue(true);

      recent.recordExecution('new-cmd');

      expect(setMetadataSpy).toHaveBeenCalledWith(
        'execution_history',
        expect.arrayContaining([
          expect.objectContaining({ commandName: 'new-cmd' }),
          { commandName: 'old-cmd', executedAt: '2026-01-22T09:00:00.000Z' },
        ])
      );
    });

    it('should trim history to maxSize when exceeded', () => {
      // Create history with 50 entries
      const existingHistory: recent.ExecutionEntry[] = Array.from({ length: 50 }, (_, i) => ({
        commandName: `cmd-${i}`,
        executedAt: new Date(2026, 0, 22, 10, i).toISOString(),
      }));

      jest.spyOn(storage, 'getMetadata').mockImplementation((key: string) => {
        if (key === 'execution_history') return existingHistory;
        if (key === 'recent_config') return null; // Will use default maxSize of 50
        return null;
      });
      const setMetadataSpy = jest.spyOn(storage, 'setMetadata').mockReturnValue(true);

      recent.recordExecution('new-cmd');

      const savedHistory = setMetadataSpy.mock.calls[0][1] as recent.ExecutionEntry[];
      expect(savedHistory).toHaveLength(50);
      expect(savedHistory[0].commandName).toBe('new-cmd');
      expect(savedHistory[49].commandName).toBe('cmd-48'); // Last entry from original 50
    });

    it('should respect custom maxSize from config', () => {
      const existingHistory: recent.ExecutionEntry[] = Array.from({ length: 10 }, (_, i) => ({
        commandName: `cmd-${i}`,
        executedAt: new Date(2026, 0, 22, 10, i).toISOString(),
      }));

      jest.spyOn(storage, 'getMetadata').mockImplementation((key: string) => {
        if (key === 'execution_history') return existingHistory;
        if (key === 'recent_config') return { maxSize: 5 };
        return null;
      });
      const setMetadataSpy = jest.spyOn(storage, 'setMetadata').mockReturnValue(true);

      recent.recordExecution('new-cmd');

      const savedHistory = setMetadataSpy.mock.calls[0][1] as recent.ExecutionEntry[];
      expect(savedHistory).toHaveLength(5);
    });
  });

  describe('getRecentCommands', () => {
    it('should return empty array when no history', () => {
      jest.spyOn(storage, 'getMetadata').mockReturnValue(null);

      const commands = recent.getRecentCommands();

      expect(commands).toEqual([]);
    });

    it('should deduplicate command names', () => {
      const mockHistory: recent.ExecutionEntry[] = [
        { commandName: 'cmd1', executedAt: '2026-01-22T10:03:00.000Z' },
        { commandName: 'cmd2', executedAt: '2026-01-22T10:02:00.000Z' },
        { commandName: 'cmd1', executedAt: '2026-01-22T10:01:00.000Z' },
        { commandName: 'cmd3', executedAt: '2026-01-22T10:00:00.000Z' },
      ];
      jest.spyOn(storage, 'getMetadata').mockReturnValue(mockHistory);

      const commands = recent.getRecentCommands();

      expect(commands).toEqual(['cmd1', 'cmd2', 'cmd3']);
    });

    it('should respect limit parameter', () => {
      const mockHistory: recent.ExecutionEntry[] = [
        { commandName: 'cmd1', executedAt: '2026-01-22T10:03:00.000Z' },
        { commandName: 'cmd2', executedAt: '2026-01-22T10:02:00.000Z' },
        { commandName: 'cmd3', executedAt: '2026-01-22T10:01:00.000Z' },
      ];
      jest.spyOn(storage, 'getMetadata').mockReturnValue(mockHistory);

      const commands = recent.getRecentCommands(2);

      expect(commands).toEqual(['cmd1', 'cmd2']);
    });

    it('should maintain most recent execution order', () => {
      const mockHistory: recent.ExecutionEntry[] = [
        { commandName: 'cmd3', executedAt: '2026-01-22T10:03:00.000Z' },
        { commandName: 'cmd1', executedAt: '2026-01-22T10:02:00.000Z' },
        { commandName: 'cmd2', executedAt: '2026-01-22T10:01:00.000Z' },
      ];
      jest.spyOn(storage, 'getMetadata').mockReturnValue(mockHistory);

      const commands = recent.getRecentCommands();

      expect(commands).toEqual(['cmd3', 'cmd1', 'cmd2']);
    });
  });

  describe('getRecentCommandByIndex', () => {
    it('should return command at specified index', () => {
      const mockHistory: recent.ExecutionEntry[] = [
        { commandName: 'cmd1', executedAt: '2026-01-22T10:02:00.000Z' },
        { commandName: 'cmd2', executedAt: '2026-01-22T10:01:00.000Z' },
      ];
      jest.spyOn(storage, 'getMetadata').mockReturnValue(mockHistory);

      expect(recent.getRecentCommandByIndex(0)).toBe('cmd1');
      expect(recent.getRecentCommandByIndex(1)).toBe('cmd2');
    });

    it('should return undefined for invalid index', () => {
      const mockHistory: recent.ExecutionEntry[] = [
        { commandName: 'cmd1', executedAt: '2026-01-22T10:00:00.000Z' },
      ];
      jest.spyOn(storage, 'getMetadata').mockReturnValue(mockHistory);

      expect(recent.getRecentCommandByIndex(5)).toBeUndefined();
      expect(recent.getRecentCommandByIndex(-1)).toBeUndefined();
    });

    it('should handle deduplication correctly', () => {
      const mockHistory: recent.ExecutionEntry[] = [
        { commandName: 'cmd1', executedAt: '2026-01-22T10:03:00.000Z' },
        { commandName: 'cmd1', executedAt: '2026-01-22T10:02:00.000Z' },
        { commandName: 'cmd2', executedAt: '2026-01-22T10:01:00.000Z' },
      ];
      jest.spyOn(storage, 'getMetadata').mockReturnValue(mockHistory);

      expect(recent.getRecentCommandByIndex(0)).toBe('cmd1');
      expect(recent.getRecentCommandByIndex(1)).toBe('cmd2');
      expect(recent.getRecentCommandByIndex(2)).toBeUndefined();
    });
  });

  describe('clearExecutionHistory', () => {
    it('should clear history by saving empty array', () => {
      const setMetadataSpy = jest.spyOn(storage, 'setMetadata').mockReturnValue(true);

      const result = recent.clearExecutionHistory();

      expect(result).toBe(true);
      expect(setMetadataSpy).toHaveBeenCalledWith('execution_history', []);
    });
  });

  describe('getRecentCommandsWithTimestamps', () => {
    it('should return full history when no limit', () => {
      const mockHistory: recent.ExecutionEntry[] = [
        { commandName: 'cmd1', executedAt: '2026-01-22T10:02:00.000Z' },
        { commandName: 'cmd2', executedAt: '2026-01-22T10:01:00.000Z' },
      ];
      jest.spyOn(storage, 'getMetadata').mockReturnValue(mockHistory);

      const history = recent.getRecentCommandsWithTimestamps();

      expect(history).toEqual(mockHistory);
    });

    it('should respect limit parameter', () => {
      const mockHistory: recent.ExecutionEntry[] = [
        { commandName: 'cmd1', executedAt: '2026-01-22T10:03:00.000Z' },
        { commandName: 'cmd2', executedAt: '2026-01-22T10:02:00.000Z' },
        { commandName: 'cmd3', executedAt: '2026-01-22T10:01:00.000Z' },
      ];
      jest.spyOn(storage, 'getMetadata').mockReturnValue(mockHistory);

      const history = recent.getRecentCommandsWithTimestamps(2);

      expect(history).toHaveLength(2);
      expect(history).toEqual([
        { commandName: 'cmd1', executedAt: '2026-01-22T10:03:00.000Z' },
        { commandName: 'cmd2', executedAt: '2026-01-22T10:02:00.000Z' },
      ]);
    });

    it('should NOT deduplicate entries (unlike getRecentCommands)', () => {
      const mockHistory: recent.ExecutionEntry[] = [
        { commandName: 'cmd1', executedAt: '2026-01-22T10:03:00.000Z' },
        { commandName: 'cmd1', executedAt: '2026-01-22T10:02:00.000Z' },
        { commandName: 'cmd2', executedAt: '2026-01-22T10:01:00.000Z' },
      ];
      jest.spyOn(storage, 'getMetadata').mockReturnValue(mockHistory);

      const history = recent.getRecentCommandsWithTimestamps();

      expect(history).toHaveLength(3);
      expect(history[0].commandName).toBe('cmd1');
      expect(history[1].commandName).toBe('cmd1');
    });
  });
});
