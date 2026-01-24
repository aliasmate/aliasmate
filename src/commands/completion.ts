import chalk from 'chalk';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { loadAliases } from '../storage';

/**
 * Generate bash completion script
 */
export function generateBashCompletion(): string {
  const aliases = loadAliases();
  const commandNames = Object.keys(aliases);
  const commandList = commandNames.join(' ');

  return `# Bash completion for aliasmate
# Source this file or add it to your ~/.bashrc:
#   source <(aliasmate completion bash)

_aliasmate_completion() {
    local cur prev opts base
    COMPREPLY=()
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"

    # Main commands
    local commands="prev run save list ls search find recent delete rm edit export import changelog alias validate config completion"
    
    # Saved command names
    local saved_commands="${commandList}"

    # Options for specific commands
    case "\${COMP_WORDS[1]}" in
        run)
            case "\${prev}" in
                run)
                    COMPREPLY=( $(compgen -W "\${saved_commands}" -- \${cur}) )
                    return 0
                    ;;
                --format)
                    COMPREPLY=( $(compgen -W "table json yaml compact" -- \${cur}) )
                    return 0
                    ;;
                *)
                    if [[ \${cur} == -* ]] ; then
                        COMPREPLY=( $(compgen -W "--dry-run --verbose" -- \${cur}) )
                        return 0
                    else
                        COMPREPLY=( $(compgen -d -- \${cur}) )
                        return 0
                    fi
                    ;;
            esac
            ;;
        list|ls)
            case "\${prev}" in
                --format)
                    COMPREPLY=( $(compgen -W "table json yaml compact" -- \${cur}) )
                    return 0
                    ;;
                *)
                    if [[ \${cur} == -* ]] ; then
                        COMPREPLY=( $(compgen -W "--format" -- \${cur}) )
                        return 0
                    fi
                    ;;
            esac
            ;;
        export)
            case "\${prev}" in
                --format)
                    COMPREPLY=( $(compgen -W "json yaml" -- \${cur}) )
                    return 0
                    ;;
                export)
                    COMPREPLY=( $(compgen -f -- \${cur}) )
                    return 0
                    ;;
                *)
                    if [[ \${cur} == -* ]] ; then
                        COMPREPLY=( $(compgen -W "--format" -- \${cur}) )
                        return 0
                    fi
                    ;;
            esac
            ;;
        import)
            case "\${prev}" in
                import)
                    COMPREPLY=( $(compgen -f -- \${cur}) )
                    return 0
                    ;;
            esac
            ;;
        delete|rm|edit|validate|prev)
            case "\${prev}" in
                delete|rm|edit|validate|prev)
                    COMPREPLY=( $(compgen -W "\${saved_commands}" -- \${cur}) )
                    return 0
                    ;;
            esac
            ;;
        alias)
            case "\${prev}" in
                alias)
                    if [[ \${cur} == -* ]] ; then
                        COMPREPLY=( $(compgen -W "--list --remove" -- \${cur}) )
                        return 0
                    fi
                    ;;
                --remove)
                    # Get aliases from storage
                    COMPREPLY=( $(compgen -W "\${saved_commands}" -- \${cur}) )
                    return 0
                    ;;
            esac
            ;;
        recent)
            case "\${prev}" in
                --limit)
                    return 0
                    ;;
                *)
                    if [[ \${cur} == -* ]] ; then
                        COMPREPLY=( $(compgen -W "--limit --clear" -- \${cur}) )
                        return 0
                    fi
                    ;;
            esac
            ;;
        save)
            if [[ \${cur} == -* ]] ; then
                COMPREPLY=( $(compgen -W "--no-validate" -- \${cur}) )
                return 0
            fi
            ;;
        completion)
            case "\${prev}" in
                completion)
                    COMPREPLY=( $(compgen -W "bash zsh fish" -- \${cur}) )
                    return 0
                    ;;
            esac
            ;;
        *)
            COMPREPLY=( $(compgen -W "\${commands}" -- \${cur}) )
            return 0
            ;;
    esac
}

complete -F _aliasmate_completion aliasmate
`;
}

/**
 * Generate zsh completion script
 */
export function generateZshCompletion(): string {
  const aliases = loadAliases();
  const commandNames = Object.keys(aliases);
  const commandList = commandNames.map((name) => `'${name}'`).join(' ');

  return `#compdef aliasmate
# Zsh completion for aliasmate
# Add this file to your fpath or add to ~/.zshrc:
#   source <(aliasmate completion zsh)

_aliasmate() {
    local line state

    _arguments -C \\
        "1: :->cmds" \\
        "*::arg:->args"

    case "$state" in
        cmds)
            _values 'commands' \\
                'prev[Save previous command from history]' \\
                'run[Run a saved command]' \\
                'save[Interactively save a command]' \\
                'list[List all saved commands]' \\
                'ls[List all saved commands]' \\
                'search[Search for commands]' \\
                'find[Search for commands]' \\
                'recent[Show recently executed commands]' \\
                'delete[Delete a saved command]' \\
                'rm[Delete a saved command]' \\
                'edit[Edit a saved command]' \\
                'export[Export commands to file]' \\
                'import[Import commands from file]' \\
                'changelog[View version changelog]' \\
                'alias[Create, list, or remove aliases]' \\
                'validate[Validate command(s)]' \\
                'config[Show config file location]' \\
                'completion[Generate shell completion script]'
            ;;
        args)
            case "$line[1]" in
                run)
                    _arguments \\
                        '1:command name:(${commandList})' \\
                        '2:path:_files -/' \\
                        '--dry-run[Preview without executing]' \\
                        '--verbose[Show detailed information]'
                    ;;
                list|ls)
                    _arguments \\
                        '--format[Output format]:format:(table json yaml compact)'
                    ;;
                export)
                    _arguments \\
                        '1:file:_files' \\
                        '--format[Output format]:format:(json yaml)'
                    ;;
                import)
                    _arguments \\
                        '1:file:_files'
                    ;;
                delete|rm|edit|validate|prev)
                    _arguments \\
                        "1:command name:(${commandList})"
                    ;;
                search|find)
                    _arguments \\
                        '1:query:'
                    ;;
                alias)
                    _arguments \\
                        '1:alias name:' \\
                        '2:command name:(${commandList})' \\
                        '--list[List all aliases]' \\
                        '--remove[Remove an alias]:alias:(${commandList})'
                    ;;
                recent)
                    _arguments \\
                        '--limit[Maximum number to display]:limit:' \\
                        '--clear[Clear execution history]'
                    ;;
                save)
                    _arguments \\
                        '--no-validate[Skip validation checks]'
                    ;;
                completion)
                    _arguments \\
                        '1:shell:(bash zsh fish)'
                    ;;
            esac
            ;;
    esac
}

compdef _aliasmate aliasmate
`;
}

/**
 * Generate fish completion script
 */
export function generateFishCompletion(): string {
  const aliases = loadAliases();
  const commandNames = Object.keys(aliases);
  const commandCompletions = commandNames
    .map(
      (name) =>
        `complete -c aliasmate -n "__fish_seen_subcommand_from run delete rm edit validate prev" -a "${name}"`
    )
    .join('\n');

  return `# Fish completion for aliasmate
# Save this to ~/.config/fish/completions/aliasmate.fish or add to your config:
#   aliasmate completion fish > ~/.config/fish/completions/aliasmate.fish

# Disable file completion by default
complete -c aliasmate -f

# Main commands
complete -c aliasmate -n "__fish_use_subcommand" -a "prev" -d "Save previous command from history"
complete -c aliasmate -n "__fish_use_subcommand" -a "run" -d "Run a saved command"
complete -c aliasmate -n "__fish_use_subcommand" -a "save" -d "Interactively save a command"
complete -c aliasmate -n "__fish_use_subcommand" -a "list" -d "List all saved commands"
complete -c aliasmate -n "__fish_use_subcommand" -a "ls" -d "List all saved commands"
complete -c aliasmate -n "__fish_use_subcommand" -a "search" -d "Search for commands"
complete -c aliasmate -n "__fish_use_subcommand" -a "find" -d "Search for commands"
complete -c aliasmate -n "__fish_use_subcommand" -a "recent" -d "Show recently executed commands"
complete -c aliasmate -n "__fish_use_subcommand" -a "delete" -d "Delete a saved command"
complete -c aliasmate -n "__fish_use_subcommand" -a "rm" -d "Delete a saved command"
complete -c aliasmate -n "__fish_use_subcommand" -a "edit" -d "Edit a saved command"
complete -c aliasmate -n "__fish_use_subcommand" -a "export" -d "Export commands to file"
complete -c aliasmate -n "__fish_use_subcommand" -a "import" -d "Import commands from file"
complete -c aliasmate -n "__fish_use_subcommand" -a "changelog" -d "View version changelog"
complete -c aliasmate -n "__fish_use_subcommand" -a "alias" -d "Create, list, or remove aliases"
complete -c aliasmate -n "__fish_use_subcommand" -a "validate" -d "Validate command(s)"
complete -c aliasmate -n "__fish_use_subcommand" -a "config" -d "Show config file location"
complete -c aliasmate -n "__fish_use_subcommand" -a "completion" -d "Generate shell completion script"

# Saved command completions
${commandCompletions}

# run command options
complete -c aliasmate -n "__fish_seen_subcommand_from run" -l dry-run -d "Preview without executing"
complete -c aliasmate -n "__fish_seen_subcommand_from run" -l verbose -d "Show detailed information"

# list/ls command options
complete -c aliasmate -n "__fish_seen_subcommand_from list ls" -l format -d "Output format" -a "table json yaml compact"

# export command options
complete -c aliasmate -n "__fish_seen_subcommand_from export" -l format -d "Output format" -a "json yaml"

# alias command options
complete -c aliasmate -n "__fish_seen_subcommand_from alias" -l list -d "List all aliases"
complete -c aliasmate -n "__fish_seen_subcommand_from alias" -l remove -d "Remove an alias"

# recent command options
complete -c aliasmate -n "__fish_seen_subcommand_from recent" -l limit -d "Maximum number to display"
complete -c aliasmate -n "__fish_seen_subcommand_from recent" -l clear -d "Clear execution history"

# save command options
complete -c aliasmate -n "__fish_seen_subcommand_from save" -l no-validate -d "Skip validation checks"

# validate command options
complete -c aliasmate -n "__fish_seen_subcommand_from validate" -l all -d "Validate all saved commands"

# completion command shell types
complete -c aliasmate -n "__fish_seen_subcommand_from completion" -a "bash zsh fish" -d "Shell type"

# File completions for import/export
complete -c aliasmate -n "__fish_seen_subcommand_from import export" -F
`;
}

/**
 * Detect the user's current shell
 */
export function detectShell(): string | null {
  const shell = process.env.SHELL || '';
  
  if (shell.includes('bash')) return 'bash';
  if (shell.includes('zsh')) return 'zsh';
  if (shell.includes('fish')) return 'fish';
  
  return null;
}

/**
 * Get the shell config file path
 */
export function getShellConfigPath(shell: string): string {
  const homeDir = os.homedir();
  
  switch (shell) {
    case 'bash':
      return path.join(homeDir, '.bashrc');
    case 'zsh':
      return path.join(homeDir, '.zshrc');
    case 'fish':
      // For fish, return the completions file path
      return path.join(homeDir, '.config', 'fish', 'completions', 'aliasmate.fish');
    default:
      throw new Error(`Unsupported shell: ${shell}`);
  }
}

/**
 * Install completion for the specified shell
 */
export function installCompletion(shell?: string): void {
  try {
    // Detect shell if not specified
    const targetShell = shell?.toLowerCase() || detectShell();
    
    if (!targetShell) {
      console.error(chalk.red('Error: Could not detect your shell'));
      console.log(chalk.yellow('Please specify the shell explicitly:'));
      console.log(chalk.cyan('  aliasmate completion install bash'));
      console.log(chalk.cyan('  aliasmate completion install zsh'));
      console.log(chalk.cyan('  aliasmate completion install fish'));
      process.exit(1);
    }

    if (!['bash', 'zsh', 'fish'].includes(targetShell)) {
      console.error(chalk.red(`Error: Unsupported shell "${targetShell}"`));
      console.log(chalk.yellow('Supported shells: bash, zsh, fish'));
      process.exit(1);
    }

    const configPath = getShellConfigPath(targetShell);
    const completionLine = targetShell === 'fish'
      ? "# AliasMate completion (run 'aliasmate completion fish > ~/.config/fish/completions/aliasmate.fish')"
      : `source <(aliasmate completion ${targetShell})  # AliasMate completion`;

    // Check if already installed
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      if (configContent.includes('aliasmate completion')) {
        console.log(chalk.yellow('✓ AliasMate completion is already installed'));
        console.log(chalk.gray(`  Found in: ${configPath}`));
        console.log();
        console.log(chalk.gray('To reload:'));
        console.log(chalk.cyan(`  source ${configPath}`));
        return;
      }
    }

    // For fish, we need to create the completions directory and file
    if (targetShell === 'fish') {
      const fishCompletionDir = path.join(os.homedir(), '.config', 'fish', 'completions');
      const fishCompletionFile = path.join(fishCompletionDir, 'aliasmate.fish');

      // Create directory if it doesn't exist
      if (!fs.existsSync(fishCompletionDir)) {
        fs.mkdirSync(fishCompletionDir, { recursive: true });
      }

      // Write completion file
      fs.writeFileSync(fishCompletionFile, generateFishCompletion(), 'utf8');

      console.log(chalk.green('✓ AliasMate completion installed successfully!'));
      console.log(chalk.gray(`  Installed to: ${fishCompletionFile}`));
      console.log();
      console.log(chalk.bold('Next steps:'));
      console.log(chalk.gray('  1. Restart your terminal or run:'));
      console.log(chalk.cyan('     exec fish'));
      console.log(chalk.gray('  2. Test completion:'));
      console.log(chalk.cyan('     aliasmate <TAB>'));
    } else {
      // For bash/zsh, append to config file
      const configDir = path.dirname(configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      // Append completion line
      fs.appendFileSync(configPath, `\n# AliasMate completion\n${completionLine}\n`, 'utf8');

      console.log(chalk.green('✓ AliasMate completion installed successfully!'));
      console.log(chalk.gray(`  Added to: ${configPath}`));
      console.log();
      console.log(chalk.bold('Next steps:'));
      console.log(chalk.gray('  1. Reload your shell config:'));
      console.log(chalk.cyan(`     source ${configPath}`));
      console.log(chalk.gray('  2. Test completion:'));
      console.log(chalk.cyan('     aliasmate <TAB>'));
    }
  } catch (error) {
    console.error(chalk.red('Error installing completion:'));
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

/**
 * Display completion script for specified shell
 */
export function completionCommand(shell?: string, options?: { install?: boolean }): void {
  // Handle install subcommand
  if (options?.install || shell === 'install') {
    const targetShell = shell === 'install' ? undefined : shell;
    installCompletion(targetShell);
    return;
  }

  if (!shell) {
    console.log(chalk.yellow('Usage: aliasmate completion <shell>'));
    console.log(chalk.gray('\nAvailable shells:'));
    console.log(chalk.gray('  bash  - Generate bash completion script'));
    console.log(chalk.gray('  zsh   - Generate zsh completion script'));
    console.log(chalk.gray('  fish  - Generate fish completion script'));
    console.log(chalk.bold.cyan('\n🚀 Quick Install:'));
    console.log(chalk.cyan('  aliasmate completion install'));
    console.log(chalk.gray('  (Auto-detects your shell and installs completion)'));
    console.log(chalk.gray('\nExamples:'));
    console.log(chalk.cyan('  # Bash'));
    console.log(chalk.gray('  source <(aliasmate completion bash)'));
    console.log(chalk.cyan('\n  # Zsh'));
    console.log(chalk.gray('  source <(aliasmate completion zsh)'));
    console.log(chalk.cyan('\n  # Fish'));
    console.log(
      chalk.gray('  aliasmate completion fish > ~/.config/fish/completions/aliasmate.fish')
    );
    console.log(chalk.bold.cyan('\n  # Auto-install (recommended)'));
    console.log(chalk.gray('  aliasmate completion install'));
    return;
  }

  const normalizedShell = shell.toLowerCase();

  switch (normalizedShell) {
    case 'bash':
      console.log(generateBashCompletion());
      break;
    case 'zsh':
      console.log(generateZshCompletion());
      break;
    case 'fish':
      console.log(generateFishCompletion());
      break;
    default:
      console.error(chalk.red(`Error: Unsupported shell "${shell}"`));
      console.log(chalk.yellow('Supported shells: bash, zsh, fish'));
      process.exit(1);
  }
}
