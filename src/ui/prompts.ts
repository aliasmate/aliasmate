import * as readline from 'readline';
import { theme } from './theme';

/** Minimal y/N confirmation for the few CLI flows that need one. */
export function confirm(message: string, defaultValue = false): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`${message} ${theme.faint(defaultValue ? '(Y/n)' : '(y/N)')} `, (answer) => {
      rl.close();
      const a = answer.trim().toLowerCase();
      resolve(a === '' ? defaultValue : a === 'y' || a === 'yes');
    });
  });
}
