# Flow Diagram — Markdown Format

This template renders user flows as horizontal step sequences with module attribution.

## Required Section: `## User Flows`

Each flow is `### Flow N: Flow Name` with a code block diagram and a table:

```markdown
### Flow 1: User Registration

\`\`\`
[Landing] → [Sign Up] → [Verify Email] → [Dashboard]
\`\`\`

| Step | Screen | Module(s) | Phase |
|------|--------|-----------|-------|
| Landing | Marketing page | Web Shell | MVP |
| Sign Up | Registration form | Auth, Web Shell | MVP |
| Verify Email | Email verification | Auth, Email Service | MVP |
| Dashboard | Main dashboard | Dashboard, Auth | MVP |
```

### Fields

- **Step**: Step name (matches the code block diagram)
- **Screen**: Description of the screen/page
- **Module(s)**: Comma-separated module names involved in this step
- **Phase**: MVP or Post-MVP
