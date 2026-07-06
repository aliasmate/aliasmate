import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { listCommands, listAliases } from '../core/commands';
import { ok, fail, theme } from '../ui/theme';

const SUBCOMMANDS =
  'run save prev list search edit rename delete export import alias recent validate stats copy undo chain tag init project sync completion config help';

function savedNames(): string {
  return [...Object.keys(listCommands()), ...Object.keys(listAliases())].join(' ');
}

function bashScript(): string {
  return `# aliasmate bash completion
_aliasmate_complete() {
  local cur prev
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"
  if [ "$COMP_CWORD" -eq 1 ]; then
    COMPREPLY=( $(compgen -W "${SUBCOMMANDS}" -- "$cur") )
  elif [ "$prev" = "run" ] || [ "$prev" = "edit" ] || [ "$prev" = "rename" ] || [ "$prev" = "mv" ] || [ "$prev" = "delete" ] || [ "$prev" = "rm" ] || [ "$prev" = "validate" ] || [ "$prev" = "copy" ] || [ "$prev" = "tag" ]; then
    COMPREPLY=( $(compgen -W "$(aliasmate completion --names 2>/dev/null)" -- "$cur") )
  fi
}
complete -F _aliasmate_complete aliasmate
`;
}

function zshScript(): string {
  return `# aliasmate zsh completion
_aliasmate() {
  local -a subcmds
  subcmds=(${SUBCOMMANDS})
  if (( CURRENT == 2 )); then
    _describe 'command' subcmds
  elif [[ \${words[2]} == (run|edit|rename|mv|delete|rm|validate|copy|tag) ]]; then
    local -a names
    names=($(aliasmate completion --names 2>/dev/null))
    _describe 'saved command' names
  fi
}
compdef _aliasmate aliasmate
`;
}

function fishScript(): string {
  return `# aliasmate fish completion
complete -c aliasmate -f
complete -c aliasmate -n "__fish_use_subcommand" -a "${SUBCOMMANDS}"
complete -c aliasmate -n "__fish_seen_subcommand_from run edit rename mv delete rm validate copy tag" -a "(aliasmate completion --names 2>/dev/null)"
`;
}

function detectShell(): 'bash' | 'zsh' | 'fish' | null {
  const shell = process.env.SHELL ?? '';
  if (shell.includes('zsh')) return 'zsh';
  if (shell.includes('bash')) return 'bash';
  if (shell.includes('fish')) return 'fish';
  return null;
}

function installCompletion(): void {
  const shell = detectShell();
  const home = os.homedir();
  if (shell === 'fish') {
    const dir = path.join(home, '.config', 'fish', 'completions');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'aliasmate.fish'), fishScript(), 'utf8');
    ok('Fish completion installed. It loads automatically in new shells.');
    return;
  }
  if (shell === 'bash' || shell === 'zsh') {
    const rc = path.join(home, shell === 'zsh' ? '.zshrc' : '.bashrc');
    const line = `source <(aliasmate completion ${shell})`;
    const existing = fs.existsSync(rc) ? fs.readFileSync(rc, 'utf8') : '';
    if (existing.includes(line)) {
      ok('Completion is already installed.');
      return;
    }
    fs.appendFileSync(rc, `\n# aliasmate completion\n${line}\n`, 'utf8');
    ok(`Completion added to ${rc}`);
    console.log(theme.dim(`  Reload with: source ${rc}`));
    return;
  }
  fail(
    'Could not detect your shell. Generate a script manually: aliasmate completion <bash|zsh|fish>'
  );
  process.exitCode = 1;
}

export function completionHandler(
  shell: string | undefined,
  options: { install?: boolean; names?: boolean }
): void {
  if (options.names) {
    console.log(savedNames());
    return;
  }
  if (options.install || shell === 'install') {
    installCompletion();
    return;
  }
  switch (shell) {
    case 'bash':
      console.log(bashScript());
      break;
    case 'zsh':
      console.log(zshScript());
      break;
    case 'fish':
      console.log(fishScript());
      break;
    default:
      fail('Usage: aliasmate completion <bash|zsh|fish> or aliasmate completion install');
      process.exitCode = 1;
  }
}
