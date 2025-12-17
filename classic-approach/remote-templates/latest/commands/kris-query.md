Search specific KRIS ring for information.

Usage:
  /kris-query <ring> <topic>
  /kris-query all <topic>

Examples:
  /kris-query inner authentication
  /kris-query middle api
  /kris-query all database

Valid rings: core, inner, middle, outer, all

## Instructions

**IMPORTANT**: Use grep for searching - DO NOT read entire files!
**NOTE**: Do NOT use multi-line bash constructs (for/if/while) - they fail.

1. **Parse arguments**
   Extract ring and topic from user input

2. **Validate ring**
   Must be: core, inner, middle, outer, or all

3. **Search using grep**:
   ```bash
   # For specific ring
   grep -rni "topic" memory-bank/{ring}/

   # For all rings
   grep -rni "topic" memory-bank/

   # Also search CLAUDE.md for core queries
   grep -ni "topic" CLAUDE.md
   ```

4. **Format results**:
   ```
   ╭──────────────────────────────────────────────────────────────╮
   │  Search Results: "authentication" in inner ring              │
   ├──────────────────────────────────────────────────────────────┤
   │  activeContext.md:45  - Task: Implement authentication       │
   │  activeContext.md:67  - Decision: Use JWT tokens             │
   │  progress.md:23       - Completed: Auth middleware           │
   ╰──────────────────────────────────────────────────────────────╯

   Found 3 matches in 2 files.
   ```

5. **Offer context**:
   If user wants more detail:
   - Use Read tool to show surrounding lines
   - Offer to navigate to specific file

6. **If no results**:
   ```
   No matches for "topic" in {ring} ring.

   Suggestions:
   - Try broader search terms
   - Search all rings: /kris-query all topic
   - Check spelling
   ```
