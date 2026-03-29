# Entity Relationship — Markdown Format

This template renders database tables as an interactive ER diagram with relationship lines.

## Required Section: `## Tables`

Each table is an `### table_name` heading with a column table:

```markdown
### `users`

Optional description text.

| Column    | Type      | Constraints          | Notes            |
|-----------|-----------|----------------------|------------------|
| `id`      | `text`    | PK                   | cuid2            |
| `email`   | `text`    | unique, not null     | Login identifier |
| `name`    | `text`    | nullable             | Display name     |

**Indexes**: `email` (unique)
```

### Column Table Format

- Header must include at least `Column` and `Type`
- `Constraints` and `Notes` columns are optional but recommended
- Column names should be in backticks
- FK references use format: `FK → table_name, CASCADE` or `FK → table_name, SET NULL`

## Optional Section: `## Relationship Summary`

Table of relationships between entities:

```markdown
| Relationship           | Type | Cascade           |
|------------------------|------|-------------------|
| users → accounts       | 1:N  | ON DELETE CASCADE |
| users → sessions       | 1:N  | ON DELETE CASCADE |
| users → org_members    | 1:N  | ON DELETE CASCADE |
```

If this section is missing, the template infers relationships from FK constraints in column tables.

## Optional Section: `## MVP vs Post-MVP`

Table marking which tables are MVP vs Post-MVP:

```markdown
| Table    | MVP | Post-MVP |
|----------|-----|----------|
| `users`  | Yes |          |
| `audits` |     | Yes      |
```
