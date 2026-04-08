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
│   ├── wirepulse.py        # WirePulse proxy Blueprint
│   ├── kris-ui.md          # Authoring guide
│   ├── templates/          # HTML templates + interactive templates
│   └── static/             # CSS + JS (incl. kris-wirepulse.js/css)
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

## KRIS UI — Visual Documentation Browser

KRIS includes a local web viewer for browsing your documentation with search, keyboard shortcuts, and interactive visualizations.

```bash
cd memory-bank/kris-ui && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt && .venv/bin/python3 kris-ui.py
```

Open http://localhost:5111 — features include:
- **Dashboard** with ring token budgets, project achievements, and freshness indicator (git vs docs drift)
- **Ring navigation** with file tree, search, and keyboard shortcuts (1-4 for rings, `/` for search, `h` for home)
- **Light/dark theme** toggle with localStorage persistence
- **Interactive templates** — turn structured markdown into visual explorations

### Interactive Templates

Add `interactive: template-name` to your markdown frontmatter to enable visual views:

```yaml
---
interactive: dependency-graph
---
```

| Template | What it visualizes | Key format |
|----------|-------------------|------------|
| `dependency-graph` | Module nodes with dependency edges | `## Modules` > `### Name` with `- **ID**: value`, `- **Depends on**: value`, `- **Phase**: value` |
| `flow-diagram` | User flows as horizontal swimlanes | `## User Flows` > `### Flow N: Name` with Step/Screen/Module(s)/Phase table |
| `entity-relationship` | Database ER diagrams (draggable) | `## Tables` > `### table_name` with Column/Type/Constraints/Notes table |
| `timeline` | Milestones with progress bars | `## Milestones` > `### Name` with `- **Status**: value`, `- **Date**: value`, `- **Progress**: N%` |
| `kanban-board` | Task cards in status columns | `- [ ]` / `- [x]` items, auto-grouped or explicit `### Column` |
| `comparison-matrix` | Sortable comparison grids | Any table with 3+ columns, auto color-coded |

Multiple templates on one doc: `interactive: [dependency-graph, flow-diagram]`

See [kris-ui.md](kris-ui/kris-ui.md) for full authoring rules and format specs.

## WirePulse — Collaboration System

KRIS v3.5 includes **WirePulse**, a real-time collaboration system for coordinating work across humans and AI agents.

- **Circuits** — workspaces tied to git repos
- **Particles** — actors: protons (humans) and electrons (AI agents)
- **Supercharges** — skills and tools (e.g. `claude-code`, `product-management`)
- **Tasks** — delegated work with status machine, messages, and SSE events
- **Invite codes** — `KRIS-XXXX-XXXX` codes to join circuits

Access via the **⚡ WirePulse** tab in KRIS UI, or press `w`. Requires a WirePulse server — see [kris-sync-server](https://github.com/ai-focused/kris-sync-server).

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

Current version: **3.5**

## Author

Created by Alexandru Negrila

- Email: <alex@scaledagile.pro>
- LinkedIn: [alexandrunegrila](https://www.linkedin.com/in/alexandrunegrila/)
