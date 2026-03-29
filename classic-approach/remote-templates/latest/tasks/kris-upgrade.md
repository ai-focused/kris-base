# TASK
Upgrade KRIS to the latest version — commands, tasks, KRIS UI, and CLAUDE.md.

# INPUTS
- Current `CLAUDE.md` (first 50 lines for version detection)
- Version info: `https://raw.githubusercontent.com/ai-focused/kris-base/main/classic-approach/remote-templates/versions.json`
- Optional argument: `latest` (channel) or version number (for revert)

# REQUIREMENTS

## 1. Check Current Version
Read first 50 lines of CLAUDE.md, find "KRIS Version: X.Y"

## 2. Fetch Version Info
Download `versions.json` from GitHub.
IF fetch fails → show error, stop.

## 3. Compare Versions
IF already on latest → inform user, stop.
IF upgrade available → show changelog for all versions between current and target.

## 4. Get User Confirmation
Ask: "Upgrade from vX.Y to vZ.W? [y/N]"

## 5. Backup
```
cp CLAUDE.md "CLAUDE.loves.KRIS.vX.Y.md.backup"
```
IF backup exists → append timestamp.

## 6. Download Updated Files

### Commands (.claude/commands/)
Download all 7 command files from:
`https://raw.githubusercontent.com/ai-focused/kris-base/main/classic-approach/remote-templates/{channel}/commands/`

### Tasks (.kris/tasks/)
Download all 7 task files from:
`https://raw.githubusercontent.com/ai-focused/kris-base/main/classic-approach/remote-templates/{channel}/tasks/`

### KRIS UI (memory-bank/kris-ui/)
Create directories and download all files. See versions.json `files.kris_ui` for the complete list.

### AGENTS.md
Download `AGENTS.md.base`.
IF `AGENTS.md` does not exist → save as `AGENTS.md`
IF `AGENTS.md` exists AND does not contain "KRIS" → prepend KRIS block, preserve rest
IF `AGENTS.md` exists AND contains "KRIS" → skip

## 7. Smart CLAUDE.md Merge
Download new `CLAUDE.md.base` to a temp file.
Read both the user's current CLAUDE.md and the new template.
Read the changelog to understand what changed.

Propose targeted changes:
- ADD: new sections not in current CLAUDE.md
- UPDATE: version references, credits
- PRESERVE: user-customized sections (do not touch)
- REVIEW: sections changed in both template and user's file

Show merge plan. Apply only approved changes via edits, not file replacement.

## 8. Update Dependencies
IF `memory-bank/kris-ui/.venv` exists:
```
cd memory-bank/kris-ui && .venv/bin/pip install -q -r requirements.txt
```

# OUTPUT FORMAT (STRICT)

```
╭──────────────────────────────────────────────────────────────╮
│  ✓ KRIS Upgrade Complete!                                    │
├──────────────────────────────────────────────────────────────┤
│  Previous: vX.Y                                              │
│  Current:  vZ.W                                              │
│  Backup:   CLAUDE.loves.KRIS.vX.Y.md.backup                  │
│                                                              │
│  Updated:                                                    │
│    • Commands: 7 files                                       │
│    • Tasks: 7 files                                          │
│    • KRIS UI: <N> files                                      │
│    • CLAUDE.md: <N> sections added/updated                   │
│    • AGENTS.md: <created|updated|unchanged>                  │
╰──────────────────────────────────────────────────────────────╯
```

# CONSTRAINTS
- ALWAYS backup before modifying CLAUDE.md
- NEVER replace CLAUDE.md wholesale — use smart merge
- NEVER skip user confirmation
- Verify downloaded files are non-empty before overwriting
