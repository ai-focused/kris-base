Show token usage across all KRIS rings with visual status indicators.

Usage:
  /kris-status        - Overview of all rings with file counts
  /kris-status <ring> - Detailed per-file breakdown for specific ring
                        Valid rings: core, inner, middle, outer

## Instructions

**IMPORTANT**: Use terminal commands for metadata - DO NOT read entire files!

### Overview Mode (no argument)

1. **Get word counts**
   ```bash
   wc -w CLAUDE.md 2>/dev/null
   ```
   ```bash
   find memory-bank -name "*.md" -exec wc -w {} \;
   ```

2. **Calculate tokens per ring** (words x 1.3):
   - Core Ring = CLAUDE.md + memory-bank/core/*.md
   - Inner Ring = memory-bank/inner/*.md
   - Middle Ring = memory-bank/middle/*.md
   - Outer Ring = memory-bank/outer/*.md

3. **Compare against budgets**:
   - Core: 15,000 tokens
   - Inner: 30,000 tokens
   - Middle: 50,000 per file
   - Outer: Unlimited

4. **Display with indicators**:
   - 🟢 = Under 60% (healthy)
   - 🟡 = 60-80% (warning)
   - 🔴 = Over 80% (needs attention)

**Example output:**
```
╭───────────────────────────────────────────────────────────╮
│  KRIS Ring Status                                         │
├───────────────────────────────────────────────────────────┤
│  📍 Core Ring:   3,200 / 15,000 tokens (21%)  🟢  4 files │
│  🔄 Inner Ring:  5,400 / 30,000 tokens (18%)  🟢  2 files │
│  📚 Middle Ring: 8,100 / 50,000 tokens        🟢  1 file  │
│  📦 Outer Ring:  12,000 tokens (archive)      📦  3 files │
├───────────────────────────────────────────────────────────┤
│  Total: 28,700 tokens across 10 files                     │
╰───────────────────────────────────────────────────────────╯

💡 Tip: Use /kris-status <ring> for per-file breakdown
```

5. **If over budget**, suggest actions:
   - Core over: Move content to Inner Ring
   - Inner over: Archive to Outer Ring
   - Middle over: Split file

### Detailed Mode (with ring argument)

1. **Get per-file word counts**:
   ```bash
   find memory-bank/{ring} -name "*.md" -exec wc -w {} \;
   ```

2. **Calculate tokens per file** (words x 1.3)

3. **Sort by size** (largest first)

4. **Display breakdown**:
   ```
   ╭───────────────────────────────────────────────────────────╮
   │  Inner Ring - Detailed Status                             │
   ├───────────────────────────────────────────────────────────┤
   │  activeContext.md    3,200 tokens  🟢                     │
   │  progress.md         2,200 tokens  🟢                     │
   ├───────────────────────────────────────────────────────────┤
   │  Total: 5,400 / 30,000 tokens (18%)                       │
   ╰───────────────────────────────────────────────────────────╯
   ```

5. **For Middle Ring**, check individual file budgets (50k each)
