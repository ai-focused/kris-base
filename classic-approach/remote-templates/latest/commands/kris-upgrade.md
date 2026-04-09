Upgrade KRIS to latest version or revert to a previous version.

Usage:
  /kris-upgrade          - Upgrade to latest stable version
  /kris-upgrade latest   - Upgrade to latest (bleeding edge)
  /kris-upgrade [version] - Revert to a specific version (e.g., 2.2)

## EXECUTION PATH

Not MCP-powered. `/kris-upgrade` operates on CLAUDE.md and downloads files from GitHub — both outside kris-mcp's `memory-bank/` scope. Uses direct file I/O (Read/Edit/Write tools) and curl for downloads as it does today.

kris-mcp itself is downloaded and registered by this command (see step 2.5b), but the upgrade process does not depend on kris-mcp being available.

## Instructions

### UPGRADE PROCESS — TWO-STEP BOOTSTRAP

The upgrade runs in two steps for safety. Step 1 upgrades the upgrade command itself, then Step 2 runs the new version to handle everything else. This ensures security fixes and process improvements are always applied before the upgrade runs.

---

### ARGUMENT ROUTING

Before STEP 1, look at the argument the user passed to `/kris-upgrade`:

- **No argument**: forward upgrade on the `stable` channel → continue to STEP 1
- **`latest`**: forward upgrade on the `latest` channel → continue to STEP 1
- **A version number like `3.5` or `2.4`**: REVERT request → skip STEP 1 and STEP 2 entirely, jump to **REVERT PROCESS** at the bottom of this file
- **Anything else**: error — print usage and stop

`$CHANNEL` is set to `stable` or `latest` based on the first two cases. The revert path never sets `$CHANNEL` and never writes `.kris/.upgrade-pending`.

---

### STEP 1 — BOOTSTRAP (upgrade the upgrader)

1. **Check current version**
   Read first 50 lines of CLAUDE.md, find "KRIS Version: X.Y"

2. **Fetch version info**
   ```bash
   curl -s "https://raw.githubusercontent.com/ai-focused/kris-base/main/classic-approach/remote-templates/versions.json"
   ```
   If fetch fails → show error and stop. Do NOT proceed without version data.

3. **Compare versions**
   If already on latest: "Already on KRIS vX.Y (latest)" → stop.
   If upgrade available: show changelog for all versions between current and target.

   ```
   ╭──────────────────────────────────────────────────────────────╮
   │  KRIS Upgrade Available: vX.Y → vZ.W                        │
   ├──────────────────────────────────────────────────────────────┤
   │  What's new in vZ.W:                                        │
   │    • [changelog item 1]                                      │
   │    • [changelog item 2]                                      │
   │    • ...                                                     │
   ╰──────────────────────────────────────────────────────────────╯
   ```

4. **Get user confirmation**
   Ask: "Upgrade from vX.Y to vZ.W? [y/N]"

5. **Download the NEW kris-upgrade command FIRST**
   Determine channel from argument (default: stable, "latest" → latest). Save it as `$CHANNEL` for the rest of this step:
   ```bash
   curl -s "https://raw.githubusercontent.com/ai-focused/kris-base/main/classic-approach/remote-templates/${CHANNEL}/commands/kris-upgrade.md" > .claude/commands/kris-upgrade.md
   ```

6. **Verify the download**
   Read the downloaded file. If it's less than 50 lines → download failed. Restore original and stop.

7. **Persist the channel for Step 2** (so the user can run `/kris-upgrade` with no argument and still hit the right channel)
   ```bash
   mkdir -p .kris
   echo "$CHANNEL" > .kris/.upgrade-pending
   ```
   This file is read by Step 2 of the new upgrade command and removed on successful completion.

8. **Hand off to the new upgrade command**
   Tell the user (substitute `$CHANNEL` literally — `latest` if the user invoked with that arg, otherwise empty):
   ```
   ╭──────────────────────────────────────────────────────────────╮
   │  Step 1 complete — upgrade command updated.                  │
   │                                                              │
   │  Now run the SAME command again to complete the upgrade:    │
   │    /kris-upgrade $CHANNEL                                    │
   │                                                              │
   │  (Channel preserved in .kris/.upgrade-pending — running     │
   │   /kris-upgrade with no args will also work.)               │
   ╰──────────────────────────────────────────────────────────────╯
   ```
   STOP here. Do NOT continue to Step 2 in the same invocation.

---

### STEP 2 — MAIN UPGRADE (runs with the NEW command)

When `/kris-upgrade` is invoked a second time after the bootstrap, the version check will still show an upgrade is needed (CLAUDE.md hasn't changed yet). Proceed:

#### 2.0 Resolve channel from pending state file (NEW in v3.7)

Before parsing arguments for Step 2, check whether Step 1 left a pending channel marker:

```bash
if [ -f ".kris/.upgrade-pending" ]; then
    CHANNEL=$(cat .kris/.upgrade-pending)
fi
```

If `.kris/.upgrade-pending` exists, use **that channel** for the entire Step 2 — overriding any argument the user passed (or didn't pass) on this invocation. This guarantees Step 2 hits the same channel as Step 1, even if the user runs `/kris-upgrade` with no argument the second time.

If no state file exists, fall back to the argument-based default (stable unless `latest` was passed).

The state file is removed at the end of Step 2 (see step 2.7 — Cleanup pending channel marker). If the upgrade fails partway, the file remains and the next `/kris-upgrade` invocation will pick up where this one left off.

#### 2.1 Backup

```bash
cp CLAUDE.md "CLAUDE.loves.KRIS.vX.Y.md.backup"
```

If backup file already exists, append timestamp:
`CLAUDE.loves.KRIS.v2.4.20260328-143022.md.backup`

#### 2.2 Download all command files

```bash
mkdir -p .claude/commands
```

Download ALL commands (the bootstrap already updated kris-upgrade, but re-download to be safe):
- `kris.md`, `kris-status.md`, `kris-update.md`, `kris-upgrade.md`
- `kris-archive.md`, `kris-compact.md`, `kris-query.md`

Base URL: `https://raw.githubusercontent.com/ai-focused/kris-base/main/classic-approach/remote-templates/{channel}/commands/`

#### 2.3 Download KRIS Tasks (.kris/tasks/)

```bash
mkdir -p .kris/tasks
```

Download all 7 task files from:
`https://raw.githubusercontent.com/ai-focused/kris-base/main/classic-approach/remote-templates/{channel}/tasks/`
- `kris.md`, `kris-status.md`, `kris-update.md`, `kris-upgrade.md`
- `kris-archive.md`, `kris-compact.md`, `kris-query.md`

#### 2.4 Update AGENTS.md (non-destructive)

Download `AGENTS.md.base` from:
`https://raw.githubusercontent.com/ai-focused/kris-base/main/classic-approach/remote-templates/{channel}/AGENTS.md.base`

IF `AGENTS.md` does not exist → save as `AGENTS.md`
IF `AGENTS.md` exists AND does not contain "KRIS" → prepend downloaded content at top, preserve everything below (add `---` separator)
IF `AGENTS.md` exists AND already contains "KRIS" → skip (already configured)

#### 2.5 Migrate tooling from memory-bank/ to .kris/ (v3.7 latest — one-time)

v3.7 latest moves kris-ui and kris-mcp out of `memory-bank/` (which is reserved for ring documentation) into `.kris/` (the tooling home, alongside `.kris/tasks/` and `.kris/sync.json`).

**Log each step** — no user prompts, no backup. Migration is automatic because it's just file moves, venvs are rebuilt from scratch, and rollback is available via `git checkout v3.6-final` on the kris-base repo plus `git stash` on the user's project if they want to revert.

```bash
# Detect old layout
if [ -d "memory-bank/kris-ui" ] || [ -d "memory-bank/kris-mcp" ]; then
    mkdir -p .kris
    echo "Migrating kris-ui + kris-mcp from memory-bank/ to .kris/"
    if [ -d "memory-bank/kris-ui" ]; then
        mv memory-bank/kris-ui .kris/kris-ui
        # Venvs embed absolute paths — drop and rebuild
        rm -rf .kris/kris-ui/.venv
    fi
    if [ -d "memory-bank/kris-mcp" ]; then
        mv memory-bank/kris-mcp .kris/kris-mcp
        rm -rf .kris/kris-mcp/.venv
    fi
fi
```

#### 2.5a Download KRIS UI files

```bash
mkdir -p .kris/kris-ui/templates/interactive/dependency-graph .kris/kris-ui/templates/interactive/flow-diagram .kris/kris-ui/templates/interactive/entity-relationship .kris/kris-ui/templates/interactive/timeline .kris/kris-ui/templates/interactive/kanban-board .kris/kris-ui/templates/interactive/comparison-matrix .kris/kris-ui/static/css .kris/kris-ui/static/js .kris/kris-ui/static/img
```

Download all files to `.kris/kris-ui/` from `https://raw.githubusercontent.com/ai-focused/kris-base/main/classic-approach/remote-templates/{channel}/kris-ui/`:
- `kris-ui.py`, `kris-ui.md`, `requirements.txt`
- `templates/index.html`
- `static/css/style.css`, `static/css/interactive-base.css`
- `static/js/kris-ui.js`, `static/js/interactive-base.js`
- `static/img/kris-logo.png`, `static/img/favicon.ico`
- `templates/interactive/base.html`
- `templates/interactive/dependency-graph/manifest.json`, `template.html`, `format.md`
- `templates/interactive/flow-diagram/manifest.json`, `template.html`, `format.md`
- `templates/interactive/entity-relationship/manifest.json`, `template.html`, `format.md`
- `templates/interactive/timeline/manifest.json`, `template.html`, `format.md`
- `templates/interactive/kanban-board/manifest.json`, `template.html`, `format.md`
- `templates/interactive/comparison-matrix/manifest.json`, `template.html`, `format.md`
- `wirepulse.py`
- `static/css/kris-wirepulse.css`, `static/js/kris-wirepulse.js`

**Clean up old WirePulse file names** (renamed in v3.5):
```bash
rm -f .kris/kris-ui/sync.py .kris/kris-ui/static/css/kris-sync.css .kris/kris-ui/static/js/kris-sync.js
```

**Rebuild kris-ui venv** (Step 2.5 already dropped it if we migrated). Create if missing, update if present:
```bash
if [ ! -d ".kris/kris-ui/.venv" ]; then
    cd .kris/kris-ui && python3 -m venv .venv && .venv/bin/pip install -q -r requirements.txt && cd ../..
else
    cd .kris/kris-ui && .venv/bin/pip install -q -r requirements.txt && cd ../..
fi
```

#### 2.5b Download kris-mcp

```bash
mkdir -p .kris/kris-mcp
```

Download from `https://raw.githubusercontent.com/ai-focused/kris-base/main/classic-approach/remote-templates/{channel}/kris-mcp/`:
- `kris-mcp.py`
- `requirements.txt`

**Find a Python 3.10+ interpreter** — kris-mcp requires it. Try in order: `python3.13`, `python3.12`, `python3.11`, `python3.10`, `python3`. For each candidate, run:
```bash
<candidate> -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")'
```
Accept the first one that reports `3.10` or higher. If none qualify, **skip the venv creation and skip the .mcp.json registration**. Print a clear warning and instructions for the user to install Python 3.10+ and re-run `/kris-upgrade` or create the venv manually. Do NOT write a broken .mcp.json entry — Claude Code would fail to spawn a non-existent interpreter on every session.

**Create or update the venv** (call the interpreter found above `$PY`):

If `.kris/kris-mcp/.venv` does NOT exist (fresh install OR just migrated from memory-bank/ in step 2.5):
```bash
cd .kris/kris-mcp && $PY -m venv .venv && .venv/bin/pip install -q --upgrade pip && .venv/bin/pip install -q -r requirements.txt
```

If `.kris/kris-mcp/.venv` exists (upgrading an existing v3.7 install):
```bash
cd .kris/kris-mcp && .venv/bin/pip install -q -r requirements.txt
```

**On Windows**: use `.venv\Scripts\python.exe` and `.venv\Scripts\pip.exe` instead of `.venv/bin/python3` and `.venv/bin/pip`. Detect OS via CLAUDE.md "Shell Environment" section or by checking if `.kris/kris-mcp/.venv/bin` exists (Unix) vs `.kris/kris-mcp/.venv/Scripts` (Windows).

**Verify the venv works** — run `.kris/kris-mcp/.venv/bin/python3 -c "import mcp, httpx"` (or `.venv\Scripts\python.exe` on Windows). If this fails, do NOT register in `.mcp.json` — warn the user instead.

**Register kris-mcp in `.mcp.json` at the repo root (idempotent — ONLY if the venv import check passed):**

Claude Code reads project-scoped MCP servers from `.mcp.json` at the repo root — NOT from `.claude/settings.json` (that file is for permissions, hooks, statusLine). Using the wrong file silently leaves kris-mcp unloaded.

Read `.mcp.json`. If the file does not exist, create it as `{}`. If `mcpServers.kris-mcp` does NOT exist OR has an old path (pointing at `memory-bank/kris-mcp/...`), update it:

```json
{
  "mcpServers": {
    "kris-mcp": {
      "command": ".kris/kris-mcp/.venv/bin/python3",
      "args": [".kris/kris-mcp/kris-mcp.py"]
    }
  }
}
```

**On Windows**, use `.kris\\kris-mcp\\.venv\\Scripts\\python.exe` as the command.

Preserve any other existing keys in `.mcp.json` — do NOT replace the file, merge `mcpServers.kris-mcp` into it.

**Migration from v3.6**: if the existing `.mcp.json` has `mcpServers.kris-mcp.command` pointing at `memory-bank/kris-mcp/...`, rewrite it to `.kris/kris-mcp/...` (this is a one-time upgrade from v3.6 to v3.7).

**Migration from early-v3.6 builds**: if `.claude/settings.json` contains a `mcpServers.kris-mcp` entry, move it to `.mcp.json` (with the new `.kris/kris-mcp/...` path) and remove it from `.claude/settings.json`. If `.claude/settings.json` becomes `{}` after removal, leave the empty object — do not delete the file.

#### 2.5c Update .gitignore (idempotent)

v3.7 gitignores KRIS tooling — `.kris/` and the KRIS-managed slash commands are downloaded on install/upgrade, not committed. Only `memory-bank/`, `CLAUDE.md`, and `AGENTS.md` stay in git.

If `.gitignore` does not already contain `# KRIS tooling`, append:
```
# KRIS tooling — installed via kris-install.sh or /kris-upgrade
.kris/
.claude/commands/kris.md
.claude/commands/kris-*.md
```

#### 2.6 Smart CLAUDE.md merge (AI-assisted, NOT mechanical replacement)

⚠️ **CRITICAL: Do NOT replace CLAUDE.md with the new template.** The user's CLAUDE.md has evolved and contains project-specific content that must be preserved.

**2.6.1** Download the new template to a temp location:
```bash
curl -s "https://raw.githubusercontent.com/ai-focused/kris-base/main/classic-approach/remote-templates/{channel}/CLAUDE.md.base" > .kris-temp-template.md
```

**2.6.2** Read the changelog from `versions.json` for all versions between current and target. This tells you WHAT changed and WHY.

**2.6.3** Read the user's current CLAUDE.md (the real one, not the backup).

**2.6.4** Read the new template (`.kris-temp-template.md`).

**2.6.5** Analyze and propose changes. Compare the two documents and identify:

- **NEW sections** in the template that don't exist in the user's CLAUDE.md → propose ADDING them
- **UPDATED template sections** where the user's version still matches the OLD template → safe to UPDATE
- **USER-CUSTOMIZED sections** where the user has modified the original template content → PRESERVE, do not touch
- **VERSION references** (header, credits) → UPDATE to new version
- **REMOVED sections** from old template → WARN but don't remove (user may have added content to them)

**2.6.6** Present the merge plan to the user:

```
╭──────────────────────────────────────────────────────────────╮
│  KRIS v2.4 → v2.6 — CLAUDE.md Merge Plan                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ADD (new in v2.6):                                          │
│    • Section "## KRIS Memory Bank UI" (after KRIS Commands)  │
│    • Reference to kris-ui.md for interactive doc authoring    │
│                                                              │
│  UPDATE (unchanged from v2.4 template, safe to update):      │
│    • Version references: v2.4 → v2.6                         │
│    • KRIS Credits box: version number                         │
│                                                              │
│  PRESERVE (you customized these, not touching them):         │
│    • "## Essential Commands" (has real commands)              │
│    • "## Current Focus" (3 active items)                     │
│    • Custom section: "## API Conventions"                    │
│    • Custom section: "## Team Agreements"                    │
│                                                              │
│  REVIEW (template changed, but you also modified):           │
│    • "## KRIS Commands" table — new entries available.       │
│      Your version has custom entries. Merge manually?        │
│                                                              │
╰──────────────────────────────────────────────────────────────╯

Apply ADD + UPDATE changes? [y/N]
Review REVIEW items individually? [r]
Show full new template for comparison? [t]
```

**2.6.7** Apply only the approved changes using the Edit tool. Each change is a targeted edit, not a file replacement.

**2.6.8** Clean up:
```bash
rm -f .kris-temp-template.md
```

#### 2.7 Cleanup pending channel marker

The Step 1 bootstrap left `.kris/.upgrade-pending` so this Step 2 invocation could resolve the channel even if the user ran `/kris-upgrade` with no argument. Remove it now that the upgrade has completed successfully:

```bash
rm -f .kris/.upgrade-pending
```

If you reach this point but the rest of Step 2 failed partway, do NOT remove the file — leave it so the next `/kris-upgrade` invocation picks up the same channel and retries.

#### 2.8 Report completion

```
╭──────────────────────────────────────────────────────────────╮
│  ✓ KRIS Upgrade Complete!                                    │
├──────────────────────────────────────────────────────────────┤
│  Previous: vX.Y                                              │
│  Current:  vZ.W                                              │
│  Channel:  $CHANNEL                                          │
│  Backup:   CLAUDE.loves.KRIS.vX.Y.md.backup                  │
│                                                              │
│  Updated:                                                    │
│    • Commands: 7 files in .claude/commands/                   │
│    • Tasks: 7 files in .kris/tasks/                           │
│    • KRIS UI: files in .kris/kris-ui/                         │
│    • kris-mcp: files in .kris/kris-mcp/                       │
│    • CLAUDE.md: [N] sections added, [M] updated              │
│    • AGENTS.md: [created|updated|unchanged]                  │
│    • .mcp.json: [kris-mcp added|already set|path migrated]   │
│                                                              │
│  Preserved:                                                  │
│    • [N] customized sections unchanged                       │
│    • [M] items flagged for manual review                     │
╰──────────────────────────────────────────────────────────────╯

To revert: /kris-upgrade X.Y
```

---

### REVERT PROCESS (when version argument provided)

1. **Find backup file**
   Look for: `CLAUDE.loves.KRIS.vX.Y.md.backup`

   If not found:
   ```
   Backup for vX.Y not found.
   Available backups:
   ```
   ```bash
   ls -la CLAUDE.loves.KRIS.*.md.backup 2>/dev/null
   ```

2. **Get user confirmation**
   Ask: "Revert to vX.Y from backup? Current CLAUDE.md will be replaced. [y/N]"

   ⚠️ Reverting CLAUDE.md does NOT revert commands or KRIS UI files.
   Those remain at the latest version. Only CLAUDE.md is affected.

3. **Backup current before revert**
   ```bash
   cp CLAUDE.md "CLAUDE.loves.KRIS.vZ.W.md.backup"
   ```

4. **Restore from backup**
   ```bash
   cp "CLAUDE.loves.KRIS.vX.Y.md.backup" CLAUDE.md
   ```

5. **Report completion**
   ```
   ╭──────────────────────────────────────────────────────────────╮
   │  ✓ KRIS Reverted Successfully                                │
   ├──────────────────────────────────────────────────────────────┤
   │  Restored: vX.Y                                              │
   │  Previous (vZ.W) backed up to:                               │
   │    CLAUDE.loves.KRIS.vZ.W.md.backup                          │
   │                                                              │
   │  Note: Commands and KRIS UI are still at vZ.W.               │
   │  Run /kris-upgrade to re-upgrade if needed.                   │
   ╰──────────────────────────────────────────────────────────────╯
   ```

---

### BACKUP FILE NAMING

Format: `CLAUDE.loves.KRIS.vX.Y.md.backup`

If file exists, append timestamp: `CLAUDE.loves.KRIS.v2.4.20260328-143022.md.backup`

List available backups:
```bash
ls -la CLAUDE.loves.KRIS.*.md.backup 2>/dev/null
```

---

### ERROR HANDLING

**If version fetch fails:**
```
Unable to fetch version info from GitHub.

Manual upgrade:
1. Visit: https://github.com/ai-focused/kris-base
2. Download latest commands and KRIS UI files
3. Review the new CLAUDE.md.base template for changes to merge

Your CLAUDE.md has NOT been modified.
```

**If any file download fails during Step 2:**
Continue with remaining files. Report which files failed. The upgrade is still usable — failed files can be re-downloaded by running `/kris-upgrade` again.

**If the user's CLAUDE.md doesn't have a recognizable KRIS version:**
Ask: "I can't detect your current KRIS version. What version are you upgrading from?"

---

### SECURITY NOTES

- ALWAYS download kris-upgrade.md FIRST (Step 1 bootstrap) so security patches to the upgrade process itself are applied before any other actions.
- NEVER execute downloaded content — command files are markdown prompts read by Claude, not scripts.
- ALWAYS verify downloaded files are non-empty before overwriting existing files.
- ALWAYS create a backup before modifying CLAUDE.md.
- NEVER skip the user confirmation step, even if the upgrade is minor.
