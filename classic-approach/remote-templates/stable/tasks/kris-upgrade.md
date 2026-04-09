# TASK
Upgrade KRIS to the latest version — commands, tasks, KRIS UI, kris-mcp, and CLAUDE.md.

# INPUTS
- Current `CLAUDE.md` (first 50 lines for version detection)
- Version info: `https://raw.githubusercontent.com/ai-focused/kris-base/main/classic-approach/remote-templates/versions.json`
- Optional argument: `latest` (channel) or version number (for revert)

# EXECUTION PATH
Not MCP-powered. Upgrade operates on CLAUDE.md and downloads files from GitHub — both outside kris-mcp's `memory-bank/` scope. Uses direct file I/O (Read/Edit/Write) and curl as it does today.

kris-mcp itself is downloaded and registered by this task (step 2.5b), but the upgrade process does not depend on kris-mcp being available.

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

## 9. Install or Update kris-mcp (MCP server)
Download from `https://raw.githubusercontent.com/ai-focused/kris-base/main/classic-approach/remote-templates/{channel}/kris-mcp/`:
- `kris-mcp.py` → `memory-bank/kris-mcp/kris-mcp.py`
- `requirements.txt` → `memory-bank/kris-mcp/requirements.txt`

**Find Python 3.10+**: try `python3.13`, `python3.12`, `python3.11`, `python3.10`, `python3` in order. For each, check `sys.version_info >= (3, 10)`. Take the first match as `$PY`.

If no 3.10+ interpreter is found → SKIP venv creation AND settings.json registration. Print a warning with instructions. Do NOT write a broken settings.json entry.

If `$PY` is found:
- If `memory-bank/kris-mcp/.venv` does NOT exist → `cd memory-bank/kris-mcp && $PY -m venv .venv && .venv/bin/pip install -q --upgrade pip && .venv/bin/pip install -q -r requirements.txt`
- If `memory-bank/kris-mcp/.venv` exists → `cd memory-bank/kris-mcp && .venv/bin/pip install -q -r requirements.txt`
- Verify with `memory-bank/kris-mcp/.venv/bin/python3 -c "import mcp, httpx"`. On Windows use `.venv\Scripts\python.exe`.
- If verification passes, merge into `.mcp.json` at the repo root (idempotent — skip if `mcpServers.kris-mcp` already present):
  ```json
  {"mcpServers": {"kris-mcp": {"command": "memory-bank/kris-mcp/.venv/bin/python3", "args": ["memory-bank/kris-mcp/kris-mcp.py"]}}}
  ```
- Claude Code reads project MCP servers from `.mcp.json` at the repo root — NOT from `.claude/settings.json`. Using the wrong file silently leaves kris-mcp unloaded.
- Preserve all other keys in `.mcp.json`. On Windows use `memory-bank\\kris-mcp\\.venv\\Scripts\\python.exe`.
- **Migration from early-v3.6 builds**: if `.claude/settings.json` contains `mcpServers.kris-mcp`, move it to `.mcp.json` and remove it from `.claude/settings.json`. Leave `.claude/settings.json` as `{}` if empty after removal — do not delete the file.

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
