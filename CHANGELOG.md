# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.1] - 2026-01-14

### Fixed
- Fixed a bug where llm.txt is stuck with initial version
- Silently recreates llm command with the latest version

## [1.5.0] - 2026-01-14

### Added
- **Automatic Version Update Checker**
  - Checks npm registry for new versions once per day
  - Beautiful notification displayed when updates are available
  - Smart error handling: silently fails if offline or network errors occur
  - 5-second timeout prevents blocking user workflow
  - Stores check metadata in `~/.config/aliasmate/metadata.json`
  - Never interrupts or delays command execution
  - Clear upgrade instructions in notification

- **Metadata Storage System**
  - New generic metadata storage for application state
  - Separate from command aliases for better organization
  - Support for typed metadata with TypeScript generics
  - Atomic file operations to prevent corruption
  - Foundation for future feature enhancements

### Changed
- Version checks run automatically on every command but only notify once per day
- Configuration directory now contains both `config.json` (aliases) and `metadata.json` (app state)

## [1.3.1] - 2026-01-12

### Fixed
- **Onboarding Display Issue**
  - Fixed onboarding not showing on first install or after upgrades
  - Onboarding now displays on first run regardless of whether arguments are provided
  - Welcome message and upgrade notifications now appear before any command execution
  - Help menu is only shown when running without arguments and onboarding wasn't displayed

## [1.3.0] - 2026-01-12

### Added
- **Onboarding Experience**
  - Welcome message and tour for first-time users
  - Version upgrade notifications with new feature highlights
  - Onboarding state tracking to avoid repeated messages
  - Pro tips and helpful guidance for new users
  - Installation date tracking

- **Path Mode Feature**
  - New `pathMode` option for each saved command (`saved` or `current`)
  - "Saved Directory" mode: Commands run in their saved directory (default, backward compatible)
  - "Current Directory" mode: Commands run in user's current working directory
  - Path mode selection during `aliasmate save` command
  - Path mode editing via `aliasmate edit` command
  - Path mode display in `aliasmate list` output with icons (📁 Saved / 📍 Current)
  - Path mode indicator when running commands
  - Backward compatibility with existing commands (defaults to 'saved' mode)

- **LLM Integration**
  - Default "llm" command automatically created on first install
  - Generates comprehensive `llm.txt` documentation file
  - Includes all features, commands, best practices, and examples
  - Designed for sharing with AI assistants (ChatGPT, Claude, etc.)
  - Uses "current" path mode so users can generate the file anywhere
  - 267 lines of detailed documentation

- **Enhanced User Experience**
  - More informative output when saving commands with `prev` (shows path mode)
  - Path mode hint in save confirmation messages
  - Clear visual indicators for path modes in list output
  - Better explanation of path modes in interactive prompts

### Changed
- **API Changes**
  - `CommandAlias` interface now includes optional `pathMode` field
  - `setAlias()` function now accepts optional `pathMode` parameter (defaults to 'saved')
  - `runCommand()` now respects path mode when no override path is provided
  - All command operations preserve backward compatibility

- **Improvements**
  - Enhanced list command output with path mode information
  - Better visual hierarchy in command listings
  - Improved help messages explaining path modes
  - More descriptive prompts in interactive commands

### Fixed
- TypeScript compilation warnings for unused imports

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
