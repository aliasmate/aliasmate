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

### 3. Command Management
- List all saved commands with full details
- Search commands by name, command text, or directory
- Edit existing commands interactively
- Delete unwanted commands
- Export/import commands for backup and team sharing
- View changelog and version history

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
- Example: \`aliasmate run build\` or \`aliasmate run build .\`

### aliasmate save
Interactively create a new saved command.
- Prompts for command name
- Prompts for command to execute
- Prompts for working directory
- Prompts for path mode preference
- Optionally capture environment variables
- Example: \`aliasmate save\`

### aliasmate list (alias: ls)
Display all saved commands.
- Shows command name, actual command, and directory
- Displays path mode for each command
- Color-coded output for readability
- Example: \`aliasmate list\`

### aliasmate search <query> (alias: find)
Search for commands by keyword.
- Searches in command name, command text, and directory path
- Case-insensitive matching
- Example: \`aliasmate search deploy\`

##Manage environment variables
- Example: \`aliasmate edit build\`

### aliasmate delete <name> (alias: rm)
Remove a saved command.
- Permanently deletes the command
- Example: \`aliasmate delete old-build\`

### aliasmate export <file>
Export all commands to a JSON file.
- Backup your commands
- Share with team members
- Includes environment variables (sensitive ones are masked)
- Example: \`aliasmate export my-commands.json\`

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
- Example: \`aliasmate config
- Restore from backup
- Load teammate's commands
- Prompts before overwriting existing commands
- Example: \`aliasmate import my-commands.json\`

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

## Configuration

### Storage Location
6. **Environment Variables**: Capture when needed
   - Use for commands that need specific env vars
   - Review sensitive variables before saving
   - Keep environment variables updated with \`edit\` command

7. **Stay Updated**: Check changelog regularly
   - Run \`aliasmate changelog\` to see new features
   - Update to latest version for bug fixes and improvements

- Config file: \`~/.config/aliasmate/config.json\`
- Contains all saved commands and their metadata
- JSON format for easy editing if needed

### Command Alias Structure
Each command contains:
- \`command\`: The shell command to execute
- \`directory\`: The saved working directory path
- \`pathMode\`: Either "saved" or "current"
- \`createdAt\`: ISO 8601 timestamp
- \`updatedAt\`: ISO 8601 timestamp

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

2. **Path Mode Selection**: Choose the right mode for each command
   - Use "saved" for project-specific commands
   - Use "current" for general utilities

3. **Regular Backups**: Export commands periodically
   - \`aliasmate export ~/backups/aliases-$(date +%Y%m%d).json\`

4. **Team Sharing**: Maintain a shared command repository
   - Version control your command exports
   - Document complex commands

5. **Command Organization**: Use prefixes for grouping
   - \`test-unit\`, \`test-integration\`, \`test-e2e\`
   - \`deploy-dev\`, \`deploy-staging\`, \`deploy-prod\`

## Integration with AI Assistants

This llm.txt file is designed to help AI assistants understand AliasMate's full capabilities. When asking an AI for help with AliasMate:

1. Share this file for complete context
2. Mention specific commands you're working with
3. Describe your workflow or use case
4. Ask for command suggestions or optimizations

## Troubleshooting

### Command Not Found
- Run \`aliasmate list\` to see available commands
- Check spelling of command name
- Verify command was saved successfully

### Directory Not Found
- Ensure the saved directory still exists
- Use path override to run in different location
- Edit command to update directory: \`aliasmate edit <name>\`

### Command Execution Fails
- Verify command syntax is correct
- Check if required tools/dependencies are installed
- Ensure directory permissions are correct

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

# Save log viewing
tail -f /var/log/app.log
aliasmate prev logs

# Save health checks
curl http://localhost:3000/health
aliasmate prev health-check
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
