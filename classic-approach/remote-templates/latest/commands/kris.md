Show KRIS welcome banner, credits, project status, and available commands.

## Instructions

### 1. Display Banner

```
╭──────────────────────────────────────────────────────────────╮
│  KRIS - Knowledge Rings Information System                   │
│                                                              │
│  Created by: Alexandru Negrila                               │
│  Contact: alex@scaledagile.pro                               │
│  Documentation: https://github.com/ai-focused/kris-base      │
│                                                              │
│  KRIS Version: 2.3                                           │
╰──────────────────────────────────────────────────────────────╯
```

### 2. Show Ring Overview

```
Ring Structure:
  📍 Core Ring    → CLAUDE.md + memory-bank/core/
  🔄 Inner Ring   → memory-bank/inner/
  📚 Middle Ring  → memory-bank/middle/
  📦 Outer Ring   → memory-bank/outer/archive/
```

### 3. Get Current Project Status

Read the following files to understand current state:
- `memory-bank/inner/activeContext.md` - Current work
- `memory-bank/inner/progress.md` - Completed work

Extract:
- Current phase
- Active tasks (in progress)
- Recent completions
- Any blockers

### 4. Display Status Summary

```
╭──────────────────────────────────────────────────────────────╮
│  Current Project Status                                      │
├──────────────────────────────────────────────────────────────┤
│  Phase:    [Current Phase]                                   │
│  Active:   [X] tasks in progress                             │
│  Done:     [Y] tasks this week                               │
│  Blockers: [None | List]                                     │
├──────────────────────────────────────────────────────────────┤
│  Latest: [Most recent completed task]                        │
│  Next:   [Recommended next action]                           │
╰──────────────────────────────────────────────────────────────╯
```

### 5. Show Available Commands

| Command | Description |
|---------|-------------|
| /kris | Show this status |
| /kris-status | Check token usage across rings |
| /kris-status <ring> | Detailed per-file breakdown |
| /kris-update | Update activeContext.md |
| /kris-upgrade | Upgrade KRIS version |
| /kris-archive | Archive old content |
| /kris-compact | Optimize ring content |
| /kris-query <ring> <topic> | Search ring content |

### 6. Ask for Next Steps

After displaying status, ask:
"What would you like to work on next?"

Suggest options based on:
- Incomplete tasks from activeContext.md
- Next milestones from progress.md
- Any blockers that need resolution
