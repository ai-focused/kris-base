# TASK
Update memory-bank/inner/activeContext.md to reflect the current session state.

# INPUTS
- Full conversation history
- Existing file: memory-bank/inner/activeContext.md
- Optional: memory-bank/inner/progress.md (if tasks completed)

# EXECUTION PATH
Prefer kris-mcp tools when available:
- `kris_read("inner/activeContext.md")` → existing state
- `kris_read("inner/progress.md")` → existing progress
- `kris_write("inner/activeContext.md", updated_content)` → replace with updated version
- `kris_append("inner/progress.md", new_completion_rows)` → add completion history without rewriting the file

Fall back to Read + Edit tools if kris-mcp is not registered. `kris_append` is the right primitive for log-style additions — avoids rewriting the full file for incremental rows.

# REQUIREMENTS
You must:

1. Extract from the session:
   - Tasks worked on
   - Decisions made
   - Questions raised
   - Files modified
   - Blockers encountered

2. Update activeContext.md:
   - Update "Last Updated" timestamp
   - Update task statuses (include percentages)
   - Append new entries to:
     - Decisions table
     - Questions section
   - Update modified files list
   - Update "Context for Next Session"

3. If any tasks were completed:
   - Update memory-bank/inner/progress.md:
     - Move completed tasks to "Completed This Week"
     - Update milestone percentages
     - Append to completion history

4. Detect interactive documentation opportunities:
   For each modified Middle Ring spec file:
   - If it has structured "## Modules" → suggest: dependency-graph
     Required format: `- **ID**: value`, `- **Depends on**: value`, `- **Phase**: value`
   - If it has "## User Flows" → suggest: flow-diagram
     Required format: `### Flow N: Name` with Step/Screen/Module(s)/Phase table
   - If it has "## Tables" → suggest: entity-relationship
   - If it has "## Milestones" or "## Milestone Progress" → suggest: timeline
     Required format: `- **Status**: value`, `- **Date**: value`, `- **Progress**: N%`
   - If it has `- [ ]` / `- [x]` task items → suggest: kanban-board
   - If it has tables with 3+ columns for comparison → suggest: comparison-matrix
   - If interactive tag mismatch exists → suggest removal

   IMPORTANT: Structured fields MUST use bullet-prefix format:
   `- **Key**: Value` (not `**Key**: Value`)

# OUTPUT

## 1. Confirmation (REQUIRED FORMAT)

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

## 2. Interactive Suggestions (if any)

Format:

Interactive template opportunity:
  <file> could use:
    - <template>
  Add frontmatter tags? [y/N]

## 3. Next Action
Suggest the most logical next step based on updated context.

# CONSTRAINTS
- Do not hallucinate file contents
- Only update relevant sections
- Preserve existing structure and formatting
