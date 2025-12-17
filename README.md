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

## Quick Install

```bash
curl -fsSL https://raw.githubusercontent.com/ai-focused/kris-base/main/installer/kris-install.sh | bash
```

Then launch Claude Code and run:

```bash
claude "install KRIS"
```

Claude will guide you through setup, auto-detecting your project if files already exist.

## Repository Structure

```text
kris-base/
├── installer/              # Shell installer script
│   └── kris-install.sh
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

## Version Channels

- **stable** - Recommended for most users (tested, reliable)
- **latest** - Bleeding edge (may have experimental features)

Current version: **2.3**

## Author

Created by Alexandru Negrila

- Email: <alex@scaledagile.pro>
- LinkedIn: [alexandrunegrila](https://www.linkedin.com/in/alexandrunegrila/)
