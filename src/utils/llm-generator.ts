import * as fs from 'fs';
import * as path from 'path';
import { APP_NAME, APP_VERSION } from './constants';

/**
 * Generate LLM.txt content with all AliasMate features and documentation
 */
export function generateLLMContent(): string {
  return `# AliasMate - Terminal Command Management CLI

Version: ${APP_VERSION}
Official Tool: ${APP_NAME}

## Overview

AliasMate is a powerful CLI utility that saves, manages, and re-runs shell commands with their working directories. It helps developers save time, reduce errors, and boost productivity by eliminating the need to retype complex commands or remember their exact locations.

## Core Capabilities

### 1. Command Storage
- Save any shell command with a memorable name
- Store the working directory where the command should execute
- Preserve metadata (creation date, last modified)
- Support for complex multi-line commands and scripts

### 2. Command Execution
- Run saved commands from anywhere in the filesystem
- Automatic directory switching to the saved location
- Option to override execution directory (use current or saved path)
- Support for both absolute and relative path overrides
- Environment variable capture and restoration
- Dry-run mode to preview commands before execution
- Recent command tracking with @N syntax (@0 = most recent)
- Alias resolution for keyboard-friendly shortcuts

### 3. Command Management
- List all saved commands with full details
- Search commands by name, command text, or directory
- Edit existing commands interactively
- Delete unwanted commands
- Export/import commands for backup and team sharing
- View changelog and version history
- Create aliases for frequently used commands
- Track recent command executions
- Validate commands before saving
- Multiple output formats (JSON, YAML, table, compact)

## Available Commands

### aliasmate prev <name>
Save the previous command from shell history.
- Automatically captures the last executed command
- Saves current working directory
- Optionally captures environment variables
- Example: \`aliasmate prev build\`

### aliasmate run <name> [path]
Execute a saved command.
- Runs in saved directory by default
- Optional path parameter to override directory
- Supports path mode (saved vs current directory)
- Restores saved environment variables
- Warns about environment variable differences
- Dry-run mode: \`--dry-run\` to preview without executing
- Verbose mode: \`--verbose\` for detailed dry-run output
- @N syntax: \`aliasmate run @0\` to run most recent command
- Alias support: Automatically resolves command aliases
- Examples:
  - \`aliasmate run build\`
  - \`aliasmate run build .\`
  - \`aliasmate run build --dry-run\`
  - \`aliasmate run @0\` (most recent command)
  - \`aliasmate run @1\` (second most recent)

### aliasmate save
Interactively create a new saved command.
- Prompts for command name
- Prompts for command to execute
- Prompts for working directory
- Prompts for path mode preference
- Optionally capture environment variables
- Optional validation: \`--no-validate\` to skip validation
- Example: \`aliasmate save\` or \`aliasmate save --no-validate\`

### aliasmate list (alias: ls)
Display all saved commands.
- Shows command name, actual command, and directory
- Displays path mode for each command
- Color-coded output for readability
- Multiple format options: \`--format <type>\`
  - \`table\` - Default human-readable table
  - \`json\` - Machine-readable JSON
  - \`yaml\` - YAML format
  - \`compact\` - One-line per command
- Examples:
  - \`aliasmate list\`
  - \`aliasmate list --format json\`
  - \`aliasmate list --format yaml\`

### aliasmate search <query> (alias: find)
Search for commands by keyword.
- Searches in command name, command text, and directory path
- Case-insensitive matching
- Example: \`aliasmate search deploy\`

### aliasmate edit <name>
Edit an existing saved command.
- Modify command, directory, or path mode
- Manage environment variables
- Optional validation bypass: \`--no-validate\`
- Examples:
  - \`aliasmate edit build\`
  - \`aliasmate edit build --no-validate\`

### aliasmate delete <name> (alias: rm)
Remove a saved command.
- Permanently deletes the command
- Example: \`aliasmate delete old-build\`

### aliasmate export <file>
Export all commands to a file.
- Backup your commands
- Share with team members
- Includes environment variables (sensitive ones are masked)
- Multiple format options: \`--format <type>\`
  - \`json\` - JSON format (default)
  - \`yaml\` - YAML format
- Examples:
  - \`aliasmate export my-commands.json\`
  - \`aliasmate export my-commands.yaml --format yaml\`

### aliasmate import <file>
Import commands from a JSON file.
- Restore from backup
- Load teammate's commands
- Prompts before overwriting existing commands
- Automatic backup created before import
- Example: \`aliasmate import my-commands.json\`

### aliasmate changelog (alias: changes)
View version changelog and release notes.
- View current version changes
- View specific version changes
- View cumulative changes between versions
- Examples:
  - \`aliasmate changelog\` - Current version
  - \`aliasmate changelog --ver 1.3.0\` - Specific version
  - \`aliasmate changelog --from 1.2.0\` - All changes since 1.2.0

### aliasmate config
Show configuration details.
- Display config directory and file path
- Show number of saved commands
- Example: \`aliasmate config\`

### aliasmate alias <shortname> <commandname>
Create or update command aliases.
- Create keyboard-friendly shortcuts
- Validates against reserved command names
- Automatic target command validation
- Examples:
  - \`aliasmate alias b build\` - Create alias
  - \`aliasmate alias --list\` - List all aliases
  - \`aliasmate alias --remove b\` - Remove alias

### aliasmate recent
View and manage recently executed commands.
- Shows command execution history with timestamps
- Displays execution count for each command
- Time-ago formatting (e.g., "2 minutes ago")
- Limit results: \`--limit <N>\`
- Clear history: \`--clear\`
- Examples:
  - \`aliasmate recent\` - Show recent commands
  - \`aliasmate recent --limit 10\` - Show last 10
  - \`aliasmate recent --clear\` - Clear history

### aliasmate validate <name>
Validate commands and their context.
- Checks command existence in PATH
- Verifies directory exists and is accessible
- Validates shell syntax (quotes, brackets, pipes)
- Validates environment variable patterns
- Batch validation: \`--all\` flag
- Examples:
  - \`aliasmate validate build\` - Validate one command
  - \`aliasmate validate --all\` - Validate all commands

### aliasmate completion <shell>
Generate shell completion scripts.
- Supports bash, zsh, and fish shells
- Dynamic completion for command names
- Completes flags and options
- File path completion for import/export
- Examples:
  - \`aliasmate completion bash\` - Generate bash completion
  - \`aliasmate completion zsh\` - Generate zsh completion
  - \`aliasmate completion fish\` - Generate fish completion

Installation:
- Bash: \`source <(aliasmate completion bash)\`
- Zsh: \`source <(aliasmate completion zsh)\`
- Fish: \`aliasmate completion fish > ~/.config/fish/completions/aliasmate.fish\`

### aliasmate llm
Generate this llm.txt file (default command).
- Creates comprehensive documentation
- CEnvironment Variables Feature

AliasMate can capture and restore environment variables along with your commands:

### Automatic Capture
- When saving commands with \`prev\` or \`save\`, optionally capture environment variables
- Only user-defined variables are captured (system variables excluded)
- Sensitive variables (API keys, tokens, passwords) are automatically detected

### Security Features
- Sensitive variables are masked in exports (e.g., \`API_KEY=abc***xy\`)
- System variables (PATH, HOME, etc.) are filtered out
- Onenv\`: Optional object containing environment variables
- \`createdAt\`: ISO 8601 timestamp
- \`updatedAt\`: ISO 8601 timestamp

## Version History and Changelog

AliasMate maintains a comprehensive changelog accessible via CLI:

### Viewing Changes
- \`aliasmate changelog\` - View current version changes
- \`aliasmate changelog --ver 1.3.0\` - View specific version
- \`aliasmate changelog --from 1.2.0 --to 1.4.0\` - Cumulative changes
- \`aliasmate changelog --from 1.2.0\` - All changes since a version

### Upgrade Notifications
- Automatic upgrade detection on first run after update
- Shows cumulative changes since your last version
- Highlights key new features and improvements
- Links to full changelog documentation

### Version Information
- Current version: \`aliasmate --version\`
- Semantic versioning (major.minor.patch)
- Regular updates with new features and bug fixesa is detected

### Environment Restoration
- Saved environment variables are restored when running commands
- Variables are merged with current environment
- Current environment takes precedence over saved values
- Warnings shown if variables differ from saved values

### Managing Environment Variables
- Edit command to update environment variables
- Select specific variables to keep or remove
- Clear all environment variables from a command
- View environment variables in command listings

### Use Cases
- Development with specific environment variables (\`NODE_ENV\`, \`DEBUG\`)
- API testing with tokens and endpoints
- Multi-environment deployments (dev, staging, prod)
- Consistent tool configurations across team members

## an be shared with AI assistants
- Example: \`aliasmate run llm\`

## Path Mode Feature

Each saved command can have a path mode that determines where it executes:

### Saved Directory Mode (default)
- Command always runs in the directory where it was saved
- Useful for project-specific commands
- Example: Build scripts that must run in the project root

### Current Directory Mode
- Command runs in your current working directory
- Useful for general-purpose utilities
- Example: Git commands that work in any repository

You can choose the path mode when saving or editing a command.

## Command Aliases Feature

Create short aliases for frequently used commands to speed up your workflow:

### Creating Aliases
- \`aliasmate alias <short> <command>\` - Create an alias
- Example: \`aliasmate alias b build\` creates shortcut "b" for "build"

### Using Aliases
- Run aliased commands: \`aliasmate run b\` (runs the "build" command)
- Aliases are resolved automatically before execution
- Shows both alias and original command name when running

### Managing Aliases
- List all: \`aliasmate alias --list\`
- Remove: \`aliasmate alias --remove <alias>\`
- Update: Create alias with same name (overwrites with warning)

### Validation
- Prevents conflicts with reserved names (save, run, list, etc.)
- Only alphanumeric, dash, and underscore allowed
- Verifies target command exists

## Recent Commands Feature

Track command execution history and quickly re-run recent commands:

### Viewing Recent Commands
- \`aliasmate recent\` - Show recent executions
- \`--limit <N>\` - Limit results (e.g., \`aliasmate recent --limit 10\`)
- Shows: command name, last run time, execution count
- Time-ago formatting: "2 minutes ago", "3 hours ago", etc.

### Quick Re-execution with @N Syntax
- \`@0\` - Most recent command
- \`@1\` - Second most recent
- \`@2\` - Third most recent
- Example: \`aliasmate run @0\` (re-run last command)

### Execution Tracking
- Automatic tracking on every command execution
- Records both successful and failed executions
- Configurable history size (default: 50 entries)
- NOT recorded in dry-run mode

### Managing History
- Clear history: \`aliasmate recent --clear\`
- Deduplicated display (unique commands only)
- Stored in metadata.json separately from commands

## Dry-Run Mode Feature

Preview commands before execution to verify what will run:

### Basic Dry-Run
\`\`\`bash
aliasmate run build --dry-run
\`\`\`

Displays:
- Full command to be executed
- Working directory
- Path mode (saved/current/overridden)
- Environment variable count

### Verbose Dry-Run
\`\`\`bash
aliasmate run build --dry-run --verbose
\`\`\`

Shows detailed information:
- All environment variables (with values)
- Sensitive variables are masked (e.g., API_KEY=abc***xyz)
- Complete execution context

### Safety Features
- Dangerous command detection (rm -rf, dd, mkfs, format, etc.)
- Color-coded warnings (red for dangers, yellow for cautions)
- No side effects (execution history not recorded)
- Perfect for verifying destructive or long-running commands

## Command Validation Feature

Validate commands when saving to catch errors early:

### Automatic Validation
- Enabled by default when using \`save\` or \`edit\` commands
- Can be bypassed with \`--no-validate\` flag

### What Gets Validated

**Command Existence:**
- Checks if command exists in system PATH
- Recognizes shell builtins (cd, echo, export, etc.)
- Validates executable file paths

**Directory Validation:**
- Verifies directory exists
- Checks read/execute permissions
- Warns if directory not writable

**Shell Syntax:**
- Unmatched quotes (single, double, backtick)
- Unmatched brackets, braces, parentheses
- Invalid pipe usage
- Invalid operators

**Environment Variables:**
- Valid variable name patterns
- Undefined variable warnings
- Special character detection

### Validation Reports
- **Errors** (red) - Block execution:
  - Command not found
  - Directory doesn't exist
  - Invalid syntax
  
- **Warnings** (yellow) - Allow with notice:
  - Undefined environment variables
  - Shell operators detected
  - Non-executable paths

### Manual Validation
\`\`\`bash
# Validate single command
aliasmate validate build

# Batch validate all commands
aliasmate validate --all
\`\`\`

Shows summary:
- ✓ Commands passed validation
- ⚠ Commands with warnings
- ✗ Commands with errors
- Detailed issue listing

## Output Formatting Feature

Export and display commands in multiple formats for different use cases:

### Available Formats

**Table (default)** - Human-readable display
\`\`\`bash
aliasmate list --format table
\`\`\`
Perfect for terminal viewing, color-coded output

**JSON** - Machine-readable, CI/CD integration
\`\`\`bash
aliasmate list --format json
aliasmate export commands.json --format json
\`\`\`
Ideal for scripting, automation, parsing

**YAML** - Human and machine-readable
\`\`\`bash
aliasmate list --format yaml
aliasmate export commands.yaml --format yaml
\`\`\`
Great for configuration management

**Compact** - One-line per command
\`\`\`bash
aliasmate list --format compact
\`\`\`
Quick scanning, minimal output

### What's Included
All formats include:
- Command name and string
- Directory path
- Path mode (saved/current)
- Environment variables
- Timestamps (createdAt, updatedAt)

### Use Cases
- **JSON/YAML**: CI/CD pipelines, automation scripts
- **Table**: Daily development workflow
- **Compact**: Quick reference, scripts with limited space
- **Export**: Team sharing (sensitive values masked)

## Shell Completion Feature

Auto-completion support for enhanced productivity:

### Supported Shells
- **Bash** - Most Linux distributions
- **Zsh** - macOS default, modern Linux
- **Fish** - Modern shell with enhanced features

### What Gets Completed
- Main commands (run, list, save, edit, etc.)
- Your saved command names (dynamic)
- Command flags (--dry-run, --verbose, --format, etc.)
- Format options (json, yaml, table, compact)
- File paths (for import/export)

### Installation

**Bash:**
\`\`\`bash
# Add to ~/.bashrc
source <(aliasmate completion bash)
# Then reload: source ~/.bashrc
\`\`\`

**Zsh:**
\`\`\`bash
# Add to ~/.zshrc
source <(aliasmate completion zsh)
# Then reload: source ~/.zshrc
\`\`\`

**Fish:**
\`\`\`bash
aliasmate completion fish > ~/.config/fish/completions/aliasmate.fish
# Fish auto-loads on next shell start
\`\`\`

### Usage Examples
- \`aliasmate ru<TAB>\` → completes to "run"
- \`aliasmate run bu<TAB>\` → completes to your "build" command
- \`aliasmate list --fo<TAB>\` → completes to "--format"
- \`aliasmate list --format <TAB>\` → shows json, yaml, table, compact

## Configuration

### Storage Location
- Config file: \`~/.config/aliasmate/config.json\`
- Metadata file: \`~/.config/aliasmate/metadata.json\`
- Config contains all saved commands
- Metadata contains aliases, execution history, and app state
- JSON format for easy editing if needed

### Command Alias Structure
Each command contains:
- \`command\`: The shell command to execute
- \`directory\`: The saved working directory path
- \`pathMode\`: Either "saved" or "current"
- \`env\`: Optional object containing environment variables
- \`createdAt\`: ISO 8601 timestamp
- \`updatedAt\`: ISO 8601 timestamp

### Metadata Structure
Contains:
- \`command_aliases\`: Map of alias shortcuts to command names
- \`execution_history\`: Array of recent command executions
- \`recent_config\`: Configuration for recent commands (maxSize, etc.)
- \`onboarding\`: Onboarding state and version tracking

## Use Cases

### Development Workflows
- Save complex build commands: \`aliasmate prev build-prod\`
- Run test suites: \`aliasmate prev test-integration\`
- # Environment Variable Issues
- Check if saved variables are still valid
- Verify environment variable names and values
- Use \`aliasmate edit <name>\` to update env vars
- Clear environment variables if no longer needed

### Version or Changelog Not Showing
- Ensure you have the latest version installed
- Run \`aliasmate changelog\` to view version history
- Check internet connection for upgrade notifications

##Deploy applications: \`aliasmate prev deploy-staging\`

### Multi-Project Management
- Switch between projects easily
- Run project-specific commands without navigating
- Maintain consistent workflows across projects

### Team Collaboration
- Export team workflows: \`aliasmate export team-commands.json\`
- Share best practices and scripts
- Onboard new team members quickly

### DevOps and Automation
- Save deployment scripts with correct paths
- Manage multiple environment configurations
- Quick access to frequently used operations

## Best Practices

1. **Descriptive Names**: Use clear, memorable names for commands
   - Good: \`deploy-prod\`, \`test-unit\`, \`start-server\`
   - Avoid: \`cmd1\`, \`x\`, \`temp\`

2. **Use Aliases for Frequently Used Commands**
   - Create short aliases: \`aliasmate alias b build\`
   - Keyboard-friendly shortcuts speed up workflow
   - Use for commands you run multiple times daily

3. **Path Mode Selection**: Choose the right mode for each command
   - Use "saved" for project-specific commands
   - Use "current" for general utilities

4. **Preview with Dry-Run**: Verify before executing
   - Use \`--dry-run\` for destructive commands
   - Check environment variables with \`--verbose\`
   - Catch errors before they happen

5. **Validate Commands**: Let validation catch errors early
   - Default validation when saving prevents issues
   - Use \`--no-validate\` only when necessary
   - Run \`aliasmate validate --all\` periodically

6. **Regular Backups**: Export commands periodically
   - \`aliasmate export ~/backups/aliases-$(date +%Y%m%d).json\`
   - Use version control for team command exports

7. **Team Sharing**: Maintain a shared command repository
   - Export with masked sensitive values
   - Document complex commands
   - Use consistent naming conventions

8. **Command Organization**: Use prefixes for grouping
   - \`test-unit\`, \`test-integration\`, \`test-e2e\`
   - \`deploy-dev\`, \`deploy-staging\`, \`deploy-prod\`

9. **Environment Variables**: Capture when needed
   - Use for commands that need specific env vars
   - Review sensitive variables before saving
   - Keep environment variables updated with \`edit\` command

10. **Use Recent Commands**: Quick access to command history
    - \`aliasmate run @0\` for most recent
    - Review history with \`aliasmate recent\`
    - Clear old history periodically

11. **Stay Updated**: Check changelog regularly
    - Run \`aliasmate changelog\` to see new features
    - Update to latest version for bug fixes and improvements

## Integration with AI Assistants

This llm.txt file is designed to help AI assistants understand AliasMate's full capabilities. When asking an AI for help with AliasMate:

1. Share this file for complete context
2. Mention specific commands you're working with
3. Describe your workflow or use case
4. Ask for command suggestions or optimizations

## Troubleshooting

### Command Not Found
- Run \`aliasmate list\` to see available commands
- Check if it's an alias: \`aliasmate alias --list\`
- Check spelling of command name
- Verify command was saved successfully

### Alias Not Working
- Verify alias exists: \`aliasmate alias --list\`
- Check if target command exists
- Ensure alias name doesn't conflict with reserved names
- Try running the target command directly first

### Recent Commands Not Showing
- Check execution history: \`aliasmate recent\`
- Verify commands were run (not in dry-run mode)
- History might be full (default: 50 entries)
- Clear old history: \`aliasmate recent --clear\`

### Validation Errors
- Read the specific error message carefully
- Check if command exists in PATH: \`which <command>\`
- Verify directory exists and is accessible
- Review shell syntax for quotes, brackets, pipes
- Use \`--no-validate\` to bypass if error is false positive

### Directory Not Found
- Ensure the saved directory still exists
- Use path override to run in different location
- Edit command to update directory: \`aliasmate edit <name>\`
- Check directory permissions

### Command Execution Fails
- Preview first: \`aliasmate run <name> --dry-run\`
- Verify command syntax is correct
- Check if required tools/dependencies are installed
- Ensure directory permissions are correct
- Review environment variables: use \`--dry-run --verbose\`

### Completion Not Working
- Verify completion script is sourced correctly
- Check shell type: \`echo $SHELL\`
- Reload shell config: \`source ~/.bashrc\` or \`source ~/.zshrc\`
- For fish, ensure file is in \`~/.config/fish/completions/\`

### Dry-Run Shows Incorrect Information
- Verify saved command: \`aliasmate list\`
- Check if command was updated recently
- Review environment variables: use \`--verbose\` flag
- Edit command if needed: \`aliasmate edit <name>\`

### Environment Variable Issues
- Check if saved variables are still valid
- Verify environment variable names and values
- Use \`aliasmate edit <name>\` to update env vars
- Clear environment variables if no longer needed
- Preview with dry-run: \`aliasmate run <name> --dry-run --verbose\`

### Export/Import Format Issues
- Verify format flag: \`--format json\` or \`--format yaml\`
- Check file extension matches format
- Validate JSON/YAML syntax if manually edited
- Use \`--format json\` for most compatible exports

## Technical Details

- Written in TypeScript
- Cross-platform (Linux, macOS, Windows)
- Node.js 14.0.0 or higher required
- Dependencies: chalk, commander, execa, inquirer

## Getting Help

- View all commands: \`aliasmate --help\`
- View command help: \`aliasmate <command> --help\`
- GitHub Issues: Report bugs or request features
- Version info: \`aliasmate --version\`

## Example Workflows

### Frontend Development
\`\`\`bash
# Save development server
npm run dev
aliasmate prev dev

# Save production build
npm run build
### Environment-Specific Commands
\`\`\`bash
# Development environment
NODE_ENV=development npm start
aliasmate prev dev-server
# Captures NODE_ENV automatically

# Staging deployment
API_URL=https://staging.api.com npm run deploy
aliasmate prev deploy-staging
# Captures API_URL automatically

# Check what's new
aliasmate changelog --from 1.2.0
\`\`\`

aliasmate prev build

# Save test suite
npm test
aliasmate prev test

# Run from anywhere
aliasmate run dev
aliasmate run build
aliasmate run test
\`\`\`

### Backend API
\`\`\`bash
# Save API server
npm start
aliasmate prev api

# Save database migrations
npm run migrate
aliasmate prev migrate

# Save seed data
npm run seed
aliasmate prev seed
\`\`\`

### DevOps
\`\`\`bash
# Save deployment scripts
./scripts/deploy.sh production
aliasmate prev deploy-prod

# Preview before deploying (dry-run)
aliasmate run deploy-prod --dry-run --verbose

# Save log viewing
tail -f /var/log/app.log
aliasmate prev logs

# Save health checks
curl http://localhost:3000/health
aliasmate prev health-check
\`\`\`

### Using Aliases for Speed
\`\`\`bash
# Create aliases for frequently used commands
aliasmate alias b build
aliasmate alias t test
aliasmate alias d deploy-prod
aliasmate alias ds deploy-staging

# Use aliases for quick execution
aliasmate run b    # Runs build
aliasmate run t    # Runs test
aliasmate run d    # Runs deploy-prod

# List all aliases
aliasmate alias --list
\`\`\`

### Recent Commands Workflow
\`\`\`bash
# Run several commands
aliasmate run build
aliasmate run test
aliasmate run deploy-staging

# View recent commands
aliasmate recent

# Quickly re-run the last command
aliasmate run @0

# Re-run the build (if it was 2nd most recent)
aliasmate run @1
\`\`\`

### Validation and Safety
\`\`\`bash
# Validate a command before saving
aliasmate save
# (validation runs automatically)

# Save without validation (advanced)
aliasmate save --no-validate

# Validate existing command
aliasmate validate deploy-prod

# Validate all commands
aliasmate validate --all

# Preview with dry-run before execution
aliasmate run deploy-prod --dry-run --verbose
\`\`\`

### Export and Sharing
\`\`\`bash
# Export in different formats
aliasmate export team-commands.json --format json
aliasmate export team-commands.yaml --format yaml

# View commands in different formats
aliasmate list --format json
aliasmate list --format compact
aliasmate list --format yaml

# Share with team (sensitive values are masked)
git add team-commands.yaml
git commit -m "Update team commands"
git push
\`\`\`

---

Generated by AliasMate v${APP_VERSION}
For more information, visit: https://github.com/aliasmate/aliasmate
`;
}

/**
 * Create llm.txt file in the specified directory
 * @param targetDir - The directory where llm.txt should be created
 * @returns The full path to the created file
 */
export function createLLMFile(targetDir: string): string {
  const content = generateLLMContent();
  const filePath = path.join(targetDir, 'llm.txt');

  fs.writeFileSync(filePath, content, 'utf8');

  return filePath;
}

/**
 * Get the default LLM command configuration
 * This command will be auto-created during onboarding
 */
export function getDefaultLLMCommand(): {
  name: string;
  command: string;
  directory: string;
  pathMode: 'current';
} {
  return {
    name: 'llm',
    command: `cat > llm.txt << 'ALIASMATE_LLM_EOF'\n${generateLLMContent()}\nALIASMATE_LLM_EOF\necho "✓ Created llm.txt in $(pwd)"`,
    directory: process.cwd(),
    pathMode: 'current', // Run in current directory so users can create llm.txt anywhere
  };
}
