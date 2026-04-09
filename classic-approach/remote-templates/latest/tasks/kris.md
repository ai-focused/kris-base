# TASK
Display KRIS welcome banner, project status, KRIS UI status, and available tasks.

# INPUTS
- `memory-bank/inner/activeContext.md`
- `memory-bank/inner/progress.md`
- `memory-bank/kris-ui/kris-ui.py` (check existence)
- `memory-bank/kris-ui/.venv/` (check existence)

# EXECUTION PATH
Prefer kris-mcp tools when available:
- `kris_status()` → ring overview
- `kris_read("inner/activeContext.md")` → current focus, active tasks, blockers
- `kris_read("inner/progress.md")` → milestone status

Fall back to direct file reads if kris-mcp is not registered. Output format identical either way.

# REQUIREMENTS

## 1. Display Banner

```
╭──────────────────────────────────────────────────────────────╮
│  KRIS - Knowledge Rings Information System                   │
│  Created by: Alexandru Negrila                               │
│  Documentation: https://github.com/ai-focused/kris-base      │
│  KRIS Version: 3.3                                           │
╰──────────────────────────────────────────────────────────────╯
```

## 2. Show Ring Overview

```
Ring Structure:
  📍 Core Ring    → CLAUDE.md + memory-bank/core/
  🔄 Inner Ring   → memory-bank/inner/
  📚 Middle Ring  → memory-bank/middle/
  📦 Outer Ring   → memory-bank/outer/archive/
```

## 3. Extract Project Status

From `activeContext.md` and `progress.md`, extract:
- Current phase
- Active tasks (in progress)
- Recent completions
- Blockers

## 4. Check KRIS UI

IF `memory-bank/kris-ui/kris-ui.py` exists:
  - Show: Installed
  - IF `.venv/` exists: show start command
  - ELSE: show first-time setup command

IF not installed:
  - Suggest `/kris-upgrade` or manual download

# OUTPUT FORMAT (STRICT)

```
╭──────────────────────────────────────────────────────────────╮
│  Current Project Status                                      │
├──────────────────────────────────────────────────────────────┤
│  Phase:    <phase>                                           │
│  Active:   <N> tasks in progress                             │
│  Done:     <N> tasks this week                               │
│  Blockers: <None | list>                                     │
├──────────────────────────────────────────────────────────────┤
│  Latest: <most recent completed task>                        │
│  Next:   <recommended next action>                           │
╰──────────────────────────────────────────────────────────────╯
```

Then show available tasks table.
Then ask: "What would you like to work on next?"

# CONSTRAINTS
- Do not read full file contents for status — extract headers and metadata only
- Suggest next steps based on incomplete tasks and blockers
