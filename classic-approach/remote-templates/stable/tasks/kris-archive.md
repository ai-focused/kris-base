# TASK
Archive completed work from Inner Ring to Outer Ring.

# INPUTS
- `memory-bank/inner/progress.md`
- `memory-bank/inner/activeContext.md`
- Current date (for archive folder naming)

# REQUIREMENTS

## 1. Identify Archive Candidates
Read `progress.md` and identify:
- Completed milestones (100%)
- Tasks older than 30 days
- Content when Inner Ring > 30k tokens

## 2. Present Candidates to User

```
╭──────────────────────────────────────────────────────────────╮
│  Archive Candidates                                          │
├──────────────────────────────────────────────────────────────┤
│  1. <milestone or task description>                          │
│  2. <milestone or task description>                          │
╰──────────────────────────────────────────────────────────────╯

Archive all? [y/N] or select items (1,2,3):
```

## 3. Get User Confirmation
Do NOT proceed without explicit approval.

## 4. For Each Approved Item
- Create archive directory: `memory-bank/outer/archive/YYYY-MM/`
- Create archive file with: completion date, summary, key decisions, lessons learned
- Remove detailed content from `progress.md`
- Add link to archive in `progress.md`:
  ```
  ### Milestone N: Name (Archived)
  See: [archive/YYYY-MM/name.md](../outer/archive/YYYY-MM/name.md)
  ```

# OUTPUT FORMAT (STRICT)

```
╭──────────────────────────────────────────────────────────────╮
│  ✓ Archive Complete                                          │
├──────────────────────────────────────────────────────────────┤
│  Archived: <N> items                                         │
│  Tokens saved: ~<N>                                          │
│  Location: memory-bank/outer/archive/YYYY-MM/                │
╰──────────────────────────────────────────────────────────────╯
```

# CONSTRAINTS
- Do not archive without user confirmation
- Preserve archive file structure (date-based folders)
- Always leave a link in progress.md pointing to the archive
