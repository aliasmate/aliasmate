import execa from 'execa';
import * as fs from 'fs';
import * as path from 'path';
import { ExecutionResult } from './types';

/**
 * Run a shell command with inherited stdio so interactive programs work.
 * Saved env vars are layered over the current process env.
 */
export async function executeCommand(
  command: string,
  cwd: string,
  env?: Record<string, string>
): Promise<ExecutionResult> {
  const resolvedCwd = path.resolve(cwd);
  if (!fs.existsSync(resolvedCwd) || !fs.statSync(resolvedCwd).isDirectory()) {
    throw new Error(`Directory does not exist: ${resolvedCwd}`);
  }

  const started = Date.now();
  try {
    await execa(command, {
      shell: true,
      cwd: resolvedCwd,
      stdio: 'inherit',
      env: env ? { ...process.env, ...env } : process.env,
    });
    return { success: true, exitCode: 0, durationMs: Date.now() - started };
  } catch (error) {
    const exitCode = (error as execa.ExecaError).exitCode ?? 1;
    return { success: false, exitCode, durationMs: Date.now() - started };
  }
}
