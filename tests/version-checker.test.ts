import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import * as https from 'https';
import { isNewerVersion, fetchLatestVersion, checkForUpdates } from '../src/utils/version-checker';
import * as storage from '../src/storage';

// Mock the storage module
jest.mock('../src/storage');

// Mock https module
jest.mock('https');

describe('version-checker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('isNewerVersion', () => {
    it('should return true when latest version is greater (major)', () => {
      expect(isNewerVersion('1.4.0', '2.0.0')).toBe(true);
    });

    it('should return true when latest version is greater (minor)', () => {
      expect(isNewerVersion('1.4.0', '1.5.0')).toBe(true);
    });

    it('should return true when latest version is greater (patch)', () => {
      expect(isNewerVersion('1.4.0', '1.4.1')).toBe(true);
    });

    it('should return false when versions are equal', () => {
      expect(isNewerVersion('1.4.0', '1.4.0')).toBe(false);
    });

    it('should return false when latest version is lower (major)', () => {
      expect(isNewerVersion('2.0.0', '1.9.9')).toBe(false);
    });

    it('should return false when latest version is lower (minor)', () => {
      expect(isNewerVersion('1.5.0', '1.4.9')).toBe(false);
    });

    it('should return false when latest version is lower (patch)', () => {
      expect(isNewerVersion('1.4.1', '1.4.0')).toBe(false);
    });

    it('should handle versions with different lengths', () => {
      expect(isNewerVersion('1.4', '1.4.1')).toBe(true);
      expect(isNewerVersion('1.4.1', '1.4')).toBe(false);
    });
  });

  describe('fetchLatestVersion', () => {
    it('should return version on successful fetch', async () => {
      const mockResponse = {
        statusCode: 200,
        on: jest.fn((event: string, callback: (chunk: string) => void) => {
          if (event === 'data') {
            callback(JSON.stringify({ version: '1.5.0' }));
          } else if (event === 'end') {
            callback('');
          }
        }),
      };

      const mockRequest = {
        on: jest.fn(),
        end: jest.fn(),
      };

      (https.request as jest.MockedFunction<typeof https.request>).mockImplementation(((
        _options: unknown,
        callback?: (res: unknown) => void
      ) => {
        if (callback) {
          callback(mockResponse);
        }
        return mockRequest as unknown as ReturnType<typeof https.request>;
      }) as typeof https.request);

      const version = await fetchLatestVersion();
      expect(version).toBe('1.5.0');
    });

    it('should return null on network error', async () => {
      const mockRequest = {
        on: jest.fn((event: string, callback: () => void) => {
          if (event === 'error') {
            callback();
          }
        }),
        end: jest.fn(),
      };

      (https.request as jest.MockedFunction<typeof https.request>).mockReturnValue(
        mockRequest as unknown as ReturnType<typeof https.request>
      );

      const version = await fetchLatestVersion();
      expect(version).toBe(null);
    });

    it('should return null on timeout', async () => {
      const mockRequest = {
        on: jest.fn((event: string, callback: () => void) => {
          if (event === 'timeout') {
            callback();
          }
        }),
        end: jest.fn(),
        destroy: jest.fn(),
      };

      (https.request as jest.MockedFunction<typeof https.request>).mockReturnValue(
        mockRequest as unknown as ReturnType<typeof https.request>
      );

      const version = await fetchLatestVersion();
      expect(version).toBe(null);
    });

    it('should return null on non-200 status code', async () => {
      const mockResponse = {
        statusCode: 404,
        on: jest.fn((event: string, callback: () => void) => {
          if (event === 'end') {
            callback();
          }
        }),
      };

      const mockRequest = {
        on: jest.fn(),
        end: jest.fn(),
      };

      (https.request as jest.MockedFunction<typeof https.request>).mockImplementation(((
        _options: unknown,
        callback?: (res: unknown) => void
      ) => {
        if (callback) {
          callback(mockResponse);
        }
        return mockRequest as unknown as ReturnType<typeof https.request>;
      }) as typeof https.request);

      const version = await fetchLatestVersion();
      expect(version).toBe(null);
    });

    it('should return null on invalid JSON', async () => {
      const mockResponse = {
        statusCode: 200,
        on: jest.fn((event: string, callback: (chunk: string) => void) => {
          if (event === 'data') {
            callback('invalid json');
          } else if (event === 'end') {
            callback('');
          }
        }),
      };

      const mockRequest = {
        on: jest.fn(),
        end: jest.fn(),
      };

      (https.request as jest.MockedFunction<typeof https.request>).mockImplementation(((
        _options: unknown,
        callback?: (res: unknown) => void
      ) => {
        if (callback) {
          callback(mockResponse);
        }
        return mockRequest as unknown as ReturnType<typeof https.request>;
      }) as typeof https.request);

      const version = await fetchLatestVersion();
      expect(version).toBe(null);
    });
  });

  describe('checkForUpdates', () => {
    it('should not check if already checked today', async () => {
      const today = new Date().toISOString().split('T')[0];
      (storage.getMetadata as jest.MockedFunction<typeof storage.getMetadata>).mockReturnValue({
        lastCheckDate: today,
      });

      await checkForUpdates();

      expect(https.request).not.toHaveBeenCalled();
    });

    it('should check if not checked today', async () => {
      (storage.getMetadata as jest.MockedFunction<typeof storage.getMetadata>).mockReturnValue({
        lastCheckDate: '2020-01-01',
      });

      const mockResponse = {
        statusCode: 200,
        on: jest.fn((event: string, callback: (chunk: string) => void) => {
          if (event === 'data') {
            callback(JSON.stringify({ version: '1.5.0' }));
          } else if (event === 'end') {
            callback('');
          }
        }),
      };

      const mockRequest = {
        on: jest.fn(),
        end: jest.fn(),
      };

      (https.request as jest.MockedFunction<typeof https.request>).mockImplementation(((
        _options: unknown,
        callback?: (res: unknown) => void
      ) => {
        if (callback) {
          callback(mockResponse);
        }
        return mockRequest as unknown as ReturnType<typeof https.request>;
      }) as typeof https.request);

      await checkForUpdates();

      expect(https.request).toHaveBeenCalled();
      expect(storage.setMetadata).toHaveBeenCalled();
    });

    it('should update metadata even on error', async () => {
      (storage.getMetadata as jest.MockedFunction<typeof storage.getMetadata>).mockReturnValue(
        undefined
      );

      const mockRequest = {
        on: jest.fn((event: string, callback: () => void) => {
          if (event === 'error') {
            callback();
          }
        }),
        end: jest.fn(),
      };

      (https.request as jest.MockedFunction<typeof https.request>).mockReturnValue(
        mockRequest as unknown as ReturnType<typeof https.request>
      );

      await checkForUpdates();

      expect(storage.setMetadata).toHaveBeenCalled();
    });
  });
});
