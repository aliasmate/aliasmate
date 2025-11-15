# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.0.0]: https://github.com/aliasmate/aliasmate/releases/tag/v1.0.0
