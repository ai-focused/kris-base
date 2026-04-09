# KRIS UI — Authoring & Usage Guide

> Reference for Claude and human authors. CLAUDE.md should point here for KRIS UI details.

## What is KRIS UI?

A local Flask web viewer for KRIS documentation. Browse rings, search docs, view interactive visualizations — all in the browser.

**Start**: `cd memory-bank/kris-ui && .venv/bin/python3 kris-ui.py`
**First time**: `cd memory-bank/kris-ui && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt && .venv/bin/python3 kris-ui.py`
**URL**: http://localhost:5111 (override with `KRIS_UI_PORT` env var)

---

## Markdown Authoring Rules

These rules ensure markdown renders well in KRIS UI:

| Rule | Details |
|------|---------|
| **Frontmatter** | Use `**Key**: Value` in the first 15 lines — KRIS UI extracts as metadata |
| **Headings** | H1 for title, H2 for sections, H3 for subsections. H2 drives section nav. |
| **Tables** | Always include header + separator row. Themed styling applied. |
| **Task lists** | `- [ ]` and `- [x]` render as styled checkboxes |
| **Code blocks** | Fenced with language hints — Pygments highlighting applied |
| **Internal links** | `[Link](other-file.md)` — KRIS UI intercepts and navigates in-app |
| **Ring links** | `[Middle Ring](memory-bank/middle/)` — navigates to ring view |
| **Token awareness** | Core ~15k, Inner ~30k, Middle ~50k/file. Estimate: `tokens = words x 1.3` |
| **File naming** | `kebab-case.md`, descriptive names, no spaces |

---

## Interactive Documentation

### How It Works

Any markdown file can be made interactive by adding YAML frontmatter:

```markdown
---
interactive: dependency-graph
---

# My Document
...
```

When KRIS UI loads this file, a toggle bar appears: `[Source | Dependency Graph]`. The user can switch between the rendered markdown and the interactive visualization. "Open in new tab" opens the visualization fullscreen.

### Multiple Templates

A document can support multiple interactive views:

```markdown
---
interactive:
  - dependency-graph
  - flow-diagram
---
```

This shows: `[Source | Dependency Graph | Flow Diagram | ↗]`

### Available Templates

#### `dependency-graph`

Renders modules as an interactive node graph with dependency edges.

**Required section**: `## Modules` with `### Module Name` sub-headings.

Each module needs these fields as bullet points:

```markdown
### Module Name

- **ID**: `kebab-case-id`
- **Purpose**: One-line description
- **Depends on**: Comma-separated module names, or `—` for none
- **Phase**: MVP or Post-MVP description
- **Container**: (optional) Deployment container
- **Notes**: (optional) Additional context
```

**Optional section**: `## User Flows` with `### Flow N: Flow Name`, a code block diagram, and a table:

```markdown
### Flow 1: User Registration

\`\`\`
[Landing] → [Sign Up] → [Verify Email] → [Dashboard]
\`\`\`

| Step | Screen | Module(s) | Phase |
|------|--------|-----------|-------|
| Landing | Marketing page | Web Shell | MVP |
| Sign Up | Registration form | Auth, Web Shell | MVP |
```

**Optional section**: `## Container Mapping` — table of containers to modules.

**Behaviors**: Auto-layout (entry points at top, dependencies below), click-to-select with dependency highlighting, detail panel, MVP/Post-MVP filter.

---

#### `flow-diagram`

Renders user flows as horizontal step sequences with module badges.

**Required section**: `## User Flows` (same format as above).

**Behaviors**: Each flow as a horizontal swimlane, step cards with module chips, click step for details, click module chip to highlight across all flows.

---

#### `entity-relationship`

Renders database tables as an interactive ER diagram with relationship lines and column details.

**Required section**: `## Tables` with `### table_name` sub-headings.

Each table needs a column table:

```markdown
### `users`

Optional description text.

| Column    | Type      | Constraints          | Notes            |
|-----------|-----------|----------------------|------------------|
| `id`      | `text`    | PK                   | cuid2            |
| `userId`  | `text`    | FK → users, CASCADE  | not null         |
| `email`   | `text`    | unique, not null     | Login identifier |

**Indexes**: `email` (unique)
```

**Optional section**: `## Relationship Summary` — table with Relationship, Type, Cascade columns. If missing, relationships are inferred from FK constraints.

**Optional section**: `## MVP vs Post-MVP` — table marking which tables are MVP vs Post-MVP.

**Behaviors**: Interactive ER diagram, click table for detail panel (columns, types, constraints, indexes, relationships), relationship lines with type labels (1:N, 1:1, N:M), cascade info, MVP/Post-MVP filter.

---

#### `timeline`

Renders milestones and completion history as an interactive vertical timeline.

**Required section**: `## Milestones` or `## Milestone Progress` with `### Milestone Name` sub-headings.

Each milestone can have: `**Status**`, `**Date**`, `**Progress**`, and `- [x]`/`- [ ]` task items.

**Optional section**: `## Completion History` — table with `Date`, `Task`, `Result` columns.

**Behaviors**: Vertical timeline with milestone nodes (green=complete, amber=in-progress, grey=planned), progress bars, expandable task lists, event history stream. Filter by status.

---

#### `kanban-board`

Renders task items as cards in status columns (To Do, In Progress, Done).

**Option A**: Explicit columns with `## Board` > `### Column Name` sub-sections containing `- [ ]`/`- [x]` items.

**Option B**: Auto-detect — scans all `- [ ]` (→ To Do) and `- [x]` (→ Done) items, groups by checkbox state. `## Section` headings become category labels on cards.

**Behaviors**: Card columns with count badges, category color coding, filter by category.

---

#### `comparison-matrix`

Renders markdown tables as interactive comparison grids with sorting and color coding.

**Required**: Any tables with 3+ columns. Each table becomes a sortable, interactive grid.

**Auto color coding**: Yes/True/High → green, No/False/Low → red, Partial/Medium → amber, numbers → blue.

**Behaviors**: Click column header to sort (asc/desc), click row to highlight, cell tooltips for full content. Multiple tables per document supported.

---

### Writing Interactive-Compatible Specs

When writing or updating specs in the Middle Ring, consider whether the content fits an interactive template:

| If the spec has... | Consider tagging with... |
|--------------------|--------------------------|
| Modules with dependencies, IDs, phases | `dependency-graph` |
| User flows with steps, screens, modules | `flow-diagram` |
| Database tables with columns, FKs, relationships | `entity-relationship` |
| Milestones with dates, progress, task checklists | `timeline` |
| Task items with `- [ ]` / `- [x]` checkboxes | `kanban-board` |
| Feature/option comparison tables (3+ columns) | `comparison-matrix` |
| Both modules AND flows | `interactive: [dependency-graph, flow-diagram]` |

**Key principles**:

1. **Markdown stays the source of truth** — the interactive view is just a different rendering
2. **Structure matters** — use the exact heading levels and field formats above
3. **Forgiving parsers** — missing optional fields are skipped, not errors
4. **The tag is opt-in** — remove the frontmatter and it's just a normal doc again

### When Updating Specs (`/kris-update`)

After working on specs that describe modules, architecture, or user flows, check if:

- The spec follows the structured format (H2 sections, H3 items, bullet-point fields)
- An `interactive` tag would be useful
- Existing interactive tags still match the content (e.g., if `## Modules` was removed, the `dependency-graph` tag should be removed too)

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1`-`4` | Jump to Core/Inner/Middle/Outer ring |
| `a` | Jump to activeContext.md |
| `p` | Jump to progress.md |
| `c` | Jump to CLAUDE.md |
| `/` or `Cmd+K` | Focus search |
| `↑` `↓` | Navigate file tree or search results |
| `Enter` | Open focused file / cycle search matches |
| `?` | Keyboard shortcuts help |

---

## Custom Interactive Docs (Escape Hatch)

For visualizations that don't fit any template, place standalone `.html` files in `<ring>/interactive/`. These appear in the Interactive listing and open in new tabs. They are fully self-contained — no template system involvement.

---

*KRIS UI v3.3 | Part of KRIS (Knowledge Rings Information System)*
