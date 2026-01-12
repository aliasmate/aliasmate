import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Get the last command from shell history
 *
 * IMPORTANT: This reads from the shell history file, which may not include
 * the most recent commands until the shell writes them.
 *
 * For best results, configure your shell for immediate history writing:
 * - zsh: Add "setopt INC_APPEND_HISTORY" or "setopt SHARE_HISTORY" to ~/.zshrc
 * - bash: Add "PROMPT_COMMAND='history -a'" to ~/.bashrc
 * - PowerShell (Windows): History is written immediately by default
 *
 * Alternative: Use environment variable ALIASMATE_LAST_CMD passed from parent shell
 *
 * @returns The last command from history, or null if unavailable
 *
 * @example
 * ```ts
 * const lastCmd = getLastCommand();
 * if (lastCmd) {
 *   console.log(`Last command was: ${lastCmd}`);
 * }
 * ```
 */
export function getLastCommand(): string | null {
  try {
    // Check if the command was passed via environment variable
    // This allows shell integration: export ALIASMATE_LAST_CMD="$(!:0-1)"
    if (process.env.ALIASMATE_LAST_CMD) {
      const cmd = process.env.ALIASMATE_LAST_CMD.trim();
      if (cmd && !cmd.startsWith('aliasmate')) {
        return cmd;
      }
    }

    const homeDir = os.homedir();
    const platform = os.platform();
    let historyFile: string | null = null;

    // Determine history file based on platform and shell
    if (platform === 'win32') {
      // Windows PowerShell history
      const psHistoryPath = path.join(
        homeDir,
        'AppData',
        'Roaming',
        'Microsoft',
        'Windows',
        'PowerShell',
        'PSReadLine',
        'ConsoleHost_history.txt'
      );
      if (fs.existsSync(psHistoryPath)) {
        historyFile = psHistoryPath;
      }
    } else {
      // Unix-like systems (Linux, macOS)
      const shell = process.env.SHELL || '';

      if (shell.includes('zsh')) {
        historyFile = path.join(homeDir, '.zsh_history');
      } else if (shell.includes('bash')) {
        historyFile = path.join(homeDir, '.bash_history');
      } else if (shell.includes('fish')) {
        historyFile = path.join(homeDir, '.local', 'share', 'fish', 'fish_history');
      } else {
        // Try common locations
        const possibleFiles = [
          path.join(homeDir, '.zsh_history'),
          path.join(homeDir, '.bash_history'),
          path.join(homeDir, '.sh_history'),
          path.join(homeDir, '.history'),
        ];

        for (const file of possibleFiles) {
          if (fs.existsSync(file)) {
            historyFile = file;
            break;
          }
        }
      }
    }

    if (!historyFile || !fs.existsSync(historyFile)) {
      return null;
    }

    // Read the history file
    const content = fs.readFileSync(historyFile, 'utf8');
    const lines = content.trim().split('\n');

    // Process lines from most recent to oldest
    for (let i = lines.length - 1; i >= 0; i--) {
      let line = lines[i].trim();

      if (!line) continue;

      // Handle zsh extended history format: : timestamp:0;command
      if (line.match(/^:\s*\d+:\d+;/)) {
        line = line.split(';').slice(1).join(';').trim();
      }

      // Handle fish history format: - cmd: command
      if (line.startsWith('- cmd:')) {
        line = line.substring(6).trim();
      }

      // Skip aliasmate commands and empty lines
      if (line && !line.startsWith('aliasmate') && !line.startsWith('am ')) {
        return line;
      }
    }

    return null;
  } catch (error) {
    // Silent fail - return null if we can't read history
    return null;
  }
}

/**
 * Get shell-specific configuration instructions for real-time history
 *
 * @returns Instructions formatted for the user's shell
 *
 * @example
 * ```ts
 * const instructions = getHistoryConfigInstructions();
 * console.log(`Configure your shell:\n${instructions}`);
 * ```
 */
export function getHistoryConfigInstructions(): string {
  const platform = os.platform();
  const shell = process.env.SHELL || '';

  if (platform === 'win32') {
    return (
      'PowerShell writes history immediately. If using Git Bash, add to ~/.bashrc:\n' +
      '  PROMPT_COMMAND="history -a"'
    );
  } else if (shell.includes('zsh')) {
    return 'Add to ~/.zshrc:\n' + '  setopt INC_APPEND_HISTORY\n' + 'Then run: source ~/.zshrc';
  } else if (shell.includes('bash')) {
    return 'Add to ~/.bashrc:\n' + '  PROMPT_COMMAND="history -a"\n' + 'Then run: source ~/.bashrc';
  } else if (shell.includes('fish')) {
    return 'Fish writes history immediately by default';
  }

  return (
    'Configure your shell to write history immediately.\n' +
    'For bash: Add PROMPT_COMMAND="history -a" to ~/.bashrc\n' +
    'For zsh: Add "setopt INC_APPEND_HISTORY" to ~/.zshrc'
  );
}
