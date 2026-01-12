# AliasMate Development Quick Reference

## Daily Development Commands

```bash
# Start development (watch mode)
npm run dev

# Format code before committing
npm run format

# Check for issues
npm run lint
npm run typecheck

# Build for production
npm run build

# Test locally
node dist/cli.js --help
node dist/cli.js list
```

## Project Structure at a Glance

```
src/
├── cli.ts                 # Entry point
├── commands/              # 8 command implementations
│   ├── prev.ts           # Save from history
│   ├── run.ts            # Execute command
│   ├── save.ts           # Interactive save
│   ├── list.ts           # Show all
│   ├── edit.ts           # Modify existing
│   ├── delete.ts         # Remove command
│   ├── export.ts         # Backup to JSON
│   └── import.ts         # Restore from JSON
├── storage/
│   └── index.ts          # Data persistence
└── utils/
    ├── constants.ts      # Shared messages
    ├── errors.ts         # Error handling
    ├── executor.ts       # Run commands
    ├── history.ts        # Shell integration
    └── paths.ts          # Path utils
```

## Code Patterns

### Adding Constants
```typescript
// src/utils/constants.ts
export const ERROR_MESSAGES = {
  newError: (param: string) => `Message with ${param}`,
} as const;

// Usage in commands
import { ERROR_MESSAGES } from '../utils/constants';
console.error(ERROR_MESSAGES.newError('value'));
```

### Error Handling
```typescript
import { handleError, exitWithError, ExitCode } from '../utils/errors';

// For caught errors
try {
  // code
} catch (error) {
  handleError(error, 'Context message');
}

// For validation failures
if (!isValid) {
  exitWithError('Invalid input', ExitCode.InvalidInput);
}
```

### Adding JSDoc
```typescript
/**
 * Brief one-line description
 *
 * Longer description with details about behavior,
 * edge cases, and important notes.
 *
 * @param name - Description of parameter
 * @param options - Optional parameter description
 * @returns Description of return value
 *
 * @example
 * ```ts
 * // Usage example
 * myFunction('example');
 * ```
 */
export function myFunction(name: string, options?: Options): ReturnType {
  // implementation
}
```

## Pre-Commit Checklist

- [ ] Run `npm run format`
- [ ] Run `npm run lint`
- [ ] Run `npm run typecheck`
- [ ] Run `npm run build`
- [ ] Test locally with `node dist/cli.js`
- [ ] Update CHANGELOG.md if user-facing changes
- [ ] Commit with conventional commit message

## Conventional Commit Examples

```bash
# New feature
git commit -m "feat: add fuzzy search for commands"

# Bug fix
git commit -m "fix: handle empty history file gracefully"

# Documentation
git commit -m "docs: add examples for export command"

# Code cleanup
git commit -m "refactor: extract validation logic to utils"

# Dependencies
git commit -m "chore: update chalk to v5"
```

## Useful Commands

```bash
# Clean build
rm -rf dist/ && npm run build

# Check package size
npm pack --dry-run

# Test as if installed globally
npm link
aliasmate --help
npm unlink

# Find TODO comments
grep -r "TODO" src/

# Count lines of code
find src -name '*.ts' | xargs wc -l
```

## Common Issues & Solutions

### ESLint errors after adding code
```bash
npm run lint:fix  # Auto-fix most issues
npm run format    # Fix formatting
```

### Type errors
```bash
npm run typecheck  # See all type errors
# Add proper types, check TSConfig strict settings
```

### Build fails
```bash
# Clean and rebuild
rm -rf dist/ node_modules/
npm install
npm run build
```

## IDE Setup (VS Code)

Recommended extensions:
- ESLint (dbaeumer.vscode-eslint)
- Prettier (esbenp.prettier-vscode)
- TypeScript (built-in)

Settings:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Release Checklist (Maintainers)

1. [ ] Update version in `package.json`
2. [ ] Update `APP_VERSION` in `src/utils/constants.ts`
3. [ ] Update `CHANGELOG.md`
4. [ ] Run full test suite
5. [ ] Build: `npm run build`
6. [ ] Commit: `chore: release v1.x.x`
7. [ ] Tag: `git tag v1.x.x`
8. [ ] Push: `git push && git push --tags`
9. [ ] Publish: `npm publish`
10. [ ] Create GitHub release

---

**Quick Links**:
- [Full Contributing Guide](./CONTRIBUTING.md)
- [Cleanup Summary](./CLEANUP_SUMMARY.md)
- [README](./README.md)
