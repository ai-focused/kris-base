# Dependency Graph — Markdown Format

This template renders modules as an interactive node graph with dependency edges.

## Required Section: `## Modules`

Each module is an `### H3` heading inside `## Modules`:

```markdown
### Module Name

- **ID**: `kebab-case-id`
- **Purpose**: One-line description
- **Depends on**: Comma-separated module names, or `—` for none
- **Phase**: MVP or Post-MVP description
- **Container**: (optional) Deployment container name
- **Notes**: (optional) Additional context
- **Related spec**: (optional) Link to related doc
```

## Optional Section: `## User Flows`

Each flow is `### Flow N: Flow Name` with a code block diagram and a table:

```markdown
### Flow 1: Flow Name

\`\`\`
[Step A] → [Step B] → [Step C]
\`\`\`

| Step | Screen | Module(s) | Phase |
|------|--------|-----------|-------|
| Step A | Description | Module 1, Module 2 | MVP |
```

## Optional Section: `## Container Mapping`

Table mapping containers to modules:

```markdown
| Container | Modules | Notes |
|-----------|---------|-------|
| **Web** | Module A, Module B | Frontend |
```
