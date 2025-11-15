# AliasMate

A powerful CLI utility to save, manage, and re-run shell commands with their working directories. Never lose track of useful commands again!

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
- ⚡ **Quick execution** of saved commands with optional path override
- 📝 **Interactive save** with prompts for command and path
- 📋 **List all saved commands** with their details
- ✏️ **Edit commands** interactively
- 🗑️ **Delete unwanted commands**
- 📤 **Export/Import** commands for backup or sharing
- 🎨 **Beautiful colored output** for better readability
- 🔄 **Cross-platform** support (Linux, macOS, Windows)

## Installation

Install globally via npm:

```bash
npm i -g aliasmate
```

## Getting Started

1. **Install AliasMate** using the command above.
2. **Save a command**: After running any useful command in your terminal, save it with `aliasmate prev <name>`. For example:
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

This happens when shell history is disabled or cannot be accessed. Make sure:
- Your shell history is enabled
- You have a history file (`~/.zsh_history` for zsh, `~/.bash_history` for bash)

### Commands not executing properly

- Verify the saved directory exists: `aliasmate list`
- Check if the command requires environment variables or specific shell configuration
- Try running the command manually in the saved directory first

## Development

To work on AliasMate locally:

```bash
# Clone the repository
git clone https://github.com/aliasmate/aliasmate.git
cd aliasmate

# Install dependencies
npm install

# Link for local development
npm link

# Test the CLI
aliasmate --help
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

Created with ❤️ for developers who love productivity tools.
