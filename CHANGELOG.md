# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-01-11

### Added
- **New Features**
  - `search` (alias `find`) command to search commands by name, text, or directory
  - Automatic backup creation before importing commands
  - Success confirmation message for command execution
  - Directory existence indicator in list output
  - Command creation timestamp display in list output
  - Enhanced config command showing directory, file path, and command count
  - Exit code display for failed command executions

- **Security & Validation**
  - Comprehensive input validation for command names (alphanumeric, hyphens, underscores only)
  - Directory existence validation with warnings
  - Path normalization to absolute paths for consistency
  - Import data structure validation to prevent malformed data
  - Empty input validation for all prompts
  - Command execution validation (directory exists and is actually a directory)

- **Error Handling**
  - Global uncaught exception handler
  - Global unhandled promise rejection handler
  - Enhanced error messages with more context
  - Try-catch blocks around all setAlias operations
  - Improved error messages for specific scenarios

- **Utility Functions**
  - `isValidDirectory()` for directory validation
  - `sanitizeCommandName()` for input sanitization
  - Atomic file write operations to prevent corruption
  - Exit code tracking in command execution results

### Changed
- **Improvements**
  - Delete command now shows details of what will be deleted
  - Export command creates parent directories if they don't exist
  - Export command warns when overwriting existing files
  - Import command validates each alias structure before processing
  - All user inputs are trimmed before processing
  - All directory paths are normalized to absolute paths
  - Enhanced rename validation in import conflict resolution

- **Code Quality**
  - Consistent input validation across all commands
  - Better error propagation with context
  - Improved command execution error reporting
  - Enhanced CLI help messages for unknown commands

### Fixed
- Atomic write operations prevent config file corruption during saves
- Proper validation of command names to prevent special characters
- Directory validation prevents execution errors
- Input trimming prevents whitespace-related issues
- Better error handling for setAlias validation errors

### Developer Notes
- **Breaking Changes**: None - fully backward compatible
- **Migration**: No migration needed
- All changes enhance existing functionality
- New search command provides additional value
- Improved data safety through atomic operations and backups

## [1.1.0] - 2026-01-08

### Added
- **Developer Experience**
  - ESLint configuration with TypeScript support for code quality enforcement
  - Prettier configuration for consistent code formatting
  - Comprehensive JSDoc documentation for all public functions
  - CONTRIBUTING.md with detailed contributor guidelines
  - DEV_GUIDE.md for quick development reference
  - New npm scripts: `lint`, `lint:fix`, `format`, `format:check`, `typecheck`

- **Code Quality**
  - Centralized error handling utilities (`src/utils/errors.ts`)
  - Standardized error messages and constants (`src/utils/constants.ts`)
  - Custom error types and exit code enums
  - Proper TypeScript type annotations throughout codebase

### Changed
- **Refactoring**
  - Removed all `any` types, replaced with proper TypeScript interfaces
  - Standardized error handling across all commands
  - Eliminated code duplication (30+ duplicate strings removed)
  - Improved type safety for inquirer prompt responses
  - Updated all command files to use centralized error utilities
  - Better JSDoc documentation with usage examples for all functions

- **Code Organization**
  - Extracted common error handling patterns to utilities
  - Centralized all user-facing messages in constants
  - Removed unused function parameters
  - Improved import organization (Node → External → Internal)

### Fixed
- Proper typing for execa error handling
- Consistent exit codes across all error scenarios
- Fixed async/await usage where not needed

### Developer Notes
- **Breaking Changes**: None - this is a code quality improvement release
- **Migration**: No migration needed, fully backward compatible
- All code now passes TypeScript strict mode compilation
- ESLint: 0 errors, 5 acceptable warnings (from inquirer library types)
- 100% of functions now have comprehensive JSDoc documentation

## [1.0.0] - 2025-11-15

### Added
- Initial release
- `prev` command to save previous shell command
- `run` command to execute saved commands
- `save` command for interactive command saving
- `list` (alias `ls`) command to display all saved commands
- `edit` command to modify saved commands
- `delete` (alias `rm`) command to remove saved commands
- `export` command to backup commands to JSON
- `import` command to restore commands from JSON
- `config` command to show config file location
- Cross-platform support (Linux, macOS, Windows)
- Colored terminal output
- Working directory preservation and override
- Interactive conflict resolution for imports
- Automatic config directory creation

### Features
- Save commands with their original working directory
- Override working directory when running commands
- Export/import with conflict handling (overwrite/skip/rename)
- Read from shell history (bash, zsh)
- Persistent storage in user config directory
- Input validation and error handling
- Beautiful CLI output with chalk

[1.2.0]: https://github.com/aliasmate/aliasmate/releases/tag/v1.2.0
[1.1.0]: https://github.com/aliasmate/aliasmate/releases/tag/v1.1.0
[1.0.0]: https://github.com/aliasmate/aliasmate/releases/tag/v1.0.0
