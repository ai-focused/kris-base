Update activeContext.md with current session progress.

## EXECUTION PATH

**Preferred (kris-mcp tools available):**
- `kris_read("inner/activeContext.md")` → read existing state
- `kris_read("inner/progress.md")` → read existing progress
- Extract session info from conversation history
- `kris_write("inner/activeContext.md", updated_content)` → replace with updated version
- `kris_append("inner/progress.md", new_completion_rows)` → add completion history entries without rewriting the full file

**Fallback (kris-mcp not available):**
- Use Read + Edit tools on the files directly (current behaviour)

`kris_append` is the right primitive for log-style additions — it avoids rewriting the full file for incremental completion history entries.

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

6. **Check interactive template opportunities**
   For each Middle Ring spec file modified in this session, check:
   - Does it have structured `## Modules` with `### Name` + `- **ID**: value`, `- **Depends on**: value`, `- **Phase**: value`? → Suggest `interactive: dependency-graph`
   - Does it have `## User Flows` with `### Flow N: Name` + Step/Screen/Module(s)/Phase table? → Suggest `interactive: flow-diagram`
   - Does it have `## Tables` with `### table_name` + column tables (Column, Type, Constraints)? → Suggest `interactive: entity-relationship`
   - Does it have `## Milestones` or `## Milestone Progress` with `- **Status**: value`, `- **Date**: value`, `- **Progress**: N%`? → Suggest `interactive: timeline`
   - Does it have `- [ ]` / `- [x]` task items that could be a board? → Suggest `interactive: kanban-board`
   - Does it have tables with 3+ columns for feature/option comparison? → Suggest `interactive: comparison-matrix`
   - Does it already have an `interactive:` frontmatter tag that no longer matches the content? → Suggest removing it

   If opportunities found, ask:
   ```
   Interactive template opportunity:
     middle/specs/module-architecture.md could use:
       - dependency-graph (has ## Modules with 14 structured entries)
       - flow-diagram (has ## User Flows with 7 flows)
     Add frontmatter tags? [y/N]
   ```

   IMPORTANT: Structured fields MUST use bullet-prefix format: `- **Key**: Value` (not `**Key**: Value`).
   See [.kris/kris-ui/kris-ui.md](.kris/kris-ui/kris-ui.md#interactive-documentation) for format rules.

7. **Suggest next action**:
   Based on what was updated, suggest logical next step.
