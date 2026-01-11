import execa from 'execa';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Result of a command execution
 */
export interface ExecutionResult {
  /** Whether the command executed successfully */
  success: boolean;
  /** Standard output (may be empty when using stdio: 'inherit') */
  stdout: string;
  /** Standard error or error message */
  stderr: string;
  /** Exit code of the command (if available) */
  exitCode?: number;
}

/**
 * Execute a command in a specific directory
 * Uses execa with shell mode for cross-platform compatibility
 *
 * @param command - The shell command to execute
 * @param cwd - The working directory to execute the command in
 * @returns A promise that resolves with the execution result
 * @throws {Error} If the directory doesn't exist
 *
 * @example
 * ```ts
 * const result = await executeCommand('npm install', '/path/to/project');
 * if (result.success) {
 *   console.log('Installation successful');
 * }
 * ```
 */
export async function executeCommand(command: string, cwd: string): Promise<ExecutionResult> {
  // Validate inputs
  if (!command || !command.trim()) {
    throw new Error('Command cannot be empty');
  }

  // Resolve the directory path
  const resolvedCwd = path.resolve(cwd);

  // Check if directory exists
  if (!fs.existsSync(resolvedCwd)) {
    throw new Error(`Directory does not exist: ${resolvedCwd}`);
  }

  // Check if it's actually a directory
  const stats = fs.statSync(resolvedCwd);
  if (!stats.isDirectory()) {
    throw new Error(`Path is not a directory: ${resolvedCwd}`);
  }

  try {
    // Execute the command using the user's shell
    // stdio: 'inherit' allows real-time output to terminal
    await execa(command, {
      shell: true,
      cwd: resolvedCwd,
      stdio: 'inherit',
    });

    return {
      success: true,
      stdout: '',
      stderr: '',
      exitCode: 0,
    };
  } catch (error) {
    const execaError = error as execa.ExecaError;
    return {
      success: false,
      stdout: execaError.stdout || '',
      stderr: execaError.stderr || execaError.message,
      exitCode: execaError.exitCode,
    };
  }
}
