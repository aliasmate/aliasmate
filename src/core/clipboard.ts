import { spawnSync } from 'child_process';
import * as os from 'os';

/** Copy text to the system clipboard. Returns false if no tool is available. */
export function copyToClipboard(text: string): boolean {
  const candidates: Array<[string, string[]]> =
    os.platform() === 'darwin'
      ? [['pbcopy', []]]
      : os.platform() === 'win32'
        ? [['clip', []]]
        : [
            ['wl-copy', []],
            ['xclip', ['-selection', 'clipboard']],
            ['xsel', ['--clipboard', '--input']],
          ];
  for (const [cmd, args] of candidates) {
    const result = spawnSync(cmd, args, { input: text, stdio: ['pipe', 'ignore', 'ignore'] });
    if (result.status === 0) return true;
  }
  return false;
}
