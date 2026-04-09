# Kanban Board — Markdown Format

This template renders tasks as cards grouped in status columns.

## Option A: Explicit columns with `### Column Name`

```markdown
## Board

### To Do
- [ ] Design the API schema
- [ ] Write migration scripts

### In Progress
- [-] Implement auth middleware (70%)
- [-] Build dashboard UI (30%)

### Done
- [x] Set up KRIS
- [x] Create database schema
```

## Option B: Auto-detect from checkboxes

If no explicit columns exist, the template scans all `- [ ]` and `- [x]` items in the document and groups them:
- `- [ ]` items → **To Do** column
- `- [x]` items → **Done** column

## Optional: Categories

Group items under `## Category` headings to add color-coded labels to cards:

```markdown
## Backend
- [x] Auth module
- [ ] API endpoints

## Frontend
- [ ] Dashboard layout
- [x] Login page
```
