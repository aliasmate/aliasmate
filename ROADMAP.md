# AliasMate Roadmap

This document outlines planned features and improvements for AliasMate.

## 🚀 In Progress

### Environment Variable Capture
**Status:** 🏗️ In Development  
**Priority:** High

Automatically capture and restore environment variables when saving and running commands.

**Features:**
- Prompt users to save env vars when using `save` or `prev` commands
- Selective env var storage (exclude system vars like PATH, HOME, USER)
- Security warnings for sensitive variables (API keys, tokens, passwords)
- Merge saved env with current env when running commands
- Show env diff when executing commands
- Include env vars in export/import functionality
- Edit env vars through `aliasmate edit` command

**Benefits:**
- Consistent execution environment across runs
- Reproducible command results
- Simplified configuration management
- Better team collaboration

---

## 📋 Planned Features

### High Priority (Low Complexity)

#### 1. Command Templates/Placeholders 🎯
Allow dynamic values in saved commands.

```bash
aliasmate save deploy --template
# Saves: docker deploy {{SERVICE_NAME}} --tag {{VERSION}}
aliasmate run deploy
# Prompts: SERVICE_NAME? VERSION?
```

**Benefits:**
- Reusable commands with variable inputs
- Reduced need for multiple similar commands
- Interactive workflows

---

#### 2. Tags/Categories 🏷️
Organize commands with tags for better management.

```bash
aliasmate save build-prod --tags deployment,production
aliasmate list --tag deployment
aliasmate list --tag docker
```

**Benefits:**
- Better command organization
- Quick filtering and discovery
- Logical grouping of related commands

---

#### 3. Command Favorites/Pin ⭐
Pin frequently used commands for quick access.

```bash
aliasmate pin build-prod
aliasmate favorites  # Shows pinned commands
aliasmate unpin build-prod
```

**Benefits:**
- Quick access to most-used commands
- Reduced scrolling through long lists
- Personalized workflow optimization

---

#### 4. Output Logging 📝
Automatically save command output to log files.

```bash
aliasmate run build --log
# Saves output to ~/.config/aliasmate/logs/build-2026-01-14.log
aliasmate logs build  # View recent logs
aliasmate logs build --tail  # Tail latest log
```

**Benefits:**
- Command execution history
- Debugging and troubleshooting
- Audit trail for deployments

---

### Medium Priority (Higher Complexity)

#### 5. Command Chaining/Workflows 🔗
Execute multiple saved commands in sequence.

```bash
aliasmate chain build-and-deploy build test deploy
aliasmate run build-and-deploy
```

**Features:**
- Stop on error or continue
- Pass output between commands
- Conditional execution

**Benefits:**
- Automated workflows
- Complex deployment pipelines
- Reduced manual intervention

---

#### 6. Pre/Post Hooks 🪝
Add hooks that run before/after commands.

```bash
aliasmate hook build --pre "echo 'Starting build...'"
aliasmate hook build --post "notify-send 'Build complete'"
aliasmate hook deploy --pre "git pull origin main"
```

**Benefits:**
- Automatic setup/cleanup
- Notifications and alerts
- Validation before execution

---

#### 7. Command Dependencies 🔄
Define prerequisite commands that must run first.

```bash
aliasmate save deploy --requires build,test
# Auto-runs build and test before deploy
aliasmate save test --requires install
```

**Benefits:**
- Automated dependency resolution
- Consistent execution order
- Prevention of incomplete workflows

---

#### 8. Enhanced Fuzzy Search 🔍
Improve existing search functionality.

**Features:**
- Search by command content
- Search by directory path
- Search by tags
- Recent/frequently used sorting
- Full-text search across all metadata

**Benefits:**
- Faster command discovery
- Better large-scale management
- Usage-based recommendations

---

## 🎯 Future Considerations

### Advanced Features (Long-term)

- **Command Aliases**: Short aliases for frequently used commands (`aliasmate alias bp build-prod`)
- **Shared Command Repository**: Team/organization shared command library
- **Cloud Sync**: Sync commands across machines via cloud storage
- **Command Scheduling**: Schedule commands to run at specific times (cron-like)
- **Interactive TUI**: Terminal UI for browsing and managing commands
- **Shell Integration**: Deeper shell integration (autocomplete, inline suggestions)
- **Command Analytics**: Track usage statistics and suggest optimizations
- **Version Control**: Track command history and rollback changes
- **Conditional Execution**: Run commands based on conditions (OS, time, file existence)
- **Remote Execution**: Execute commands on remote servers via SSH

---

## 📝 Notes

- Features are prioritized based on user value vs. implementation complexity
- Backward compatibility will be maintained for all changes
- Security and data safety are top priorities
- Community feedback is welcome - open issues for feature requests!

---

## 🤝 Contributing

Want to help implement these features? Check out [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to AliasMate.

---

**Last Updated:** January 14, 2026
