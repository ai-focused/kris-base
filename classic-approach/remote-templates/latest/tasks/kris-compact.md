# TASK
Analyze ring content for optimization opportunities and execute approved actions.

**NOTE**: Exclude `.kris/` from all analysis — it's the tooling home (kris-ui, kris-mcp, tasks, sync.json), not ring documentation. memory-bank/ is exclusively rings. kris-mcp handles these exclusions automatically.

# INPUTS
- All `*.md` files in `memory-bank/`
- `CLAUDE.md`
- Token budgets: Core 15k, Inner 30k, Middle 50k/file, Outer unlimited

# EXECUTION PATH
Prefer kris-mcp tools when available:
- `kris_status()` → identify over-budget rings without reading any files
- `kris_list(ring)` → enumerate files for per-file analysis
- `kris_read(file)` → read ONLY the candidates flagged for compaction
- `kris_write(file, compacted_content)` → apply approved compactions

Fall back to wc + Read + Edit if kris-mcp is not registered. MCP path only reads flagged files, not all files.

# REQUIREMENTS

## 1. Analyze Each Ring

### Core Ring
- Check for content that belongs in Inner Ring
- Identify outdated priorities in Current Focus
- Find duplicate information

### Inner Ring
- Find completed tasks ready to archive
- Identify stale context (>7 days unchanged)
- Find duplicate information across files
- Calculate potential token savings

### Middle Ring
- Identify outdated documentation
- Find files over 50k tokens that need splitting
- Check for duplicate content

## 2. Present Findings

```
╭──────────────────────────────────────────────────────────────╮
│  KRIS Optimization Report                                    │
├──────────────────────────────────────────────────────────────┤
│  Core Ring:                                                  │
│    • <N> items found — potential savings: ~<N> tokens         │
│                                                              │
│  Inner Ring:                                                 │
│    • <N> completed tasks ready to archive                    │
│    • <N> stale context items (>7 days)                       │
│    • Potential savings: ~<N> tokens                           │
│                                                              │
│  Middle Ring:                                                │
│    • <N> files approaching limit                              │
╰──────────────────────────────────────────────────────────────╯
```

## 3. Offer Actions
List recommended actions. Get user approval before executing.

## 4. Execute Approved Actions

# OUTPUT FORMAT (STRICT)

```
╭──────────────────────────────────────────────────────────────╮
│  ✓ Optimization Complete                                     │
├──────────────────────────────────────────────────────────────┤
│  Actions taken: <N>                                          │
│  Tokens saved: ~<N>                                          │
│  Items archived: <N>                                         │
╰──────────────────────────────────────────────────────────────╯
```

# CONSTRAINTS
- Do NOT read full file contents — use word counts and metadata
- Do NOT execute without user approval
- Exclude `.kris/` from analysis (tooling, not rings)
- Do NOT compact structured sections that interactive templates depend on (## Modules, ## Tables, ## User Flows)
