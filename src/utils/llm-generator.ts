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

### 3. Command Management
- List all saved commands with full details
- Search commands by name, command text, or directory
- Edit existing commands interactively
- Delete unwanted commands
- Export/import commands for backup and team sharing

## Available Commands

### aliasmate prev <name>
Save the previous command from shell history.
- Automatically captures the last executed command
- Saves current working directory
- Example: \`aliasmate prev build\`

### aliasmate run <name> [path]
Execute a saved command.
- Runs in saved directory by default
- Optional path parameter to override directory
- Supports path mode (saved vs current directory)
- Example: \`aliasmate run build\` or \`aliasmate run build .\`

### aliasmate save
Interactively create a new saved command.
- Prompts for command name
- Prompts for command to execute
- Prompts for working directory
- Prompts for path mode preference
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

### aliasmate edit <name>
Modify an existing command.
- Interactive prompts with current values
- Update command text, directory, or path mode
- Example: \`aliasmate edit build\`

### aliasmate delete <name> (alias: rm)
Remove a saved command.
- Permanently deletes the command
- Example: \`aliasmate delete old-build\`

### aliasmate export <file>
Export all commands to a JSON file.
- Backup your commands
- Share with team members
- Example: \`aliasmate export my-commands.json\`

### aliasmate import <file>
Import commands from a JSON file.
- Restore from backup
- Load teammate's commands
- Prompts before overwriting existing commands
- Example: \`aliasmate import my-commands.json\`

### aliasmate llm
Generate this llm.txt file (default command).
- Creates comprehensive documentation
- Can be shared with AI assistants
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
- Deploy applications: \`aliasmate prev deploy-staging\`

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
   - \`aliasmate export ~/backups/aliases-\$(date +%Y%m%d).json\`

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
export function getDefaultLLMCommand(): { name: string; command: string; directory: string; pathMode: 'current' } {
  return {
    name: 'llm',
    command: `cat > llm.txt << 'ALIASMATE_LLM_EOF'\n${generateLLMContent()}\nALIASMATE_LLM_EOF\necho "✓ Created llm.txt in $(pwd)"`,
    directory: process.cwd(),
    pathMode: 'current', // Run in current directory so users can create llm.txt anywhere
  };
}
