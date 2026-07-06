import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ok, fail, theme } from '../ui/theme';

/**
 * Shell hooks keep ALIASMATE_LAST_CMD fresh on every prompt (making `prev`
 * instant and reliable) and append each command to a raw log that powers
 * "you keep running this — save it?" suggestions.
 */
function zshHook(): string {
  return `# aliasmate shell hook
_aliasmate_hook() {
  local last="$(fc -ln -1 2>/dev/null | sed 's/^[[:space:]]*//')"
  [ -n "$last" ] || return 0
  export ALIASMATE_LAST_CMD="$last"
  print -r -- "$last" >> "\${ALIASMATE_HOME:-$HOME/.config/aliasmate}/raw.log" 2>/dev/null || true
}
typeset -ag precmd_functions
if [[ -z "\${precmd_functions[(r)_aliasmate_hook]}" ]]; then
  precmd_functions+=(_aliasmate_hook)
fi
`;
}

function bashHook(): string {
  return `# aliasmate shell hook
_aliasmate_hook() {
  local last="$(HISTTIMEFORMAT= builtin history 1 2>/dev/null | sed 's/^ *[0-9]* *//')"
  [ -n "$last" ] || return 0
  export ALIASMATE_LAST_CMD="$last"
  printf '%s\\n' "$last" >> "\${ALIASMATE_HOME:-$HOME/.config/aliasmate}/raw.log" 2>/dev/null || true
}
case ";$PROMPT_COMMAND;" in
  *";_aliasmate_hook;"*) ;;
  *) PROMPT_COMMAND="_aliasmate_hook\${PROMPT_COMMAND:+;$PROMPT_COMMAND}" ;;
esac
`;
}

function fishHook(): string {
  return `# aliasmate shell hook
function _aliasmate_hook --on-event fish_postexec
  set -gx ALIASMATE_LAST_CMD $argv[1]
  set -l dir "$ALIASMATE_HOME"
  test -n "$dir"; or set dir "$HOME/.config/aliasmate"
  echo $argv[1] >> "$dir/raw.log" 2>/dev/null
end
`;
}

function detectShell(): 'bash' | 'zsh' | 'fish' | null {
  const shell = process.env.SHELL ?? '';
  if (shell.includes('zsh')) return 'zsh';
  if (shell.includes('bash')) return 'bash';
  if (shell.includes('fish')) return 'fish';
  return null;
}

function installHook(): void {
  const shell = detectShell();
  const home = os.homedir();
  if (shell === 'fish') {
    const dir = path.join(home, '.config', 'fish', 'conf.d');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'aliasmate.fish'), fishHook(), 'utf8');
    ok('Hook installed for fish. It loads automatically in new shells.');
    return;
  }
  if (shell === 'bash' || shell === 'zsh') {
    const rc = path.join(home, shell === 'zsh' ? '.zshrc' : '.bashrc');
    const line = `eval "$(aliasmate init ${shell})"`;
    const existing = fs.existsSync(rc) ? fs.readFileSync(rc, 'utf8') : '';
    if (existing.includes(line)) {
      ok('Hook is already installed.');
      return;
    }
    fs.appendFileSync(rc, `\n# aliasmate shell hook\n${line}\n`, 'utf8');
    ok(`Hook added to ${rc}`);
    console.log(theme.dim(`  Reload with: source ${rc}`));
    return;
  }
  fail('Could not detect your shell. Print a hook manually: aliasmate init <bash|zsh|fish>');
  process.exitCode = 1;
}

export function initHandler(shell: string | undefined): void {
  switch (shell) {
    case 'zsh':
      console.log(zshHook());
      break;
    case 'bash':
      console.log(bashHook());
      break;
    case 'fish':
      console.log(fishHook());
      break;
    case 'install':
    case undefined:
      installHook();
      break;
    default:
      fail('Usage: aliasmate init <bash|zsh|fish> or aliasmate init install');
      process.exitCode = 1;
  }
}
