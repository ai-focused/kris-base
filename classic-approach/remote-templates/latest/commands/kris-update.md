Update activeContext.md with current session progress.

## Instructions

1. **Review conversation history**
   Scan the current session for:
   - Tasks worked on
   - Decisions made
   - Questions raised
   - Files modified
   - Blockers encountered

2. **Read current activeContext.md**
   ```bash
   cat memory-bank/inner/activeContext.md
   ```

3. **Update the file with**:
   - New "Last Updated" timestamp
   - Updated task statuses (with percentages)
   - New decisions in the decisions table
   - New questions in the questions section
   - Modified file list
   - Updated "Context for Next Session"

4. **If tasks completed**, also update progress.md:
   - Move completed tasks to "Completed This Week"
   - Update milestone percentages
   - Add to completion history

5. **Confirm to user**:
   ```
   ╭──────────────────────────────────────────────────────────────╮
   │  ✓ KRIS Updated                                              │
   ├──────────────────────────────────────────────────────────────┤
   │  activeContext.md:                                           │
   │    • Updated [X] task statuses                               │
   │    • Added [Y] decisions                                     │
   │    • Noted [Z] modified files                                │
   │                                                              │
   │  progress.md:                                                │
   │    • Moved [N] tasks to completed                            │
   ╰──────────────────────────────────────────────────────────────╯
   ```

6. **Suggest next action**:
   Based on what was updated, suggest logical next step.
