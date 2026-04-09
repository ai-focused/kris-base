# TASK
Search a specific KRIS ring for information matching a topic.

# INPUTS
- Argument 1: ring name (`core`, `inner`, `middle`, `outer`, or `all`)
- Argument 2: search topic (string)
- File system: `memory-bank/`, `CLAUDE.md`

# EXECUTION PATH
Prefer kris-mcp tools when available:
- `kris_search(ring, pattern)` → matches with file, line number, and surrounding context (capped at 50)

Fall back to grep via bash if kris-mcp is not registered. Output format identical.

# REQUIREMENTS

## 1. Parse Arguments
Extract ring and topic from user input.
IF ring is invalid → show error with valid options.

## 2. Search
Search for topic in the specified ring's `*.md` files.
IF ring is `all` → search all rings (exclude `memory-bank/kris-ui/`).
IF ring is `core` → also search `CLAUDE.md`.

Use grep or equivalent — do NOT read entire files.

## 3. Format Results

# OUTPUT FORMAT (STRICT)

```
╭──────────────────────────────────────────────────────────────╮
│  Search Results: "<topic>" in <ring> ring                    │
├──────────────────────────────────────────────────────────────┤
│  <file>:<line>  - <context excerpt>                          │
│  <file>:<line>  - <context excerpt>                          │
╰──────────────────────────────────────────────────────────────╯

Found <N> matches in <N> files.
```

IF no results:
```
No matches for "<topic>" in <ring> ring.

Suggestions:
- Try broader search terms
- Search all rings: run kris-query all <topic>
- Check spelling
```

# CONSTRAINTS
- Do NOT read full file contents — use search/grep only
- Exclude `memory-bank/kris-ui/` when searching `all`
- Limit results to 50 matches
