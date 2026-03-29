# KRIS - Knowledge Rings Information System

KRIS gives AI assistants **persistent memory** across sessions. Instead of starting fresh each time, your AI assistant remembers your project's context, decisions, and progress.

KRIS works with **Claude Code**, **OpenAI Codex**, **Cursor**, **GitHub Copilot**, **Windsurf**, and any AI tool that reads `AGENTS.md`.

## The Four Rings

Documentation is organized in concentric rings, each with specific purposes and token budgets:

| Ring | Purpose | Budget |
|------|---------|--------|
| 📍 **Core** | Quick reference, project identity | ~15k tokens |
| 🔄 **Inner** | Active work, current progress | ~30k tokens |
| 📚 **Middle** | System docs, architecture | ~50k/file |
| 📦 **Outer** | Archive, historical docs | Unlimited |

### Core Ring Files

The Core Ring includes these root-level files (displayed in KRIS UI with a `root` badge):

| File | Purpose | Used by |
|------|---------|---------|
| `CLAUDE.md` | Project rules, engineering standards, KRIS configuration | Claude Code |
| `AGENTS.md` | Multi-agent compatibility — points to CLAUDE.md, defines `.kris/tasks/` system | Codex, Cursor, Copilot, Windsurf |

Both files live at the project root (not inside `memory-bank/`) but are shown in the Core Ring in KRIS UI.

## Prerequisites

### AI Tool Installation

KRIS works best with [Claude Code](https://claude.ai/code) but supports any AI coding assistant that reads `AGENTS.md`.

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
├── kris-ui/                # Local web documentation viewer (Flask)
│   ├── kris-ui.py          # Main app
│   ├── kris-ui.md          # Authoring guide
│   ├── templates/          # HTML templates + interactive templates
│   └── static/             # CSS + JS
└── classic-approach/       # KRIS implementation
    ├── scaffolder/         # CLAUDE.md templates for initial setup
    └── remote-templates/   # Runtime templates, commands, and tasks
        ├── stable/         # Stable channel
        │   ├── commands/   # Claude Code slash commands
        │   └── tasks/      # Agent-agnostic KRIS tasks (.kris/tasks/)
        ├── latest/         # Latest channel (same structure)
        └── versions.json   # Version registry and changelogs
```

## KRIS Commands

After installation, these commands are available:

| Command | Claude Code | Other Agents | Description |
|---------|-------------|-------------|-------------|
| `/kris` | `.claude/commands/` | `.kris/tasks/` | Show status and available commands |
| `/kris-status` | same | same | Check token usage across rings |
| `/kris-update` | same | same | Update activeContext.md |
| `/kris-upgrade` | same | same | Upgrade KRIS version |
| `/kris-archive` | same | same | Archive old content to outer ring |
| `/kris-compact` | same | same | Optimize ring content |
| `/kris-query` | same | same | Search ring content |

In Claude Code, use `/kris-status`. In other agents, use `run kris-status` or reference `.kris/tasks/kris-status.md`.

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

Current version: **3.1**

## Author

Created by Alexandru Negrila

- Email: <alex@scaledagile.pro>
- LinkedIn: [alexandrunegrila](https://www.linkedin.com/in/alexandrunegrila/)
