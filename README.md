# KRIS - Knowledge Rings Information System

KRIS gives AI assistants **persistent memory** across sessions. Instead of starting fresh each time, Claude remembers your project's context, decisions, and progress.

## The Four Rings

Documentation is organized in concentric rings, each with specific purposes and token budgets:

| Ring | Purpose | Budget |
|------|---------|--------|
| 📍 **Core** | Quick reference, project identity | ~15k tokens |
| 🔄 **Inner** | Active work, current progress | ~30k tokens |
| 📚 **Middle** | System docs, architecture | ~50k/file |
| 📦 **Outer** | Archive, historical docs | Unlimited |

## Prerequisites

### Claude Code Installation

KRIS requires [Claude Code](https://claude.ai/code) to be installed on your system.

**macOS / Linux / WSL:**

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

**Windows (PowerShell):**

```powershell
irm https://claude.ai/install.ps1 | iex
```

**Alternative (npm):**

```bash
npm install -g @anthropic-ai/claude-code
```

Verify installation:

```bash
claude --version
```

For more information, see the [official Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code).

## Quick Install

### macOS / Linux / WSL / Git Bash

```bash
curl -fsSL https://raw.githubusercontent.com/ai-focused/kris-base/main/installer/kris-install.sh | bash
```

### Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/ai-focused/kris-base/main/installer/kris-install.ps1 | iex
```

### After Installation

Launch Claude Code in your project directory and run:

```bash
claude "install KRIS"
```

Claude will guide you through setup, auto-detecting your project if files already exist.

## Repository Structure

```text
kris-base/
├── installer/              # Installation scripts
│   ├── kris-install.sh     # Unix/macOS/Linux/WSL
│   └── kris-install.ps1    # Windows PowerShell
└── classic-approach/       # Classic file-based KRIS implementation
    ├── scaffolder/         # CLAUDE.md templates for initial setup
    │   ├── stable/
    │   └── latest/
    └── remote-templates/   # Runtime templates and commands
        ├── stable/
        ├── latest/
        └── versions.json
```

## KRIS Commands

After installation, these slash commands are available in Claude Code:

| Command | Description |
|---------|-------------|
| `/kris` | Show status and available commands |
| `/kris-status` | Check token usage across rings |
| `/kris-update` | Update activeContext.md |
| `/kris-upgrade` | Upgrade KRIS version |
| `/kris-archive` | Archive old content to outer ring |
| `/kris-compact` | Optimize ring content |
| `/kris-query` | Search ring content |

## Platform Support

| Platform | Status | Installer |
|----------|--------|-----------|
| macOS | ✅ Full | `kris-install.sh` |
| Linux | ✅ Full | `kris-install.sh` |
| Windows + WSL | ✅ Full | `kris-install.sh` |
| Windows + Git Bash | ✅ Full | `kris-install.sh` |
| Windows (PowerShell) | ✅ Full | `kris-install.ps1` |

## Version Channels

- **stable** - Recommended for most users (tested, reliable)
- **latest** - Bleeding edge (may have experimental features)

Current version: **2.4**

## Author

Created by Alexandru Negrila

- Email: <alex@scaledagile.pro>
- LinkedIn: [alexandrunegrila](https://www.linkedin.com/in/alexandrunegrila/)
