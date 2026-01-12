import chalk from 'chalk';

/**
 * Custom error class for AliasMate specific errors
 */
export class AliasMateError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'AliasMateError';
  }
}

/**
 * Exit codes for the CLI
 */
export enum ExitCode {
  Success = 0,
  GeneralError = 1,
  InvalidInput = 2,
  FileNotFound = 3,
  PermissionDenied = 4,
}

/**
 * Display an error message and exit with the appropriate code
 */
export function exitWithError(message: string, exitCode: ExitCode = ExitCode.GeneralError): never {
  console.error(chalk.red('Error:'), message);
  process.exit(exitCode);
}

/**
 * Handle errors consistently across commands
 */
export function handleError(error: unknown, context?: string): never {
  if (error instanceof AliasMateError) {
    exitWithError(error.message);
  }

  if (error instanceof Error) {
    const message = context ? `${context}: ${error.message}` : error.message;
    exitWithError(message);
  }

  exitWithError('An unknown error occurred');
}

/**
 * Check if error is an inquirer TTY error
 */
export function isInquirerTTYError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isTtyError' in error &&
    error.isTtyError === true
  );
}
