import { describe, it, expect } from '@jest/globals';
import {
  isSensitiveEnvVar,
  isSystemEnvVar,
  getUserEnvVars,
  categorizeEnvVars,
  mergeEnvVars,
  getEnvOverrides,
  formatEnvVars,
  maskSensitiveEnvVars,
} from '../src/utils/env';

describe('env utilities', () => {
  describe('isSensitiveEnvVar', () => {
    it('should detect sensitive variable names', () => {
      expect(isSensitiveEnvVar('API_KEY')).toBe(true);
      expect(isSensitiveEnvVar('SECRET_TOKEN')).toBe(true);
      expect(isSensitiveEnvVar('DATABASE_PASSWORD')).toBe(true);
      expect(isSensitiveEnvVar('JWT_SECRET')).toBe(true);
      expect(isSensitiveEnvVar('AUTH_TOKEN')).toBe(true);
      expect(isSensitiveEnvVar('PRIVATE_KEY')).toBe(true);
      expect(isSensitiveEnvVar('OAUTH_CLIENT_SECRET')).toBe(true);
    });

    it('should not flag non-sensitive variables', () => {
      expect(isSensitiveEnvVar('NODE_ENV')).toBe(false);
      expect(isSensitiveEnvVar('DEBUG')).toBe(false);
      expect(isSensitiveEnvVar('PORT')).toBe(false);
      expect(isSensitiveEnvVar('DATABASE_URL')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isSensitiveEnvVar('api_key')).toBe(true);
      expect(isSensitiveEnvVar('Secret')).toBe(true);
      expect(isSensitiveEnvVar('PASSWORD')).toBe(true);
    });
  });

  describe('isSystemEnvVar', () => {
    it('should detect system environment variables', () => {
      expect(isSystemEnvVar('PATH')).toBe(true);
      expect(isSystemEnvVar('HOME')).toBe(true);
      expect(isSystemEnvVar('USER')).toBe(true);
      expect(isSystemEnvVar('SHELL')).toBe(true);
      expect(isSystemEnvVar('PWD')).toBe(true);
      expect(isSystemEnvVar('TERM')).toBe(true);
    });

    it('should not flag user variables as system vars', () => {
      expect(isSystemEnvVar('MY_VAR')).toBe(false);
      expect(isSystemEnvVar('NODE_ENV')).toBe(false);
      expect(isSystemEnvVar('API_KEY')).toBe(false);
    });
  });

  describe('getUserEnvVars', () => {
    it('should filter out system variables', () => {
      const mockEnv = {
        PATH: '/usr/bin',
        HOME: '/home/user',
        USER: 'testuser',
        MY_VAR: 'my_value',
        NODE_ENV: 'test',
      };

      const result = getUserEnvVars(mockEnv);

      expect(result).not.toHaveProperty('PATH');
      expect(result).not.toHaveProperty('HOME');
      expect(result).not.toHaveProperty('USER');
      expect(result).toHaveProperty('MY_VAR', 'my_value');
      expect(result).not.toHaveProperty('NODE_ENV'); // NODE_ENV is filtered as it starts with NODE_
    });

    it('should filter out npm and NODE variables', () => {
      const mockEnv = {
        npm_config_user: 'test',
        npm_lifecycle_event: 'test',
        NODE_VERSION: '18.0.0',
        NODE_PATH: '/usr/lib/node',
        MY_VAR: 'value',
      };

      const result = getUserEnvVars(mockEnv);

      expect(result).not.toHaveProperty('npm_config_user');
      expect(result).not.toHaveProperty('npm_lifecycle_event');
      expect(result).not.toHaveProperty('NODE_VERSION');
      expect(result).not.toHaveProperty('NODE_PATH');
      expect(result).toHaveProperty('MY_VAR', 'value');
    });

    it('should filter out VSCODE variables', () => {
      const mockEnv = {
        VSCODE_GIT_ASKPASS_NODE: '/path',
        VSCODE_INJECTION: '1',
        MY_VAR: 'value',
      };

      const result = getUserEnvVars(mockEnv);

      expect(result).not.toHaveProperty('VSCODE_GIT_ASKPASS_NODE');
      expect(result).not.toHaveProperty('VSCODE_INJECTION');
      expect(result).toHaveProperty('MY_VAR', 'value');
    });

    it('should handle undefined values', () => {
      const mockEnv = {
        DEFINED: 'value',
        UNDEFINED: undefined,
      };

      const result = getUserEnvVars(mockEnv);

      expect(result).toHaveProperty('DEFINED', 'value');
      expect(result).not.toHaveProperty('UNDEFINED');
    });

    it('should return empty object when no user vars exist', () => {
      const mockEnv = {
        PATH: '/usr/bin',
        HOME: '/home/user',
      };

      const result = getUserEnvVars(mockEnv);

      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe('categorizeEnvVars', () => {
    it('should separate sensitive and safe variables', () => {
      const env = {
        NODE_ENV: 'production',
        API_KEY: 'secret123',
        DATABASE_PASSWORD: 'dbpass',
        DEBUG: 'true',
        PORT: '3000',
      };

      const { sensitive, safe } = categorizeEnvVars(env);

      expect(sensitive).toHaveProperty('API_KEY', 'secret123');
      expect(sensitive).toHaveProperty('DATABASE_PASSWORD', 'dbpass');
      expect(Object.keys(sensitive)).toHaveLength(2);

      expect(safe).toHaveProperty('NODE_ENV', 'production');
      expect(safe).toHaveProperty('DEBUG', 'true');
      expect(safe).toHaveProperty('PORT', '3000');
      expect(Object.keys(safe)).toHaveLength(3);
    });

    it('should handle empty input', () => {
      const { sensitive, safe } = categorizeEnvVars({});

      expect(Object.keys(sensitive)).toHaveLength(0);
      expect(Object.keys(safe)).toHaveLength(0);
    });

    it('should handle all sensitive variables', () => {
      const env = {
        API_KEY: 'key1',
        SECRET: 'secret1',
        PASSWORD: 'pass1',
      };

      const { sensitive, safe } = categorizeEnvVars(env);

      expect(Object.keys(sensitive)).toHaveLength(3);
      expect(Object.keys(safe)).toHaveLength(0);
    });

    it('should handle all safe variables', () => {
      const env = {
        NODE_ENV: 'test',
        DEBUG: 'false',
        PORT: '8080',
      };

      const { sensitive, safe } = categorizeEnvVars(env);

      expect(Object.keys(sensitive)).toHaveLength(0);
      expect(Object.keys(safe)).toHaveLength(3);
    });
  });

  describe('mergeEnvVars', () => {
    it('should merge saved env with current env', () => {
      const savedEnv = {
        NODE_ENV: 'production',
        API_URL: 'https://api.example.com',
      };

      const currentEnv = {
        PATH: '/usr/bin',
        HOME: '/home/user',
      };

      const result = mergeEnvVars(savedEnv, currentEnv);

      expect(result).toHaveProperty('NODE_ENV', 'production');
      expect(result).toHaveProperty('API_URL', 'https://api.example.com');
      expect(result).toHaveProperty('PATH', '/usr/bin');
      expect(result).toHaveProperty('HOME', '/home/user');
    });

    it('should prioritize current env over saved env', () => {
      const savedEnv = {
        NODE_ENV: 'production',
        DEBUG: 'false',
      };

      const currentEnv = {
        NODE_ENV: 'development',
        PORT: '3000',
      };

      const result = mergeEnvVars(savedEnv, currentEnv);

      // Current env wins
      expect(result).toHaveProperty('NODE_ENV', 'development');
      expect(result).toHaveProperty('PORT', '3000');
      // Saved env only used if not in current
      expect(result).toHaveProperty('DEBUG', 'false');
    });

    it('should handle empty saved env', () => {
      const currentEnv = {
        PATH: '/usr/bin',
        NODE_ENV: 'test',
      };

      const result = mergeEnvVars({}, currentEnv);

      expect(result).toHaveProperty('PATH', '/usr/bin');
      expect(result).toHaveProperty('NODE_ENV', 'test');
    });
  });

  describe('getEnvOverrides', () => {
    it('should detect variables that exist in both with different values', () => {
      const savedEnv = {
        NODE_ENV: 'production',
        DEBUG: 'false',
        API_URL: 'https://prod.example.com',
      };

      const currentEnv = {
        NODE_ENV: 'development',
        DEBUG: 'false',
        PORT: '3000',
      };

      const overrides = getEnvOverrides(savedEnv, currentEnv);

      expect(overrides).toHaveLength(1);
      expect(overrides[0]).toEqual({
        name: 'NODE_ENV',
        savedValue: 'production',
        currentValue: 'development',
      });
    });

    it('should not flag variables with same values', () => {
      const savedEnv = {
        NODE_ENV: 'production',
        DEBUG: 'true',
      };

      const currentEnv = {
        NODE_ENV: 'production',
        DEBUG: 'true',
      };

      const overrides = getEnvOverrides(savedEnv, currentEnv);

      expect(overrides).toHaveLength(0);
    });

    it('should ignore saved vars not in current env', () => {
      const savedEnv = {
        API_KEY: 'key123',
        NODE_ENV: 'production',
      };

      const currentEnv = {
        DEBUG: 'true',
      };

      const overrides = getEnvOverrides(savedEnv, currentEnv);

      expect(overrides).toHaveLength(0);
    });

    it('should handle empty inputs', () => {
      expect(getEnvOverrides({}, {})).toHaveLength(0);
      expect(getEnvOverrides({ VAR: 'value' }, {})).toHaveLength(0);
      expect(getEnvOverrides({}, { VAR: 'value' })).toHaveLength(0);
    });
  });

  describe('formatEnvVars', () => {
    it('should format variables as key=value', () => {
      const env = {
        NODE_ENV: 'production',
        PORT: '3000',
      };

      const result = formatEnvVars(env);

      expect(result).toContain('NODE_ENV=production');
      expect(result).toContain('PORT=3000');
      expect(result).toHaveLength(2);
    });

    it('should sort variables alphabetically', () => {
      const env = {
        ZEBRA: 'last',
        APPLE: 'first',
        MIDDLE: 'second',
      };

      const result = formatEnvVars(env);

      expect(result[0]).toBe('APPLE=first');
      expect(result[1]).toBe('MIDDLE=second');
      expect(result[2]).toBe('ZEBRA=last');
    });

    it('should truncate long values', () => {
      const longValue = 'a'.repeat(100);
      const env = {
        LONG_VAR: longValue,
      };

      const result = formatEnvVars(env, 50);

      expect(result[0]).toContain('LONG_VAR=');
      expect(result[0]).toContain('...');
      expect(result[0].length).toBeLessThan(longValue.length + 10);
    });

    it('should not truncate short values', () => {
      const env = {
        SHORT: 'value',
      };

      const result = formatEnvVars(env, 50);

      expect(result[0]).toBe('SHORT=value');
      expect(result[0]).not.toContain('...');
    });

    it('should handle empty object', () => {
      const result = formatEnvVars({});

      expect(result).toHaveLength(0);
    });
  });

  describe('maskSensitiveEnvVars', () => {
    it('should mask sensitive variable values', () => {
      const env = {
        API_KEY: 'secret123456',
        PASSWORD: 'mypassword123',
        NODE_ENV: 'production',
      };

      const result = maskSensitiveEnvVars(env);

      expect(result.API_KEY).toMatch(/^sec\*+56$/);
      expect(result.PASSWORD).toMatch(/^myp\*+23$/);
      expect(result.NODE_ENV).toBe('production'); // Not masked
    });

    it('should mask short sensitive values completely', () => {
      const env = {
        SECRET: 'short',
      };

      const result = maskSensitiveEnvVars(env);

      expect(result.SECRET).toBe('*****');
      expect(result.SECRET).not.toContain('short');
    });

    it('should not mask safe variables', () => {
      const env = {
        NODE_ENV: 'production',
        DEBUG: 'true',
        PORT: '3000',
      };

      const result = maskSensitiveEnvVars(env);

      expect(result.NODE_ENV).toBe('production');
      expect(result.DEBUG).toBe('true');
      expect(result.PORT).toBe('3000');
    });

    it('should handle empty object', () => {
      const result = maskSensitiveEnvVars({});

      expect(Object.keys(result)).toHaveLength(0);
    });

    it('should preserve first 3 and last 2 characters for long values', () => {
      const env = {
        API_KEY: 'abcdefghijklmn',
      };

      const result = maskSensitiveEnvVars(env);

      expect(result.API_KEY).toMatch(/^abc\*+mn$/);
      expect(result.API_KEY.length).toBe(env.API_KEY.length);
    });
  });
});
