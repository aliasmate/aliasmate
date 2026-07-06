import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

/** Parse one raw history line into a command, handling zsh/fish formats. */
export function parseHistoryLine(line: string): string {
  let cmd = line.trim();
  // zsh extended history: ": <timestamp>:<duration>;<command>"
  const zshMatch = cmd.match(/^:\s*\d+:\d+;(.*)$/);
  if (zshMatch) cmd = zshMatch[1].trim();
  // fish yaml-ish history: "- cmd: <command>"
  if (cmd.startsWith('- cmd:')) cmd = cmd.slice(6).trim();
  return cmd;
}

function isCaptureWorthy(cmd: string): boolean {
  return (
    cmd.length > 0 &&
    !cmd.startsWith('aliasmate') &&
    !cmd.startsWith('am ') &&
    cmd !== 'exit' &&
    cmd !== 'quit' &&
    cmd !== 'clear'
  );
}

function findHistoryFile(): string | null {
  const home = os.homedir();
  if (os.platform() === 'win32') {
    const psHistory = path.join(
      home,
      'AppData',
      'Roaming',
      'Microsoft',
      'Windows',
      'PowerShell',
      'PSReadLine',
      'ConsoleHost_history.txt'
    );
    return fs.existsSync(psHistory) ? psHistory : null;
  }
  const shell = process.env.SHELL ?? '';
  const candidates: string[] = [];
  if (shell.includes('zsh')) candidates.push(path.join(home, '.zsh_history'));
  if (shell.includes('bash')) candidates.push(path.join(home, '.bash_history'));
  if (shell.includes('fish'))
    candidates.push(path.join(home, '.local', 'share', 'fish', 'fish_history'));
  candidates.push(
    path.join(home, '.zsh_history'),
    path.join(home, '.bash_history'),
    path.join(home, '.sh_history'),
    path.join(home, '.history')
  );
  return candidates.find((f) => fs.existsSync(f)) ?? null;
}

/**
 * The last non-aliasmate command from shell history, or null if unavailable.
 * ALIASMATE_LAST_CMD (set by shell integration) takes precedence over the
 * history file, which most shells only flush on exit.
 */
export function getLastCommand(): string | null {
  const injected = process.env.ALIASMATE_LAST_CMD?.trim();
  if (injected && isCaptureWorthy(injected)) return injected;

  try {
    const file = findHistoryFile();
    if (!file) return null;
    const lines = fs.readFileSync(file, 'utf8').trim().split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      const cmd = parseHistoryLine(lines[i]);
      if (isCaptureWorthy(cmd)) return cmd;
    }
  } catch {
    // History unavailable is a soft failure; caller prompts manually.
  }
  return null;
}

/** Shell-specific instructions for real-time history writing. */
export function getHistoryConfigHint(): string {
  const shell = process.env.SHELL ?? '';
  if (os.platform() === 'win32') return 'PowerShell writes history immediately by default.';
  if (shell.includes('zsh'))
    return 'Add "setopt INC_APPEND_HISTORY" to ~/.zshrc, then run: source ~/.zshrc';
  if (shell.includes('bash'))
    return 'Add PROMPT_COMMAND="history -a" to ~/.bashrc, then run: source ~/.bashrc';
  if (shell.includes('fish')) return 'Fish writes history immediately by default.';
  return 'Configure your shell to flush history after every command.';
}
