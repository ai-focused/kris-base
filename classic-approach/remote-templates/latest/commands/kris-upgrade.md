Upgrade KRIS to latest version or revert to a previous version.

Usage:
  /kris-upgrade          - Upgrade to latest stable version
  /kris-upgrade latest   - Upgrade to latest (bleeding edge)
  /kris-upgrade [version] - Revert to a specific version (e.g., 2.2)

## Instructions

### UPGRADE PROCESS

1. **Check current version**
   Read first 50 lines of CLAUDE.md, find "KRIS Version: X.Y"

2. **Check available versions**
   Fetch version info from:
   `https://raw.githubusercontent.com/ai-focused/kris-base/main/classic-approach/remote-templates/versions.json`

   If fetch fails, inform user and provide manual upgrade instructions.

3. **Compare versions**
   If already on latest, inform user: "Already on KRIS vX.Y (latest)"
   If upgrade available, show what's new (if changelog available)

4. **Get user confirmation**
   Ask: "Upgrade from vX.Y to vZ.W? [y/N]"

5. **Backup current CLAUDE.md**
   ```bash
   cp CLAUDE.md "CLAUDE.loves.KRIS.vX.Y.md.backup"
   ```
   Where X.Y is the current version number.

6. **Add upgrade notice to current CLAUDE.md**
   Before downloading new version, append to current CLAUDE.md:
   ```markdown

   ---

   ## UPGRADE IN PROGRESS

   Upgrading KRIS from vX.Y to vZ.W...

   If something goes wrong, revert with:
   ```
   /kris-upgrade X.Y
   ```

   Or manually restore from: `CLAUDE.loves.KRIS.vX.Y.md.backup`

   ---
   ```

7. **Fetch new CLAUDE.md.base**
   Download from:
   `https://raw.githubusercontent.com/ai-focused/kris-base/main/classic-approach/remote-templates/stable/CLAUDE.md.base`

8. **Preserve project-specific data**
   From current CLAUDE.md, extract and preserve:
   - Project name (from title)
   - One-line description
   - Target audience
   - Current Focus items (if modified)
   - Essential Commands (if filled in)
   - Any custom sections

9. **Merge data into new template**
   Replace placeholders in new template with preserved data

10. **Fetch updated commands**
    Download all command files to .claude/commands/

11. **Write new CLAUDE.md**
    Replace current file with merged content

12. **Verify success**
    Read new CLAUDE.md, confirm version updated

13. **Report completion**
    ```
    ╭──────────────────────────────────────────────────────────────╮
    │  ✓ KRIS Upgrade Complete!                                    │
    ├──────────────────────────────────────────────────────────────┤
    │  Previous: vX.Y                                              │
    │  Current:  vZ.W                                              │
    │  Backup:   CLAUDE.loves.KRIS.vX.Y.md.backup                  │
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
   - CLAUDE.loves.KRIS.v2.2.md.backup
   - CLAUDE.loves.KRIS.v2.3.md.backup
   ```

2. **Get user confirmation**
   Ask: "Revert to vX.Y from backup? Current CLAUDE.md will be replaced. [y/N]"

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
   ╰──────────────────────────────────────────────────────────────╯
   ```

---

### BACKUP FILE NAMING

Format: `CLAUDE.loves.KRIS.vX.Y.md.backup`

Examples:
- `CLAUDE.loves.KRIS.v2.2.md.backup`
- `CLAUDE.loves.KRIS.v2.3.md.backup`
- `CLAUDE.loves.KRIS.v3.0.md.backup`

List available backups:
```bash
ls -la CLAUDE.loves.KRIS.*.md.backup 2>/dev/null
```

---

### ERROR HANDLING

**If fetch fails:**
```
Unable to fetch update from GitHub.

Manual upgrade:
1. Download CLAUDE.md.base from:
   https://github.com/ai-focused/kris-base/tree/main/classic-approach/remote-templates/stable
2. Replace placeholders with your project info
3. Copy to your project as CLAUDE.md

Your current CLAUDE.md has NOT been modified.
```

**If backup already exists:**
Append timestamp: `CLAUDE.loves.KRIS.v2.2.20231217-143022.md.backup`
