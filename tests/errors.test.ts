import { describe, it, expect } from '@jest/globals';
import { AliasMateError, ExitCode, isInquirerTTYError } from '../src/utils/errors';

describe('errors', () => {
  describe('AliasMateError', () => {
    it('should create error with message', () => {
      const error = new AliasMateError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('AliasMateError');
    });

    it('should create error with message and code', () => {
      const error = new AliasMateError('Test error', 'TEST_CODE');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
    });

    it('should be instance of Error', () => {
      const error = new AliasMateError('Test error');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('ExitCode', () => {
    it('should have correct exit code values', () => {
      expect(ExitCode.Success).toBe(0);
      expect(ExitCode.GeneralError).toBe(1);
      expect(ExitCode.InvalidInput).toBe(2);
      expect(ExitCode.FileNotFound).toBe(3);
      expect(ExitCode.PermissionDenied).toBe(4);
    });
  });

  describe('isInquirerTTYError', () => {
    it('should return true for inquirer TTY error', () => {
      const error = { isTtyError: true };
      expect(isInquirerTTYError(error)).toBe(true);
    });

    it('should return false for regular error', () => {
      const error = new Error('Regular error');
      expect(isInquirerTTYError(error)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isInquirerTTYError(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isInquirerTTYError(undefined)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(isInquirerTTYError('string')).toBe(false);
      expect(isInquirerTTYError(123)).toBe(false);
    });
  });
});
