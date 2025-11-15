import * as path from 'path';

/**
 * Resolve a path, handling relative paths, absolute paths, and special cases
 * Cross-platform path resolution
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
