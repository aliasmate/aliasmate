# AliasMate

Save shell commands with their working directories and re-run them from anywhere. Never lose a useful command again.

[![Version](https://img.shields.io/npm/v/aliasmate.svg)](https://www.npmjs.com/package/aliasmate)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Install

**Standalone (no Node.js required):**

```bash
curl -fsSL https://raw.githubusercontent.com/akhshyganesh/aliasmate/main/install.sh | sh
```

Downloads a self-contained binary for macOS (Intel/Apple Silicon) or Linux (x64/arm64). Windows users: grab `aliasmate-win-x64.exe` from the [latest release](https://github.com/akhshyganesh/aliasmate/releases/latest).

**Via npm** (requires Node.js 18+):

```bash
npm i -g aliasmate
```

## Quick start

```bash
# Run any command, then capture it — the TUI opens with everything prefilled
npm run build -- --production
aliasmate prev build

# Run it later, from any directory — it executes back in the project folder
aliasmate run build

# Or open the full-screen TUI
aliasmate
```

Running `aliasmate` with no arguments opens a full-screen TUI: your commands sorted by usage with a live detail pane. Everything happens in-screen:

| Key | Action |
|-----|--------|
| `↑↓` / `jk` | move |
| `enter` | run selected command |
| `/` | fuzzy filter (type to narrow) |
| `n` | new command (in-TUI form) |
| `e` | edit selected (in-TUI form) |
| `d` | delete (with confirm) |
| `←→` | move the caret while editing form fields |
| `s` | usage stats |
| `x` | export a full backup (JSON) |
| `i` | import commands from a JSON file |
| `q` / `esc` | quit |

## Commands

| Command | Description |
|---------|-------------|
| `aliasmate` | Full-screen TUI (browse/run/create/edit/delete/stats) |
| `aliasmate prev [name]` | Capture your last shell command → TUI form, prefilled (saves directly when scripted) |
| `aliasmate save` | Open the TUI with a blank new-command form |
| `aliasmate run <name> [path]` | Run a saved command, optionally in a different directory |
| `aliasmate run @0` | Re-run your most recent command (`@1`, `@2`, …) |
| `aliasmate run <name> --dry-run [--verbose]` | Preview without executing |
| `aliasmate list` (`ls`) | List commands (`--format table\|json\|yaml\|compact`) |
| `aliasmate search <query>` (`find`) | Search by name, text, or directory |
| `aliasmate edit <name>` | Edit a command in the TUI form (change the name field to rename) |
| `aliasmate rename <old> <new>` (`mv`) | Rename a command — aliases and run history follow |
| `aliasmate delete <name>` (`rm`) | Delete a command (`-f` skips confirmation) |
| `aliasmate alias <short> <name>` | Create a shortcut alias (`--list`, `--remove <a>`) |
| `aliasmate recent` | Recently run commands with `@N` indices (`--clear`) |
| `aliasmate stats` | Usage statistics: most-used commands, total runs |
| `aliasmate validate [name]` | Check commands, directories, and env vars |
| `aliasmate export <file>` | Export to JSON/YAML — secrets masked for sharing |
| `aliasmate export <file> --full` | Restorable backup with real secret values |
| `aliasmate import <file>` | Import from JSON (backs up your config first) |
| `aliasmate completion install` | Install tab completion (bash/zsh/fish) |
| `aliasmate config` | Show where your data is stored |

## Key features

### Path modes
Each command runs either in its **saved directory** (project commands like `build`) or in your **current directory** (general utilities like `lint`). Choose when saving; change anytime with `edit`.

### Environment variables
When saving, you can capture user-defined env vars (`NODE_ENV`, `API_URL`, …) with the command — system noise like `PATH` is filtered out automatically. Variables whose names look sensitive (`KEY`, `TOKEN`, `SECRET`, `PASSWORD`, …) are masked in listings and exports, so sharing a team export never leaks secrets.

### Safety
- `--dry-run` previews exactly what will execute, where, and with which env vars.
- Destructive-looking commands (`rm -rf`, `dd`, `mkfs`, …) get a warning before running.
- All writes to your config are atomic; a crash can never corrupt your data.
- `import` writes a timestamped backup of your existing config before touching it.

### Backup & restore

```bash
aliasmate export backup.json --full   # everything, including real env secrets
aliasmate import backup.json          # restore (auto-backs up current state first)
```

Default exports mask secret values so they're safe to share with a team; `--full` keeps them intact for personal backups.

### Recent commands & stats
Every run is tracked. `aliasmate run @0` re-runs your latest command, `aliasmate recent` lists history, and `aliasmate stats` shows your most-used commands.

## Shell setup (recommended)

`aliasmate prev` reads your shell history file, which most shells only flush on exit. For instant capture, enable real-time history:

- **zsh** (`~/.zshrc`): `setopt INC_APPEND_HISTORY`
- **bash** (`~/.bashrc`): `PROMPT_COMMAND="history -a"`
- **fish / PowerShell**: already immediate by default

Tab completion:

```bash
aliasmate completion install
```

## Where data lives

`~/.config/aliasmate/` (override with the `ALIASMATE_HOME` environment variable):

- `config.json` — your saved commands
- `metadata.json` — aliases and run history

The format is unchanged from AliasMate 1.x — upgrading keeps all your commands.

## Development

```bash
npm install
npm run build       # compile TypeScript
npm test            # run the test suite
npm run lint        # ESLint
npm run format      # Prettier
npm link            # try the CLI locally
```

Architecture: `src/core/` is pure domain logic (storage, resolution, validation, execution) with no UI dependencies; `src/ui/` handles theming, formatting, and prompts; `src/cli/` contains thin command handlers that are lazy-loaded so startup stays fast (~30 ms).

## License

MIT
