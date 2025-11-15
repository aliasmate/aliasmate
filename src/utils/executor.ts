import execa from 'execa';
import * as path from 'path';
import * as fs from 'fs';

export interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
}

/**
 * Execute a command in a specific directory
 * Cross-platform command execution using execa
 */
export async function executeCommand(command: string, cwd: string): Promise<ExecutionResult> {
  try {
    // Resolve the directory path
    const resolvedCwd = path.resolve(cwd);
    
    // Check if directory exists
    if (!fs.existsSync(resolvedCwd)) {
      throw new Error(`Directory does not exist: ${resolvedCwd}`);
    }
    
    // Execute the command using the user's shell
    // stdio: 'inherit' allows real-time output to terminal
    await execa(command, {
      shell: true,
      cwd: resolvedCwd,
      stdio: 'inherit'
    });
    
    return {
      success: true,
      stdout: '',
      stderr: ''
    };
  } catch (error: any) {
    return {
      success: false,
      stdout: error.stdout || '',
      stderr: error.stderr || error.message
    };
  }
}
