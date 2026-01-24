import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Validation result for a single check
 */
export interface ValidationResult {
  valid: boolean;
  message?: string;
  warning?: boolean; // If true, this is a warning, not an error
}

/**
 * Validation issue details
 */
export interface ValidationIssue {
  type: 'error' | 'warning';
  field: string;
  message: string;
}

/**
 * Full validation report
 */
export interface ValidationReport {
  valid: boolean;
  issues: ValidationIssue[];
}

/**
 * Check if a command exists in PATH
 * @param command - The command string (e.g., "npm run build")
 * @returns Validation result
 */
export function validateCommandExists(command: string): ValidationResult {
  if (!command || !command.trim()) {
    return {
      valid: false,
      message: 'Command cannot be empty',
    };
  }

  // Extract the first word (the actual command)
  const trimmed = command.trim();
  const firstWord = trimmed.split(/\s+/)[0];

  // Skip validation for shell built-ins and special characters
  const shellBuiltins = [
    'cd',
    'echo',
    'export',
    'source',
    '.',
    'eval',
    'exec',
    'set',
    'unset',
    'alias',
    'bg',
    'fg',
    'jobs',
    'kill',
    'pwd',
    'test',
    '[',
    'exit',
    'return',
  ];

  // Check if it starts with special characters (shell operators, pipes, etc.)
  if (/^[|&;<>()]/.test(firstWord)) {
    return {
      valid: true,
      warning: true,
      message: 'Command starts with shell operator - validation skipped',
    };
  }

  // Check if it's a shell builtin
  if (shellBuiltins.includes(firstWord)) {
    return { valid: true };
  }

  // Check if it's a path (contains /)
  if (firstWord.includes('/')) {
    // It's a path - check if the file exists and is executable
    try {
      const stats = fs.statSync(firstWord);
      if (!stats.isFile()) {
        return {
          valid: false,
          message: `Path "${firstWord}" exists but is not a file`,
        };
      }
      // Check if executable (on Unix-like systems)
      if (process.platform !== 'win32') {
        try {
          fs.accessSync(firstWord, fs.constants.X_OK);
        } catch {
          return {
            valid: true,
            warning: true,
            message: `File "${firstWord}" exists but may not be executable`,
          };
        }
      }
      return { valid: true };
    } catch {
      return {
        valid: false,
        message: `Command file "${firstWord}" not found`,
      };
    }
  }

  // Check if the command exists in PATH
  try {
    if (process.platform === 'win32') {
      execSync(`where ${firstWord}`, { stdio: 'ignore' });
    } else {
      execSync(`which ${firstWord}`, { stdio: 'ignore' });
    }
    return { valid: true };
  } catch {
    return {
      valid: true,
      warning: true,
      message: `Command "${firstWord}" not found in PATH - it may not be installed`,
    };
  }
}

/**
 * Validate directory exists and is accessible
 * @param directory - The directory path
 * @returns Validation result
 */
export function validateDirectory(directory: string): ValidationResult {
  if (!directory || !directory.trim()) {
    return {
      valid: false,
      message: 'Directory cannot be empty',
    };
  }

  const resolvedPath = path.resolve(directory);

  // Check if directory exists
  try {
    const stats = fs.statSync(resolvedPath);
    if (!stats.isDirectory()) {
      return {
        valid: false,
        message: `Path "${directory}" exists but is not a directory`,
      };
    }
  } catch {
    return {
      valid: false,
      message: `Directory "${directory}" does not exist`,
    };
  }

  // Check read/write permissions
  try {
    fs.accessSync(resolvedPath, fs.constants.R_OK);
  } catch {
    return {
      valid: false,
      message: `Directory "${directory}" is not readable`,
    };
  }

  try {
    fs.accessSync(resolvedPath, fs.constants.W_OK);
  } catch {
    return {
      valid: true,
      warning: true,
      message: `Directory "${directory}" is not writable`,
    };
  }

  return { valid: true };
}

/**
 * Basic shell syntax validation
 * @param command - The command string
 * @returns Validation result
 */
export function validateShellSyntax(command: string): ValidationResult {
  if (!command || !command.trim()) {
    return {
      valid: false,
      message: 'Command cannot be empty',
    };
  }

  const trimmed = command.trim();

  // Skip complex validation for commands with heredocs (they have their own syntax rules)
  const hasHeredoc = /<<\s*['"]?[A-Z_]+['"]?/.test(trimmed);
  if (hasHeredoc) {
    // For heredocs, just do basic validation
    return { valid: true };
  }

  // Check for unclosed quotes
  const singleQuotes = (trimmed.match(/'/g) || []).length;
  const doubleQuotes = (trimmed.match(/"/g) || []).length;
  const backticks = (trimmed.match(/`/g) || []).length;

  if (singleQuotes % 2 !== 0) {
    return {
      valid: false,
      message: 'Unclosed single quote in command',
    };
  }

  if (doubleQuotes % 2 !== 0) {
    return {
      valid: false,
      message: 'Unclosed double quote in command',
    };
  }

  if (backticks % 2 !== 0) {
    return {
      valid: false,
      message: 'Unclosed backtick in command',
    };
  }

  // Check for unmatched parentheses
  let parenDepth = 0;
  for (const char of trimmed) {
    if (char === '(') parenDepth++;
    if (char === ')') parenDepth--;
    if (parenDepth < 0) {
      return {
        valid: false,
        message: 'Unmatched closing parenthesis in command',
      };
    }
  }
  if (parenDepth !== 0) {
    return {
      valid: false,
      message: 'Unmatched opening parenthesis in command',
    };
  }

  // Check for unmatched braces
  let braceDepth = 0;
  for (const char of trimmed) {
    if (char === '{') braceDepth++;
    if (char === '}') braceDepth--;
    if (braceDepth < 0) {
      return {
        valid: false,
        message: 'Unmatched closing brace in command',
      };
    }
  }
  if (braceDepth !== 0) {
    return {
      valid: false,
      message: 'Unmatched opening brace in command',
    };
  }

  // Check for unmatched brackets
  let bracketDepth = 0;
  for (const char of trimmed) {
    if (char === '[') bracketDepth++;
    if (char === ']') bracketDepth--;
    if (bracketDepth < 0) {
      return {
        valid: false,
        message: 'Unmatched closing bracket in command',
      };
    }
  }
  if (bracketDepth !== 0) {
    return {
      valid: false,
      message: 'Unmatched opening bracket in command',
    };
  }

  // Check for invalid pipe sequences
  if (/\|\s*\|/.test(trimmed) && !/\|\|/.test(trimmed)) {
    return {
      valid: true,
      warning: true,
      message: 'Suspicious pipe sequence detected',
    };
  }

  // Check for trailing operators that need continuation
  if (/[|&]$/.test(trimmed)) {
    return {
      valid: false,
      message: 'Command ends with pipe or ampersand operator',
    };
  }

  return { valid: true };
}

/**
 * Validate environment variable names
 * @param envVars - Object containing environment variables
 * @returns Validation result
 */
export function validateEnvVars(envVars: Record<string, string>): ValidationResult {
  if (!envVars || Object.keys(envVars).length === 0) {
    return { valid: true };
  }

  const invalidVars: string[] = [];

  for (const key of Object.keys(envVars)) {
    // Check if variable name is valid
    // Valid env var names: start with letter or underscore, contain only alphanumeric and underscore
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
      invalidVars.push(key);
    }
  }

  if (invalidVars.length > 0) {
    return {
      valid: false,
      message: `Invalid environment variable names: ${invalidVars.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validate a command alias comprehensively
 * @param command - The command string
 * @param directory - The working directory
 * @param envVars - Optional environment variables
 * @returns Full validation report
 */
export function validateCommandAlias(
  command: string,
  directory: string,
  envVars?: Record<string, string>
): ValidationReport {
  const issues: ValidationIssue[] = [];

  // Validate command syntax
  const syntaxResult = validateShellSyntax(command);
  if (!syntaxResult.valid) {
    issues.push({
      type: 'error',
      field: 'command',
      message: syntaxResult.message || 'Invalid shell syntax',
    });
  } else if (syntaxResult.warning && syntaxResult.message) {
    issues.push({
      type: 'warning',
      field: 'command',
      message: syntaxResult.message,
    });
  }

  // Validate command exists
  const commandExistsResult = validateCommandExists(command);
  if (!commandExistsResult.valid) {
    issues.push({
      type: 'error',
      field: 'command',
      message: commandExistsResult.message || 'Command validation failed',
    });
  } else if (commandExistsResult.warning && commandExistsResult.message) {
    issues.push({
      type: 'warning',
      field: 'command',
      message: commandExistsResult.message,
    });
  }

  // Validate directory
  const directoryResult = validateDirectory(directory);
  if (!directoryResult.valid) {
    issues.push({
      type: 'error',
      field: 'directory',
      message: directoryResult.message || 'Directory validation failed',
    });
  } else if (directoryResult.warning && directoryResult.message) {
    issues.push({
      type: 'warning',
      field: 'directory',
      message: directoryResult.message,
    });
  }

  // Validate environment variables
  if (envVars) {
    const envResult = validateEnvVars(envVars);
    if (!envResult.valid) {
      issues.push({
        type: 'error',
        field: 'environment',
        message: envResult.message || 'Environment variable validation failed',
      });
    }
  }

  // Determine if overall validation passed
  const valid = !issues.some((issue) => issue.type === 'error');

  return {
    valid,
    issues,
  };
}
