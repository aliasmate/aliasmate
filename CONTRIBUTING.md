# Contributing to AliasMate

Thank you for your interest in contributing to AliasMate! This document provides guidelines and information for contributors.

## Development Setup

### Prerequisites

- Node.js >= 14.0.0
- npm or yarn

### Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/aliasmate/aliasmate.git
   cd aliasmate
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run type checking**
   ```bash
   npm run typecheck
   ```

5. **Run linting**
   ```bash
   npm run lint
   ```

## Project Structure

```
aliasmate/
├── src/
│   ├── cli.ts              # CLI entry point and command registration
│   ├── commands/           # Individual command implementations
│   │   ├── prev.ts        # Save previous command from history
│   │   ├── run.ts         # Execute saved commands
│   │   ├── save.ts        # Interactive command save
│   │   ├── list.ts        # Display all commands
│   │   ├── edit.ts        # Edit existing commands
│   │   ├── delete.ts      # Delete commands
│   │   ├── export.ts      # Export commands to JSON
│   │   └── import.ts      # Import commands from JSON
│   ├── storage/
│   │   └── index.ts       # Configuration storage and persistence
│   └── utils/
│       ├── constants.ts   # Shared constants and messages
│       ├── errors.ts      # Error handling utilities
│       ├── executor.ts    # Command execution logic
│       ├── history.ts     # Shell history integration
│       └── paths.ts       # Path resolution utilities
├── dist/                   # Compiled JavaScript output
├── .eslintrc.json         # ESLint configuration
├── .prettierrc.json       # Prettier configuration
└── tsconfig.json          # TypeScript configuration
```

## Development Workflow

### Making Changes

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style
   - Add JSDoc comments to all public functions
   - Update types in `src/storage/index.ts` if changing data model

3. **Format your code**
   ```bash
   npm run format
   ```

4. **Check for linting errors**
   ```bash
   npm run lint
   npm run lint:fix  # Auto-fix issues
   ```

5. **Type check**
   ```bash
   npm run typecheck
   ```

6. **Build and test**
   ```bash
   npm run build
   # Test the CLI locally
   node dist/cli.js --help
   ```

### Code Style Guidelines

- **TypeScript**: Use TypeScript for all source files
- **Naming**:
  - Use camelCase for variables and functions
  - Use PascalCase for types and interfaces
  - Use UPPER_SNAKE_CASE for constants
- **Documentation**:
  - Add JSDoc comments to all exported functions
  - Include @param and @returns tags
  - Provide usage examples when helpful
- **Error Handling**:
  - Use the error utilities from `src/utils/errors.ts`
  - Provide helpful error messages
  - Always exit with appropriate exit codes
- **Imports**:
  - Group imports: Node built-ins, external dependencies, internal modules
  - Use named imports when possible

### Testing

Currently, the project uses manual testing. When adding features:

1. Test all new functionality manually
2. Test edge cases (empty inputs, invalid paths, etc.)
3. Test cross-platform if possible (Windows, macOS, Linux)
4. Test with different shells (bash, zsh, fish, PowerShell)

## Adding New Commands

To add a new command:

1. **Create the command file**
   ```typescript
   // src/commands/yourcommand.ts
   import chalk from 'chalk';
   import { handleError } from '../utils/errors';
   
   /**
    * Brief description of what the command does
    * 
    * @param param - Description of parameter
    * 
    * @example
    * ```
    * // Usage example
    * yourCommand('example');
    * ```
    */
   export function yourCommand(param: string): void {
     try {
       // Implementation
       console.log(chalk.green('Success!'));
     } catch (error) {
       handleError(error, 'Failed to execute command');
     }
   }
   ```

2. **Register in CLI**
   ```typescript
   // src/cli.ts
   import { yourCommand } from './commands/yourcommand';
   
   program
     .command('yourcommand <param>')
     .description('Brief description')
     .action((param: string) => {
       yourCommand(param);
     });
   ```

3. **Update documentation**
   - Add command to README.md
   - Update CHANGELOG.md

## Common Tasks

### Adding a new utility function

1. Add to appropriate file in `src/utils/` or create new file
2. Add comprehensive JSDoc
3. Export the function
4. Update types if needed

### Modifying data model

1. Update `CommandAlias` interface in `src/storage/index.ts`
2. Implement migration logic if breaking change
3. Update all affected commands
4. Test import/export compatibility

### Adding error messages

1. Add to `ERROR_MESSAGES` or `HELP_MESSAGES` in `src/utils/constants.ts`
2. Use in commands: `ERROR_MESSAGES.yourMessage(param)`

## Submitting Changes

1. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: Add new feature"
   ```
   
   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `style:` Code style changes (formatting, etc.)
   - `refactor:` Code refactoring
   - `test:` Adding tests
   - `chore:` Maintenance tasks

2. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request**
   - Provide a clear description of changes
   - Reference any related issues
   - Ensure all checks pass

## Release Process

(For maintainers)

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Update version in `src/utils/constants.ts`
4. Commit: `chore: Release v1.x.x`
5. Create git tag: `git tag v1.x.x`
6. Push: `git push && git push --tags`
7. Publish: `npm publish`

## Need Help?

- Check existing issues on GitHub
- Review the README.md for usage examples
- Look at similar commands for implementation patterns

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help newcomers
- Focus on what is best for the community

Thank you for contributing to AliasMate! 🚀
