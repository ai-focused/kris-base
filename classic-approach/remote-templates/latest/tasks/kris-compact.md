# TASK
Analyze ring content for optimization opportunities and execute approved actions.

**NOTE**: Exclude `memory-bank/kris-ui/` from all analysis.

# INPUTS
- All `*.md` files in `memory-bank/` (excluding `kris-ui/`)
- `CLAUDE.md`
- Token budgets: Core 15k, Inner 30k, Middle 50k/file, Outer unlimited

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
- Exclude `memory-bank/kris-ui/` from analysis
- Do NOT compact structured sections that interactive templates depend on (## Modules, ## Tables, ## User Flows)
