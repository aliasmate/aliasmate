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
│   │   ├── import.ts      # Import commands from JSON
│   │   ├── search.ts      # Search commands
│   │   └── changelog.ts   # View changelog
│   ├── storage/
│   │   └── index.ts       # Configuration storage and persistence
│   └── utils/
│       ├── constants.ts   # Shared constants and messages
│       ├── errors.ts      # Error handling utilities
│       ├── executor.ts    # Command execution logic
│       ├── history.ts     # Shell history integration
│       ├── paths.ts       # Path resolution utilities
│       ├── env.ts         # Environment variable utilities
│       ├── changelog.ts   # Changelog parsing and display
│       ├── onboarding.ts  # User onboarding system
│       └── llm-generator.ts # LLM documentation generator
├── scripts/
│   └── release.ts         # Automated release script
├── tests/                  # Test files
├── dist/                   # Compiled JavaScript output
├── whats-new.json         # Structured changelog data
├── CHANGELOG.md           # Human-readable changelog
├── RELEASE.md             # Release process documentation
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

## Version Management and Releases

### Automated Release Process

AliasMate uses an automated release script that ensures all version numbers are synchronized and changelog is properly maintained.

**DO NOT manually update version numbers.** Instead, use the release script:

```bash
npm run release
```

The script will:
1. ✅ Prompt for new version number (semantic versioning)
2. ✅ Collect changelog information by category
3. ✅ Update `package.json`
4. ✅ Update `package-lock.json`
5. ✅ Update `src/utils/constants.ts` (APP_VERSION)
6. ✅ Update `CHANGELOG.md` (human-readable)
7. ✅ Update `whats-new.json` (machine-readable for CLI)
8. ✅ Create git commit with all changes
9. ✅ Create git tag (optional)

### Files Automatically Updated

**Never manually edit these for version updates:**
   - **Note**: Do NOT include version updates in your PR
     - Version updates are handled by maintainers during release
     - Focus on your feature/fix implementation
 only - contributors skip this section)

### Quick Release

```bash
npm run release
```

Follow the interactive prompts. The script handles everything automatically.

### Manual Steps (If Needed)

Only use these if the automated script fails:

1. Update version: `npm version <major|minor|patch>`
2. Run release script to update changelog: `npm run release`
3. Review changes: `git diff`
4. Commit if needed: `git commit -am "chore: Release vX.X.X"`
5. Tag: `git tag -a vX.X.X -m "Release vX.X.X"`
6. Push: `git push && git push --tags`
7. Publish: `npm publish`

### What Gets Published

The npm package includes:
- `dist/` - Compiled JavaScript
- `README.md` - User documentation
- `LICENSE` - MIT license
- `CHANGELOG.md` - Version history
- `whats-new.json` - Structured changelog data

## Testing

Currently, the project uses automated testing with Jest:

```bash
# Run all tests
npm test

# Run specific test file
npm test tests/changelog.test.ts

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

When adding features:

1. **Write unit tests** for new utilities and functions
2. **Test edge cases**: empty inputs, invalid paths, etc.
3. **Test error handling**: verify error messages and exit codes
4. **Mock external dependencies**: file system, shell commands, etc.
5. **Follow existing patterns**: see `tests/` directory for examples

Example test structure:
```typescript
import { describe, it, expect } from '@jest/globals';
import { yourFunction } from '../src/utils/your-module';

describe('yourFunction', () => {
  it('should handle valid input', () => {
    const result = yourFunction('valid');
    expect(result).toBe('expected');
  });

  it('should handle invalid input', () => {
    expect(() => yourFunction('')).toThrow();
  });
});
``ues** - Don't use real API keys in tests
3. **Use the masking utilities** from `src/utils/env.ts`:
   - `isSensitiveEnvVar()` - Detects sensitive variable names
   - `maskSensitiveEnvVars()` - Masks sensitive values for display
   - `categorizeEnvVars()` - Separates sensitive from safe variables

### Testing Environment Variables

```typescript
// Good - test with dummy values
const testEnv = {
  API_KEY: 'test-key-12345',
  NODE_ENV: 'test'
};

// Bad - don't use real credentials
const testEnv = {
  API_KEY: process.env.REAL_API_KEY,  // ❌ Never do this
};
```

### Adding Environment Variable Features

1. Use utilities from `src/utils/env.ts`
2. Always filter system variables
3. Always detect and mask sensitive variables
4. Provide clear warnings to users about sensitive data
5. Test with various environment setups

## Changelog and Versioning

### For Contributors

- **DO NOT** manually update version numbers or CHANGELOG.md
- **DO** mention your changes in the PR description
- Maintainers will use your PR description when creating the release

### For Maintainers

See the **Version Management and Releases** section above for the automated release process.

### Viewing Changes

Users can view changelog via CLI:
```bash
aliasmate changelog              # Current version
aliasmate changelog --ver 1.3.0  # Specific version
aliasmate changelog --from 1.2.0 # Cumulative changes
```

The changelog system uses:
- `CHANGELOG.md` - Human-readable markdown
- `whats-new.json` - Machine-readable structured data
- `src/utils/changelog.ts` - Parsing and display utilities

## Release Process

(For maintainers only - contributors skip this sectiond` - Version entries (can add notes after)
- ❌ `whats-new.json` - Structured changelog data

### Semantic Versioning

Follow [Semantic Versioning 2.0.0](https://semver.org/):

- **MAJOR** (X.0.0): Breaking changes that require user action
  - Example: Changing command names, removing features
- **MINOR** (0.X.0): New features (backward compatible)
  - Example: Adding new commands, new options
- **PATCH** (0.0.X): Bug fixes (backward compatible)
  - Example: Fixing bugs, improving error messages

### Changelog Categories

When running the release script, provide changes in these categories:

- **Added**: New features, commands, or capabilities
- **Changed**: Changes to existing functionality
- **Fixed**: Bug fixes
- **Deprecated**: Features marked for removal in future versions
- **Removed**: Features removed in this version
- **Security**: Security fixes or improvements

### Example Release Session

```bash
$ npm run release

🚀 AliasMate Release Script

Current version: 1.4.0

Enter new version (e.g., 1.5.0): 1.5.0

Update from v1.4.0 to v1.5.0? (y/n): y

📝 Enter changelog information (press Enter with empty line to skip):

ADDED:
  1. New feature X
  2. Command Y with option Z
  3. 

CHANGED:
  1. Improved performance of command A
  2. 

FIXED:
  1. Fixed bug in feature B
  2. 

... (other categories)

✓ Updated package.json to v1.5.0
✓ Updated package-lock.json to v1.5.0
✓ Updated constants.ts to v1.5.0
✓ Updated CHANGELOG.md with v1.5.0
✓ Updated whats-new.json with v1.5.0

Create git commit? (y/n): y
✓ Created git commit for v1.5.0

Create git tag? (y/n): y
✓ Created git tag v1.5.0

✅ Release preparation complete!
```

### Pre-Release Checklist

Before running `npm run release`:

- [ ] All changes are committed
- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Code is formatted (`npm run format:check`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Features are documented in code
- [ ] README.md is updated (if needed)
- [ ] You have the changelog information ready

### Post-Release Checklist

After running the release script:

- [ ] Review the git diff to verify changes
- [ ] Run tests again (`npm test`)
- [ ] Build the project (`npm run build`)
- [ ] Test the built version locally
- [ ] Push to GitHub: `git push origin main --tags`
- [ ] Publish to npm: `npm publish`
- [ ] Create GitHub release with notes from CHANGELOG.md
- [ ] Verify package on npm registry
- [ ] Test installation: `npm install -g aliasmate@latest`

### Release Documentation

For detailed release process documentation, see:
- **RELEASE.md** - Complete release process guide
- **RELEASE_GUIDE.md** - Quick reference for releases

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
