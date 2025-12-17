Archive completed work from Inner Ring to Outer Ring.

## Instructions

1. **Read progress.md**
   ```bash
   cat memory-bank/inner/progress.md
   ```

2. **Identify archive candidates**:
   - Completed milestones (100%)
   - Tasks older than 30 days
   - Content when Inner Ring > 30k tokens

3. **Show candidates to user**:
   ```
   ╭──────────────────────────────────────────────────────────────╮
   │  Archive Candidates                                          │
   ├──────────────────────────────────────────────────────────────┤
   │  1. Milestone: "Initial Setup" (completed 2024-01-10)        │
   │  2. Tasks from December 2023 (15 items)                      │
   │  3. Old decisions (8 items > 30 days)                        │
   ╰──────────────────────────────────────────────────────────────╯

   Archive all? [y/N] or select items (1,2,3):
   ```

4. **Get user confirmation**

5. **For each item to archive**:

   a. Create archive directory:
   ```bash
   mkdir -p memory-bank/outer/archive/$(date +%Y-%m)
   ```

   b. Create archive file with:
   - Completion date
   - Summary of what was done
   - Key decisions made
   - Lessons learned

   c. Remove detailed content from progress.md

   d. Add link to archive in progress.md:
   ```markdown
   ### Milestone 1: Initial Setup (Archived)
   See: [archive/2024-01/initial-setup.md](../outer/archive/2024-01/initial-setup.md)
   ```

6. **Report results**:
   ```
   ╭──────────────────────────────────────────────────────────────╮
   │  ✓ Archive Complete                                          │
   ├──────────────────────────────────────────────────────────────┤
   │  Archived: 3 items                                           │
   │  Tokens saved: ~8,500                                        │
   │  Location: memory-bank/outer/archive/2024-01/                │
   ╰──────────────────────────────────────────────────────────────╯
   ```
