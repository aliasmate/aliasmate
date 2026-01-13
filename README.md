# AliasMate

A powerful CLI utility to save, manage, and re-run shell commands with their working directories. Never lose track of useful commands again!

[![Version](https://img.shields.io/npm/v/aliasmate.svg)](https://www.npmjs.com/package/aliasmate)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Code Style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

## Why Use AliasMate?

As developers, we often spend time crafting complex commands, navigating to specific directories, and repeating the same sequences. AliasMate solves this by:

- **Saving Time**: Quickly save and rerun frequently used commands without retyping them.
- **Reducing Errors**: Execute commands in their correct directories, avoiding path-related mistakes.
- **Boosting Productivity**: Focus on coding instead of remembering command syntax and locations.
- **Sharing Knowledge**: Export and import commands to share workflows with your team.
- **Organizing Workflows**: Keep your development environment clean and organized with named, reusable commands.

Whether you're a solo developer or part of a team, AliasMate helps you streamline your terminal workflow and maintain consistency across projects.

## Features

- 🚀 **Save previous commands** from shell history with one simple command
- 📂 **Remember working directories** where commands should be executed
- 🎯 **Path mode selection** - Choose between saved directory or current directory execution
- ⚡ **Quick execution** of saved commands with optional path override
- 📝 **Interactive save** with prompts for command and path
- 📋 **List all saved commands** with their details
- ✏️ **Edit commands** interactively
- 🗑️ **Delete unwanted commands**
- 📤 **Export/Import** commands for backup or sharing
- 🤖 **LLM Integration** - Default command to generate comprehensive documentation
- 🎉 **Onboarding experience** - Welcome tour for first-time users
- 🎨 **Beautiful colored output** for better readability
- 🔄 **Cross-platform** support (Linux, macOS, Windows)

## Installation

Install globally via npm:

```bash
npm i -g aliasmate
```

## Shell Configuration (Recommended)

For `aliasmate prev` to work reliably and capture commands immediately, configure your shell to write history in real-time:

### For zsh users (macOS default, Linux):

Add to `~/.zshrc`:
```bash
setopt INC_APPEND_HISTORY
```

Then reload:
```bash
source ~/.zshrc
```

### For bash users (Linux default, macOS optional):

Add to `~/.bashrc`:
```bash
PROMPT_COMMAND="history -a"
```

Then reload:
```bash
source ~/.bashrc
```

### Why is this needed?

**Without this configuration**, shells only write commands to the history file when the shell exits. This means:
- If you run `npm run dev` and press `^C` to cancel it, then immediately run `aliasmate prev`, the command won't be in the history file yet
- You'll see older commands captured instead (like `clear` or previous commands)

**With this configuration**, every command is written to history immediately after execution, making `aliasmate prev` work perfectly every time.

### Alternative: Use `aliasmate save`

If you prefer not to configure shell history, you can always use the interactive save:
```bash
aliasmate save
# Then enter your command manually
```

## Getting Started

1. **Install AliasMate** using the command above.
2. **Welcome Tour**: On first run, you'll see a helpful welcome message and quick tour explaining how AliasMate works.
3. **Default LLM Command**: A default "llm" command is automatically created that generates comprehensive documentation for AI assistants.
4. **Save a command**: After running any useful command in your terminal, save it with `aliasmate prev <name>`. For example:
   ```bash
   npm run build
   aliasmate prev build
   ```
3. **Run the command**: From anywhere, execute it with `aliasmate run <name>`:
   ```bash
   aliasmate run build
   ```
4. **Explore more**: Use `aliasmate list` to see all saved commands, `aliasmate edit <name>` to modify them, and more!

## Usage

### Save the Previous Command

Automatically capture the last command you ran:

```bash
# After running any command, save it
aliasmate prev <name>
```

**Example:**
```bash
npm run build
aliasmate prev build
# ✓ Saved command as "build"
#   Command: npm run build
#   Directory: /path/to/project
```

### Run a Saved Command

Execute a saved command in its original directory:

```bash
aliasmate run <name>
```

Or override the directory:

```bash
aliasmate run <name> .
aliasmate run <name> /path/to/another/project
```

**Example:**
```bash
aliasmate run build
# Running: npm run build
# Directory: /path/to/project
```

### Save a Command Interactively

Manually save a command with interactive prompts:

```bash
aliasmate save
```

You'll be prompted for:
- Command name
- Command to save
- Working directory (defaults to current directory)
- **Path mode** (NEW): Choose whether to run in saved directory or current directory

### Path Mode Feature

AliasMate now supports two path modes for each saved command:

#### Saved Directory Mode (Default)
Commands always run in the directory where they were saved. Perfect for project-specific commands.

```bash
# Save a build command for a specific project
cd /path/to/my-project
npm run build
aliasmate prev build

# Later, run from anywhere - it executes in /path/to/my-project
cd ~
aliasmate run build  # Runs in /path/to/my-project
```

#### Current Directory Mode
Commands run in your current working directory. Ideal for general-purpose utilities.

```bash
# Save a command with current directory mode
aliasmate save
# Enter name: lint
# Enter command: eslint .
# Enter directory: /any/path (doesn't matter)
# Choose: Current Directory

# Later, runs in whichever directory you're in
cd /path/to/project-a
aliasmate run lint  # Lints project-a

cd /path/to/project-b
aliasmate run lint  # Lints project-b
```

You can change the path mode anytime using `aliasmate edit <name>`.

### Generate LLM Documentation

AliasMate includes a default command that generates comprehensive documentation for AI assistants:

```bash
aliasmate run llm
```

This creates an `llm.txt` file in your current directory containing:
- Complete feature documentation
- All available commands and their usage
- Best practices and examples
- Integration tips for AI assistants

Share this file with AI assistants like ChatGPT or Claude for better help with AliasMate!

### List All Saved Commands

View all your saved commands:

```bash
aliasmate list
# or
aliasmate ls
```

**Output:**
```
Saved commands (3):

  build
    Command: npm run build
    Directory: /path/to/project

  deploy
    Command: ./deploy.sh
    Directory: /path/to/scripts

  test
    Command: pytest tests/
    Directory: /path/to/python-project
```

### Edit a Saved Command

Modify an existing command:

```bash
aliasmate edit <name>
```

Opens an interactive prompt to edit the command and directory.

### Delete a Saved Command

Remove a command you no longer need:

```bash
aliasmate delete <name>
# or
aliasmate rm <name>
```

### Export Commands

Backup your commands to a JSON file:

```bash
aliasmate export commands.json
```

### Import Commands

Restore commands from a JSON file:

```bash
aliasmate import commands.json
```

If there are name conflicts, you'll be prompted to:
- Overwrite existing commands
- Skip imported commands
- Rename imported commands

### View Config Location

See where your commands are stored:

```bash
aliasmate config
```

## Configuration

Commands are stored in:
- **Linux/macOS**: `~/.config/aliasmate/config.json`
- **Windows**: `%USERPROFILE%\.config\aliasmate\config.json`

## Command Reference

| Command | Aliases | Description |
|---------|---------|-------------|
| `aliasmate prev <name>` | - | Save the previous command from shell history |
| `aliasmate run <name> [path]` | - | Run a saved command (optionally in a different directory) |
| `aliasmate save` | - | Interactively save a new command |
| `aliasmate list` | `ls` | List all saved commands |
| `aliasmate edit <name>` | - | Edit a saved command |
| `aliasmate delete <name>` | `rm` | Delete a saved command |
| `aliasmate export <file>` | - | Export commands to a JSON file |
| `aliasmate import <file>` | - | Import commands from a JSON file |
| `aliasmate config` | - | Show config file location |

## Examples

### Common Workflows

**1. Save and reuse a build command:**
```bash
cd /my/project
npm run build -- --production
aliasmate prev build-prod
# Later, from anywhere:
aliasmate run build-prod
```

**2. Save a deployment script:**
```bash
aliasmate save
# Name: deploy
# Command: ./scripts/deploy.sh --env production
# Directory: /path/to/project
```

**3. Run a command in a different directory:**
```bash
aliasmate run test /path/to/different/project
```

**4. Backup your commands:**
```bash
aliasmate export ~/backups/aliasmate-$(date +%Y%m%d).json
```

**5. Share commands with your team:**
```bash
# Person A
aliasmate export team-commands.json

# Person B
aliasmate import team-commands.json
```

## Tips

- Use descriptive names for your commands (e.g., `build-prod`, `test-unit`, `deploy-staging`)
- Regularly export your commands as backup
- The `prev` command is great for saving complex commands you just figured out
- Use path override to run the same command in multiple projects

## Troubleshooting

### "Could not retrieve previous command from history"

This happens when shell history is disabled or the command hasn't been written to the history file yet.

**Common scenario**: You run a command, press `^C` to cancel it, and immediately run `aliasmate prev`, but it captures an older command (like `clear`) instead.

**Why**: Most shells only write to history when the shell exits, not after each command.

**Solution**: Configure real-time history writing (see [Shell Configuration](#shell-configuration-recommended) above):
- **zsh**: Add `setopt INC_APPEND_HISTORY` to `~/.zshrc`
- **bash**: Add `PROMPT_COMMAND="history -a"` to `~/.bashrc`

**Quick fix**: Close and reopen your terminal, then try the command again.

**Alternative**: Use `aliasmate save` to enter commands manually.

### Commands not executing properly

- Verify the saved directory exists: `aliasmate list`
- Check if the command requires environment variables or specific shell configuration
- Try running the command manually in the saved directory first

### History file not found

Make sure your shell history is enabled:
- Check for `~/.zsh_history` (zsh) or `~/.bash_history` (bash)
- If missing, history may be disabled - check your shell configuration files

## Development

To work on AliasMate locally:

```bash
# Clone the repository
git clone https://github.com/aliasmate/aliasmate.git
cd aliasmate

# Install dependencies
npm install

# Build the project
npm run build

# Run type checking
npm run typecheck

# Lint the code
npm run lint

# Format code
npm run format

# Link for local testing
npm link

# Test the CLI
aliasmate --help
```

### Development Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run dev` | Watch mode for development |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Check code quality with ESLint |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check if code is formatted |

### Code Quality

AliasMate is built with modern development practices:

- ✅ **TypeScript** with strict mode enabled
- ✅ **ESLint** for code quality enforcement
- ✅ **Prettier** for consistent formatting
- ✅ **Comprehensive JSDoc** documentation
- ✅ **Centralized error handling** with proper exit codes
- ✅ **Zero type safety warnings** in production code

For detailed contribution guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## Project Structure

```
aliasmate/
├── src/
│   ├── cli.ts              # CLI entry point
│   ├── commands/           # Command implementations
│   │   ├── prev.ts        # Save from history
│   │   ├── run.ts         # Execute commands
│   │   ├── save.ts        # Interactive save
│   │   ├── list.ts        # Display all
│   │   ├── edit.ts        # Modify commands
│   │   ├── delete.ts      # Remove commands
│   │   ├── export.ts      # Backup to JSON
│   │   └── import.ts      # Restore from JSON
│   ├── storage/
│   │   └── index.ts       # Config persistence
│   └── utils/
│       ├── constants.ts   # Shared constants
│       ├── errors.ts      # Error handling
│       ├── executor.ts    # Command execution
│       ├── history.ts     # Shell integration
│       └── paths.ts       # Path utilities
├── dist/                   # Compiled output
└── docs/
    ├── CONTRIBUTING.md    # Contributor guide
    ├── DEV_GUIDE.md      # Quick reference
    └── CLEANUP_SUMMARY.md # Code quality report
```

## License

MIT

## Contributing

Contributions are welcome! We appreciate:

- 🐛 Bug reports and fixes
- ✨ Feature suggestions and implementations
- 📝 Documentation improvements

**Maintainer**: AliasMate Contributors

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and release notes.

## Support

- 📖 [Documentation](./README.md)
- 🐛 [Issue Tracker](https://github.com/aliasmate/aliasmate/issues)
- 💬 [Discussions](https://github.com/aliasmate/aliasmate/discussions)

---

**⭐ If you find AliasMate helpful, please consider giving it a star on GitHub!**
- 🎨 Code quality enhancements

Before contributing, please:

1. Read our [Contributing Guide](./CONTRIBUTING.md)
2. Check existing issues and pull requests
3. Follow the code style (ESLint + Prettier)
4. Add tests for new features (when applicable)
5. Update documentation as needed

### Quick Start for Contributors

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/aliasmate.git
cd aliasmate

# Install dependencies
npm install

# Make your changes, then:
npm run format      # Format code
npm run lint        # Check for issues
npm run typecheck   # Verify types
npm run build       # Build project

# Test locally
npm link
aliasmate --help
```

See [DEV_GUIDE.md](./DEV_GUIDE.md) for detailed development workflows.

## Author

Created with ❤️ for developers who love productivity tools.
