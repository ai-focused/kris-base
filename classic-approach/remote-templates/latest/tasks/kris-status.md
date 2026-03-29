# TASK
Analyze token usage across KRIS memory rings and report status.

# INPUTS
- File system under:
  - CLAUDE.md
  - memory-bank/
- Exclude: memory-bank/kris-ui/

# REQUIREMENTS

## MODE DETECTION
- If no argument → Overview Mode
- If argument provided → Detailed Mode for that ring
  Valid rings: core, inner, middle, outer

---

## OVERVIEW MODE

1. Compute word counts using:
   - CLAUDE.md
   - All *.md in memory-bank/ (excluding kris-ui)

2. Convert to tokens:
   tokens = words × 1.3

3. Aggregate per ring:
   - Core = CLAUDE.md + memory-bank/core/*.md
   - Inner = memory-bank/inner/*.md
   - Middle = memory-bank/middle/*.md
   - Outer = memory-bank/outer/*.md

4. Compare against budgets:
   - Core: 15,000
   - Inner: 30,000
   - Middle: 50,000 per file
   - Outer: unlimited

5. Assign status:
   - 🟢 < 60%
   - 🟡 60–80%
   - 🔴 > 80%

6. Output summary

## OUTPUT FORMAT (STRICT)

╭───────────────────────────────────────────────────────────╮
│  KRIS Ring Status                                         │
├───────────────────────────────────────────────────────────┤
│  📍 Core Ring:   <tokens> / 15,000 (<%>)  <icon>  <files> │
│  🔄 Inner Ring:  <tokens> / 30,000 (<%>)  <icon>  <files> │
│  📚 Middle Ring: <tokens> / 50,000        <icon>  <files> │
│  📦 Outer Ring:  <tokens> (archive)      📦  <files>      │
├───────────────────────────────────────────────────────────┤
│  Total: <tokens> tokens across <files> files              │
╰───────────────────────────────────────────────────────────╯

Add tip:
💡 Use /kris-status <ring> for per-file breakdown

---

## DETAILED MODE

1. List all *.md files in memory-bank/{ring}
2. Compute tokens per file
3. Sort descending by size

## OUTPUT FORMAT

╭───────────────────────────────────────────────────────────╮
│  <Ring> Ring - Detailed Status                            │
├───────────────────────────────────────────────────────────┤
│  <file>    <tokens> tokens  <icon>                        │
├───────────────────────────────────────────────────────────┤
│  Total: <tokens> / <budget> (<%>)                         │
╰───────────────────────────────────────────────────────────╯

## SPECIAL RULE
- For Middle Ring: evaluate each file against 50k limit individually

---

## OVER-BUDGET ACTIONS
- Core → move to Inner
- Inner → archive to Outer
- Middle → split file

# CONSTRAINTS
- Do NOT read full file contents
- Use metadata only (word counts)
- Exclude memory-bank/kris-ui/
