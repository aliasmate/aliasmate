/**
 * Utility functions for handling environment variables
 */

/**
 * System environment variables that should be excluded by default
 * These are typically OS-level vars that shouldn't be captured
 */
const SYSTEM_ENV_VARS = new Set([
  'PATH',
  'HOME',
  'USER',
  'SHELL',
  'TERM',
  'TMPDIR',
  'PWD',
  'OLDPWD',
  'SHLVL',
  'LOGNAME',
  'LANG',
  'LC_ALL',
  'LC_CTYPE',
  'DISPLAY',
  'EDITOR',
  'VISUAL',
  'PAGER',
  'MANPATH',
  'INFOPATH',
  'XDG_CONFIG_HOME',
  'XDG_DATA_HOME',
  'XDG_CACHE_HOME',
  'SSH_AUTH_SOCK',
  'SSH_AGENT_PID',
  '_',
  'COLORTERM',
  'TERM_PROGRAM',
  'TERM_PROGRAM_VERSION',
  'TERM_SESSION_ID',
]);

/**
 * Patterns that indicate potentially sensitive environment variables
 * These should trigger security warnings when captured
 */
const SENSITIVE_PATTERNS = [
  /key/i,
  /secret/i,
  /token/i,
  /password/i,
  /pass/i,
  /auth/i,
  /credential/i,
  /api[_-]?key/i,
  /private/i,
  /cert/i,
  /jwt/i,
  /bearer/i,
  /oauth/i,
];

/**
 * Check if an environment variable name appears to be sensitive
 * @param varName - The name of the environment variable
 * @returns true if the variable name matches sensitive patterns
 */
export function isSensitiveEnvVar(varName: string): boolean {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(varName));
}

/**
 * Check if an environment variable is a system variable that should be excluded
 * @param varName - The name of the environment variable
 * @returns true if the variable is a system variable
 */
export function isSystemEnvVar(varName: string): boolean {
  return SYSTEM_ENV_VARS.has(varName);
}

/**
 * Filter environment variables to get only user-defined (non-system) variables
 * @param env - The environment object to filter (defaults to process.env)
 * @returns Filtered environment variables excluding system variables
 */
export function getUserEnvVars(env: NodeJS.ProcessEnv = process.env): Record<string, string> {
  const filtered: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(env)) {
    // Skip undefined values, system vars, and vars starting with npm_ or NODE_
    if (
      value !== undefined &&
      !isSystemEnvVar(key) &&
      !key.startsWith('npm_') &&
      !key.startsWith('NODE_') &&
      !key.startsWith('VSCODE_')
    ) {
      filtered[key] = value;
    }
  }
  
  return filtered;
}

/**
 * Categorize environment variables into sensitive and non-sensitive
 * @param env - The environment object to categorize
 * @returns Object containing sensitive and safe environment variables
 */
export function categorizeEnvVars(env: Record<string, string>): {
  sensitive: Record<string, string>;
  safe: Record<string, string>;
} {
  const sensitive: Record<string, string> = {};
  const safe: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(env)) {
    if (isSensitiveEnvVar(key)) {
      sensitive[key] = value;
    } else {
      safe[key] = value;
    }
  }
  
  return { sensitive, safe };
}

/**
 * Merge saved environment variables with current environment
 * Current environment takes precedence to allow runtime overrides
 * @param savedEnv - Environment variables saved with the command
 * @param currentEnv - Current environment (defaults to process.env)
 * @returns Merged environment object
 */
export function mergeEnvVars(
  savedEnv: Record<string, string>,
  currentEnv: NodeJS.ProcessEnv = process.env
): NodeJS.ProcessEnv {
  // Start with current env (keeps all system vars)
  const merged = { ...currentEnv };
  
  // Add saved env vars (but current env takes precedence)
  for (const [key, value] of Object.entries(savedEnv)) {
    // Only add if not already in current env
    if (!(key in currentEnv)) {
      merged[key] = value;
    }
  }
  
  return merged;
}

/**
 * Get a list of environment variable names that will be overridden
 * @param savedEnv - Environment variables saved with the command
 * @param currentEnv - Current environment (defaults to process.env)
 * @returns Array of variable names that exist in both with different values
 */
export function getEnvOverrides(
  savedEnv: Record<string, string>,
  currentEnv: NodeJS.ProcessEnv = process.env
): Array<{ name: string; savedValue: string; currentValue: string }> {
  const overrides: Array<{ name: string; savedValue: string; currentValue: string }> = [];
  
  for (const [key, savedValue] of Object.entries(savedEnv)) {
    const currentValue = currentEnv[key];
    if (currentValue !== undefined && currentValue !== savedValue) {
      overrides.push({
        name: key,
        savedValue,
        currentValue,
      });
    }
  }
  
  return overrides;
}

/**
 * Format environment variables for display
 * Truncates long values for readability
 * @param env - Environment variables to format
 * @param maxLength - Maximum length for values (default: 50)
 * @returns Array of formatted strings
 */
export function formatEnvVars(env: Record<string, string>, maxLength: number = 50): string[] {
  return Object.entries(env)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => {
      const truncated = value.length > maxLength 
        ? `${value.substring(0, maxLength)}...` 
        : value;
      return `${key}=${truncated}`;
    });
}

/**
 * Mask sensitive values in environment variable display
 * @param env - Environment variables to mask
 * @returns Environment variables with masked sensitive values
 */
export function maskSensitiveEnvVars(env: Record<string, string>): Record<string, string> {
  const masked: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(env)) {
    if (isSensitiveEnvVar(key)) {
      // Show first 3 chars and last 2 chars, mask the rest
      if (value.length > 8) {
        masked[key] = `${value.substring(0, 3)}${'*'.repeat(value.length - 5)}${value.substring(value.length - 2)}`;
      } else {
        masked[key] = '*'.repeat(value.length);
      }
    } else {
      masked[key] = value;
    }
  }
  
  return masked;
}
