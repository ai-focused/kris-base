Optimize ring content and suggest what to archive.

**NOTE**: Always exclude `.kris/` from analysis — it's the tooling home (kris-ui, kris-mcp, tasks, sync.json), not ring documentation. memory-bank/ is exclusively rings. (kris-mcp applies this exclusion automatically.)

## EXECUTION PATH

**Preferred (kris-mcp tools available):**
- `kris_status()` → identify over-budget rings without reading any files
- `kris_list(ring)` → enumerate files for per-file analysis
- `kris_read(file)` → read ONLY the candidate files for compaction (not all files)
- Present findings to user, get approval
- `kris_write(file, compacted_content)` → apply approved changes

**Fallback (kris-mcp not available):**
- Word counts via bash + Read + Edit tools (current behaviour)

MCP path eliminates the scan-everything cost — only flagged files are read.

## Instructions

1. **Analyze each ring**:

   **Core Ring:**
   - Check for content that belongs in Inner Ring
   - Identify outdated priorities in Current Focus
   - Find duplicate information
   - Suggest removals

   **Inner Ring:**
   - Find completed tasks ready to archive
   - Identify stale context (>7 days unchanged)
   - Find duplicate information across files
   - Calculate potential token savings

   **Middle Ring:**
   - Identify outdated documentation
   - Find files over 50k tokens that need splitting
   - Check for duplicate content

2. **Present findings**:
   ```
   ╭──────────────────────────────────────────────────────────────╮
   │  KRIS Optimization Report                                    │
   ├──────────────────────────────────────────────────────────────┤
   │  Core Ring:                                                  │
   │    • 2 outdated priorities in Current Focus                  │
   │    • Potential savings: ~500 tokens                          │
   │                                                              │
   │  Inner Ring:                                                 │
   │    • 5 completed tasks ready to archive                      │
   │    • 3 stale context items (>7 days)                         │
   │    • Potential savings: ~4,200 tokens                        │
   │                                                              │
   │  Middle Ring:                                                │
   │    • 1 file approaching limit (45k/50k)                      │
   │    • No outdated content found                               │
   ╰──────────────────────────────────────────────────────────────╯
   ```

3. **Offer actions**:
   ```
   Recommended actions:
   1. Archive completed tasks (saves ~3,000 tokens)
   2. Clean stale context (saves ~1,200 tokens)
   3. Update Current Focus priorities

   Apply all? [y/N] or select (1,2,3):
   ```

4. **Execute approved optimizations**

5. **Report results**:
   ```
   ╭──────────────────────────────────────────────────────────────╮
   │  ✓ Optimization Complete                                    │
   ├──────────────────────────────────────────────────────────────┤
   │  Actions taken: 3                                            │
   │  Tokens saved: ~4,200                                        │
   │  Items archived: 5                                           │
   ╰──────────────────────────────────────────────────────────────╯
   ```
