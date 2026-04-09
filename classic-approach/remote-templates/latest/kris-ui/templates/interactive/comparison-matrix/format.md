# Comparison Matrix — Markdown Format

This template renders markdown tables as interactive comparison grids.

## Required: Tables with 3+ columns

Any markdown table with at least 3 columns is rendered as an interactive grid:

```markdown
## Feature Comparison

| Feature     | Option A | Option B | Option C |
|-------------|----------|----------|----------|
| Speed       | Fast     | Medium   | Slow     |
| Cost        | $$$      | $$       | $        |
| Reliability | High     | High     | Medium   |
```

## Color coding (automatic)

The template auto-detects and color-codes these cell values:
- **Green**: Yes, True, Full, High, Complete, ✅, `[x]`
- **Red**: No, False, None, Low, ✗, ❌
- **Amber**: Partial, Medium, Limited, ⚠️
- **Blue**: numbers, percentages

## Multiple tables

If the document has multiple tables, each is rendered as a separate matrix. Use `## Section` headings to title them.

## Features

- Click column header to sort
- Click row to highlight
- Filter chips from column values
- Hover cell for full content if truncated
