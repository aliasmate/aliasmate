import { describe, it, expect } from '@jest/globals';
import {
  APP_NAME,
  APP_VERSION,
  CONFIG_DIR_NAME,
  CONFIG_FILE_NAME,
  HELP_MESSAGES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
} from '../src/utils/constants';

describe('constants', () => {
  describe('app constants', () => {
    it('should have correct app name', () => {
      expect(APP_NAME).toBe('aliasmate');
    });

    it('should have version in correct format', () => {
      expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should have correct config directory name', () => {
      expect(CONFIG_DIR_NAME).toBe('.config/aliasmate');
    });

    it('should have correct config file name', () => {
      expect(CONFIG_FILE_NAME).toBe('config.json');
    });
  });

  describe('HELP_MESSAGES', () => {
    it('should have noCommands message', () => {
      expect(HELP_MESSAGES.noCommands).toBe('No saved commands found.');
    });

    it('should have useSaveOrPrev message', () => {
      expect(HELP_MESSAGES.useSaveOrPrev).toContain('save');
      expect(HELP_MESSAGES.useSaveOrPrev).toContain('prev');
    });

    it('should have useList message', () => {
      expect(HELP_MESSAGES.useList).toContain('list');
    });

    it('should have invalidName message', () => {
      expect(HELP_MESSAGES.invalidName).toContain('spaces');
    });

    it('should generate emptyValue message with field name', () => {
      expect(HELP_MESSAGES.emptyValue('Test')).toBe('Test cannot be empty');
    });
  });

  describe('SUCCESS_MESSAGES', () => {
    it('should generate saved message with name', () => {
      const message = SUCCESS_MESSAGES.saved('test-cmd');
      expect(message).toContain('test-cmd');
      expect(message).toContain('Saved');
    });

    it('should generate deleted message with name', () => {
      const message = SUCCESS_MESSAGES.deleted('test-cmd');
      expect(message).toContain('test-cmd');
      expect(message).toContain('Deleted');
    });

    it('should generate updated message with name', () => {
      const message = SUCCESS_MESSAGES.updated('test-cmd');
      expect(message).toContain('test-cmd');
      expect(message).toContain('Updated');
    });

    it('should generate exported message with count and path', () => {
      const message = SUCCESS_MESSAGES.exported(5, '/path/to/file.json');
      expect(message).toContain('5');
      expect(message).toContain('/path/to/file.json');
      expect(message).toContain('Exported');
    });

    it('should have import complete message', () => {
      expect(SUCCESS_MESSAGES.importComplete).toContain('Import');
    });
  });

  describe('ERROR_MESSAGES', () => {
    it('should generate commandNotFound message with name', () => {
      const message = ERROR_MESSAGES.commandNotFound('test-cmd');
      expect(message).toContain('test-cmd');
      expect(message).toContain('found');
    });

    it('should have standard error messages', () => {
      expect(ERROR_MESSAGES.couldNotSave).toBeTruthy();
      expect(ERROR_MESSAGES.couldNotDelete).toBeTruthy();
      expect(ERROR_MESSAGES.couldNotUpdate).toBeTruthy();
      expect(ERROR_MESSAGES.couldNotRead).toBeTruthy();
      expect(ERROR_MESSAGES.couldNotWrite).toBeTruthy();
    });

    it('should generate fileNotFound message with path', () => {
      const message = ERROR_MESSAGES.fileNotFound('/test/path');
      expect(message).toContain('/test/path');
      expect(message).toContain('not found');
    });

    it('should have invalidJson message', () => {
      expect(ERROR_MESSAGES.invalidJson).toContain('JSON');
    });

    it('should have invalidFormat message', () => {
      expect(ERROR_MESSAGES.invalidFormat).toContain('aliases');
    });

    it('should generate invalidAliasStructure message with name', () => {
      const message = ERROR_MESSAGES.invalidAliasStructure('test-cmd');
      expect(message).toContain('test-cmd');
      expect(message).toContain('Invalid');
    });

    it('should generate directoryNotFound message with path', () => {
      const message = ERROR_MESSAGES.directoryNotFound('/test/dir');
      expect(message).toContain('/test/dir');
    });

    it('should have historyNotAvailable message', () => {
      expect(ERROR_MESSAGES.historyNotAvailable).toContain('history');
    });

    it('should have interactiveNotSupported message', () => {
      expect(ERROR_MESSAGES.interactiveNotSupported).toContain('Interactive');
    });

    it('should generate emptyInput message with field name', () => {
      const message = ERROR_MESSAGES.emptyInput('Test');
      expect(message).toContain('Test');
      expect(message).toContain('empty');
    });

    it('should generate invalidCharacters message with field name', () => {
      const message = ERROR_MESSAGES.invalidCharacters('Test');
      expect(message).toContain('Test');
      expect(message).toContain('invalid');
    });
  });
});
