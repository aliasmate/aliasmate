import * as path from 'path';
import * as fs from 'fs';

/**
 * Resolve a path, handling relative paths, absolute paths, and special cases
 * Works cross-platform (Windows, macOS, Linux)
 *
 * @param inputPath - The path to resolve
 * @param basePath - The base path to resolve relative paths against (defaults to cwd)
 * @returns The resolved absolute path
 *
 * @example
 * ```ts
 * resolvePath('.', '/home/user') // => '/home/user'
 * resolvePath('..', '/home/user') // => '/home'
 * resolvePath('/absolute/path') // => '/absolute/path'
 * resolvePath('relative/path', '/base') // => '/base/relative/path'
 * ```
 */
export function resolvePath(inputPath: string, basePath: string = process.cwd()): string {
  if (!inputPath) {
    return basePath;
  }

  // If it's already absolute, return it normalized
  if (path.isAbsolute(inputPath)) {
    return path.normalize(inputPath);
  }

  // Handle special cases
  if (inputPath === '.') {
    return basePath;
  }

  if (inputPath === '..') {
    return path.dirname(basePath);
  }

  // Resolve relative to base path
  return path.resolve(basePath, inputPath);
}

/**
 * Validate that a directory exists and is accessible
 *
 * @param dirPath - The directory path to validate
 * @returns true if directory exists and is accessible, false otherwise
 *
 * @example
 * ```ts
 * if (isValidDirectory('/home/user/project')) {
 *   console.log('Directory is valid');
 * }
 * ```
 */
export function isValidDirectory(dirPath: string): boolean {
  try {
    const stats = fs.statSync(dirPath);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
}

/**
 * Sanitize a command name by removing invalid characters
 *
 * @param name - The command name to sanitize
 * @returns Sanitized command name
 *
 * @example
 * ```ts
 * sanitizeCommandName('my command!') // => 'my-command'
 * ```
 */
export function sanitizeCommandName(name: string): string {
  return name
    .trim()
    .replace(/[\s]+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-zA-Z0-9_-]/g, '') // Remove invalid characters
    .toLowerCase();
}
