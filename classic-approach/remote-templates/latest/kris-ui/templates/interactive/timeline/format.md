# Timeline — Markdown Format

This template renders milestones and completion history as an interactive timeline.

## Option A: `## Milestones` section

```markdown
## Milestones

### Milestone Name
- **Status**: Complete | In Progress | Planned
- **Date**: 2026-03-24
- **Progress**: 100%
- [x] Completed task
- [ ] Pending task
```

## Option B: `## Milestone Progress` section (KRIS progress.md format)

```markdown
## Milestone Progress

### Milestone 1: Project Setup (100%)
- [x] KRIS structure created
- [x] Initial configuration

### Milestone 2: Core Features (60%)
- [x] Auth module
- [ ] Dashboard
```

## Optional: `## Completion History` table

```markdown
## Completion History

| Date | Task | Result |
|------|------|--------|
| 2026-03-24 | KRIS Setup | Complete |
| 2026-03-25 | Auth module | Complete |
```
