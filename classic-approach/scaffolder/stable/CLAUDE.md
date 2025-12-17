# KRIS Project Setup

> **Scaffolder Version**: v2.4 (Windows Support)
> This file will guide you through setting up KRIS for your project.

---

## What is KRIS?

**KRIS** (Knowledge Rings Information System) is a documentation structure that gives AI assistants persistent memory across sessions. Instead of starting fresh each time, Claude will remember your project's context, decisions, and progress.

### How It Works

KRIS organizes documentation in **four concentric rings**, each with a specific purpose and token budget:

```
╭─────────────────────────────────────────────────────────────────╮
│                        OUTER RING (Archive)                      │
│     Historical docs, completed milestones (unlimited tokens)     │
│   ╭─────────────────────────────────────────────────────────╮   │
│   │                  MIDDLE RING (System)                    │   │
│   │     Architecture, APIs, detailed docs (50k/file)         │   │
│   │   ╭─────────────────────────────────────────────────╮   │   │
│   │   │               INNER RING (Active)                │   │   │
│   │   │    Current work, progress, decisions (30k)       │   │   │
│   │   │   ╭─────────────────────────────────────────╮   │   │   │
│   │   │   │          CORE RING (Entry)              │   │   │   │
│   │   │   │    CLAUDE.md + core files (15k)         │   │   │   │
│   │   │   ╰─────────────────────────────────────────╯   │   │   │
│   │   ╰─────────────────────────────────────────────────╯   │   │
│   ╰─────────────────────────────────────────────────────────╯   │
╰─────────────────────────────────────────────────────────────────╯
```

### Benefits

- **Persistent Context**: Claude remembers your project across sessions
- **Organized Documentation**: Everything has its place
- **Efficient Token Usage**: Only load what's needed
- **Easy Navigation**: Find information quickly
- **KRIS Commands**: Built-in slash commands to manage your documentation
- **Auto-Detection**: Automatically detects existing projects and pre-fills answers
- **Claude Persona**: Senior Fullstack Engineer with Security Specialist mindset

---

## Let's Set Up Your Project

Answer the following questions and I'll create your KRIS structure.

> **NOTE**: All choices can be changed later - either by editing files manually or by asking Claude to update them via prompting. Don't worry about getting everything perfect!

---

## Step 1: Project Identity

*These questions require answers - they define your project.*

### 1.1 Project Name
> What is your project called?

**Your answer**: _____

### 1.2 One-Line Description
> Describe your project in one sentence (what does it do?)

**Your answer**: _____

### 1.3 Detailed Description
> Describe what the project does in 2-3 sentences. Include the main problem it solves.

**Your answer**: _____

### 1.4 Target Audience
> Who will use this? (e.g., developers, end-users, businesses, internal team)

**Your answer**: _____

---

## Step 2: Project Type

### 2.1 What type of project is this?

Options: `web-app` | `mobile-app` | `cli` | `library` | `api-service` | `desktop-app` | `other`

> Answer "not sure" and Claude will suggest options based on your description

**Your answer**: _____

### 2.2 Does it have a user interface?

Options: `yes` | `no` | `not sure`

**Your answer**: _____

---

## Step 3: UI & Design

*Skip this section if you answered "no" to 2.2*

### 3.1 Design style preference?

Options: `minimal` | `material` | `playful` | `professional` | `custom` | `not sure`

**Your answer**: _____

### 3.2 Primary color theme?

> e.g., "blue", "#3B82F6", "dark mode", or "not sure"

**Your answer**: _____

### 3.3 Responsive requirements?

Options: `mobile-first` | `desktop-first` | `both` | `not applicable` | `not sure`

**Your answer**: _____

---

## Step 4: Tech Stack

### 4.1 Primary programming language(s)?

> e.g., "TypeScript", "Python", "Go", or "not sure"

**Your answer**: _____

### 4.2 Framework(s)?

> e.g., "React + Next.js", "FastAPI", "Express", or "not sure"

**Your answer**: _____

### 4.3 Database?

Options: `postgresql` | `mysql` | `mongodb` | `sqlite` | `redis` | `supabase` | `firebase` | `none` | `other` | `not sure`

**Your answer**: _____

### 4.4 Key dependencies?

> List important libraries/tools, comma-separated, or "not sure"

**Your answer**: _____

---

## Step 5: Development Workflow

### 5.1 Version control workflow?

Options: `git-flow` | `trunk-based` | `feature-branches` | `none` | `not sure`

**Your answer**: _____

### 5.2 Testing approach?

Options: `tdd` | `tests-after` | `minimal` | `none` | `not sure`

**Your answer**: _____

### 5.3 Deployment target?

Options: `vercel` | `aws` | `gcp` | `azure` | `heroku` | `self-hosted` | `docker` | `none-yet` | `other` | `not sure`

**Your answer**: _____

---

## Step 6: Documentation Preferences

### 6.1 How often should context be updated?

Options: `every-session` | `daily` | `weekly` | `milestone-based` | `not sure`

**Your answer**: _____

### 6.2 Code commenting style preference?

Options: `minimal` | `moderate` | `detailed` | `not sure`

**Your answer**: _____

---

## Ready to Generate?

Once you've answered the questions above, tell me:
- **"generate"** - to create the KRIS structure
- **"review"** - to review your answers first
- **"help"** - if you have questions about any field

I'll validate your answers, help fill in any "not sure" responses, and create your complete KRIS documentation structure including KRIS slash commands.

> **Remember**: All choices can be changed later via prompting or by editing files directly!

---

## KRIS Credits

╭──────────────────────────────────────────────────────────────╮
│  KRIS - Knowledge Rings Information System                   │
│  Created by: Alexandru Negrila (alex@scaledagile.pro)        │
│  Documentation: https://github.com/ai-focused/kris-base      │
│  Version: 2.4                                                │
╰──────────────────────────────────────────────────────────────╯

---

<!-- CLAUDE INSTRUCTIONS

## Overview
This is a KRIS scaffolder (v2.4 - Windows Support).
When opened, run PHASE 0 (OS detection + auto-detection) first, then guide user through questionnaire.

⚠️ All shell examples in this file use Unix/bash syntax.
   If SHELL_ENV is "windows", translate all commands to PowerShell before executing.

## Remote Template URLs
GITHUB_RAW_BASE = "https://raw.githubusercontent.com/ai-focused/kris-base/main/classic-approach/remote-templates/stable"

Files to fetch:
- ${GITHUB_RAW_BASE}/CLAUDE.md.base -> Final CLAUDE.md template
- ${GITHUB_RAW_BASE}/commands/kris.md
- ${GITHUB_RAW_BASE}/commands/kris-status.md
- ${GITHUB_RAW_BASE}/commands/kris-update.md
- ${GITHUB_RAW_BASE}/commands/kris-upgrade.md
- ${GITHUB_RAW_BASE}/commands/kris-archive.md
- ${GITHUB_RAW_BASE}/commands/kris-compact.md
- ${GITHUB_RAW_BASE}/commands/kris-query.md

---

## PHASE 0: OS DETECTION + AUTO-DETECTION (Run FIRST)

### Step 0: DETECT SHELL ENVIRONMENT

Before anything else, detect the operating system:

1. **Run detection command:**
   ```bash
   uname -s 2>/dev/null || echo "Windows"
   ```

2. **Determine SHELL_ENV:**
   - If output contains "Darwin" or "Linux" → SHELL_ENV = "unix"
   - If output contains "MINGW" or "MSYS" → SHELL_ENV = "unix" (Git Bash)
   - If command fails or returns "Windows" → SHELL_ENV = "windows"

3. **Confirm with user:**
   ```
   ╭──────────────────────────────────────────────────────────────╮
   │  🖥️  Shell Environment Detection                             │
   ├──────────────────────────────────────────────────────────────┤
   │  Detected: [unix/windows]                                    │
   │                                                              │
   │  Is this correct? (yes/no)                                   │
   ╰──────────────────────────────────────────────────────────────╯
   ```

4. **Store result** - Remember SHELL_ENV for the entire session.
   This will be written to CLAUDE.md as `**Current OS**: [unix/windows]`

---

### Step 1: Check if folder is empty
```bash
ls -la | head -20
```

### Step 2A: EMPTY FOLDER
If only CLAUDE.md exists or folder is empty:
1. Display: "📂 Empty project folder detected!"
2. Suggest project name from folder: `basename $(pwd)`
3. Show standard questionnaire (no pre-filled values)

### Step 2B: EXISTING PROJECT
If other files exist:
1. Display: "🔍 Existing project detected! Scanning..."
2. Run detection algorithm
3. Show questionnaire WITH pre-filled values

### Auto-Detection Algorithm

**Check for config files (priority order):**

| If exists...        | Type           | Extract from |
|---------------------|----------------|--------------|
| package.json        | Node.js/JS/TS  | name, description, deps |
| pyproject.toml      | Python         | name, description, deps |
| requirements.txt    | Python         | framework hints |
| Cargo.toml          | Rust           | name, description |
| go.mod              | Go             | module name |
| pom.xml             | Java (Maven)   | artifactId |
| composer.json       | PHP            | name, description |
| pubspec.yaml        | Dart/Flutter   | name, description |

**Framework detection from deps:**
- react/vue/angular/svelte -> Frontend, Has UI
- next/nuxt/remix -> Fullstack, Has UI
- express/fastify/@nestjs/core -> Backend, No UI
- django/flask/fastapi -> Python Web

**After detection, show:**
```
╭──────────────────────────────────────────────────────────────╮
│  🔍 Project Detection Results                                │
├──────────────────────────────────────────────────────────────┤
│  Name:        {detected_name}                                │
│  Type:        {project_type}                                 │
│  Language:    {language}                                     │
│  Framework:   {framework}                                    │
│  Has UI:      {yes/no}                                       │
╰──────────────────────────────────────────────────────────────╯

I've pre-filled the setup questions based on what I found.
Review and adjust if needed, then say "generate" to continue.
```

---

## VALIDATION RULES

### Required Fields (cannot be "not sure"):
- 1.1 Project Name
- 1.2 One-Line Description
- 1.3 Detailed Description
- 1.4 Target Audience

### Optional Fields:
All others. If "not sure", suggest values from:
1. Auto-detection results (first priority)
2. Project description analysis
3. Industry standards

---

## GENERATION PROCESS

When user says "generate":

### Step 1: VALIDATE
Check all required fields have answers. If missing, ask for them.

### Step 2: RESOLVE "NOT SURE"
For each "not sure", suggest 2-3 options. Get confirmation.

### Step 3: SHOW SUMMARY
Display all collected answers in a table. Ask:
"Does this look correct? Say 'yes' to proceed or tell me what to change."

### Step 4: CREATE DIRECTORIES
```bash
mkdir -p memory-bank/core
mkdir -p memory-bank/inner
mkdir -p memory-bank/middle
mkdir -p memory-bank/outer/archive
mkdir -p .claude/commands
```

### Step 5: CREATE README FILES (minimal, 5 lines each)

**memory-bank/README.md:**
```markdown
# Memory Bank | KRIS for {PROJECT_NAME}
KRIS documentation structure. Budget: Core 15k, Inner 30k, Middle 50k/file, Outer unlimited.
DO NOT modify READMEs - managed by KRIS.
[CLAUDE.md](../CLAUDE.md) | [Core](core/) | [Inner](inner/) | [Middle](middle/) | [Outer](outer/)
```

**memory-bank/core/README.md:**
```markdown
# Core Ring | KRIS for {PROJECT_NAME}
Quick reference (20% info for 80% of work). Budget: ~15k tokens.
DO NOT modify this README - managed by KRIS.
[Memory Bank](../README.md) | [Inner Ring](../inner/README.md)
```

**memory-bank/inner/README.md:**
```markdown
# Inner Ring | KRIS for {PROJECT_NAME}
Active work and progress tracking. Budget: ~30k tokens.
DO NOT modify this README - managed by KRIS.
[Core Ring](../core/README.md) | [Middle Ring](../middle/README.md)
```

**memory-bank/middle/README.md:**
```markdown
# Middle Ring | KRIS for {PROJECT_NAME}
System documentation, architecture, APIs. Budget: ~50k tokens per file.
DO NOT modify this README - managed by KRIS.
[Inner Ring](../inner/README.md) | [Outer Ring](../outer/README.md)
```

**memory-bank/outer/README.md:**
```markdown
# Outer Ring | KRIS for {PROJECT_NAME}
Archive for historical docs. Budget: Unlimited (query-only).
DO NOT modify this README - managed by KRIS.
[Middle Ring](../middle/README.md) | [Archive](archive/README.md)
```

**memory-bank/outer/archive/README.md:**
```markdown
# Archive | KRIS for {PROJECT_NAME}
Completed milestones and historical documentation. Organized by YYYY-MM/.
DO NOT modify this README - managed by KRIS.
[Outer Ring](../README.md)
```

### Step 6: CREATE CORE FILES

**memory-bank/core/projectBrief.md:**
```markdown
# Project Brief

**Project**: {PROJECT_NAME}
**Created**: {CURRENT_DATE}
**Last Updated**: {CURRENT_DATE}

## Overview
{DETAILED_DESCRIPTION}

## Goals
- [Primary goal]
- [Secondary goal]
- [Tertiary goal]

## Scope
### In Scope
- [What's included]

### Out of Scope
- [What's not included]

## Success Criteria
- [How we measure success]

---
*KRIS Core Ring | [CLAUDE.md](../../CLAUDE.md)*
```

**memory-bank/core/productContext.md:**
```markdown
# Product Context

**Project**: {PROJECT_NAME}
**Last Updated**: {CURRENT_DATE}

## Target Audience
{TARGET_AUDIENCE}

## Problem Statement
[What problem does this solve?]

## Value Proposition
[Why would someone use this?]

## User Experience Goals
- [UX goal 1]
- [UX goal 2]

## Key Features
1. [Feature 1]
2. [Feature 2]
3. [Feature 3]

---
*KRIS Core Ring | [CLAUDE.md](../../CLAUDE.md)*
```

**memory-bank/core/techContext.md:**
```markdown
# Tech Context

**Project**: {PROJECT_NAME}
**Last Updated**: {CURRENT_DATE}

## Tech Stack

| Category | Choice | Notes |
|----------|--------|-------|
| Type | {PROJECT_TYPE} | |
| Language | {PRIMARY_LANGUAGE} | |
| Framework | {FRAMEWORK} | |
| Database | {DATABASE} | |
| Deployment | {DEPLOYMENT_TARGET} | |

## Dependencies
{KEY_DEPENDENCIES}

## Development Setup
```bash
# Setup commands - fill in
```

## Architecture Notes
[High-level architecture decisions]

---
*KRIS Core Ring | [CLAUDE.md](../../CLAUDE.md)*
```

### Step 7: CREATE INNER FILES

**memory-bank/inner/activeContext.md:**
```markdown
# Active Context

**Last Updated**: {CURRENT_DATE}
**Current Phase**: Initial Setup
**Active Tasks**: 0 in progress

---

## What's Happening Now

*No active tasks yet.*

### Task Format:
- **Task**: [Name]
- **Status**: [Not Started | In Progress (X%) | Blocked | Complete]
- **Blockers**: [None | Description]
- **Next Steps**: [What's next]

---

## Recent Decisions

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| {CURRENT_DATE} | Set up KRIS | Persistent AI context | Foundation |

---

## Active Questions

- [ ] None yet

---

## Context for Next Session

**Where we left off**: KRIS setup complete.
**Next action**: Define initial tasks.

---
*KRIS Inner Ring | [CLAUDE.md](../../CLAUDE.md) | [progress.md](progress.md)*
```

**memory-bank/inner/progress.md:**
```markdown
# Progress Tracker

**Last Updated**: {CURRENT_DATE}
**Total Completed**: 0 tasks
**Current Phase**: Initial Setup

---

## Completed This Week

*No completed tasks yet.*

---

## Milestone Progress

### Milestone 1: Project Setup (100%)
- [x] KRIS structure created

### Milestone 2: [Next Milestone] (0%)
- [ ] Define your first tasks

---

## Completion History

### {CURRENT_MONTH_YEAR}
| Date | Task | Result |
|------|------|--------|
| {CURRENT_DATE} | KRIS Setup | Complete |

---

## Archive Triggers

Archive to Outer Ring when:
1. Milestone complete
2. Inner Ring > 30k tokens
3. Content > 30 days old
4. Phase transition

---
*KRIS Inner Ring | [activeContext.md](activeContext.md) | [Archive](../outer/archive/README.md)*
```

### Step 8: DOWNLOAD TEMPLATES (MANDATORY - DO NOT SKIP)

⚠️ CRITICAL: Use `curl -s` for ALL downloads. WebFetch WILL NOT work correctly for raw file content.

⛔ ANTI-PATTERN: NEVER create CLAUDE.md or command files from memory/scratch.
   ALWAYS download the templates first, modify them, then install.
   If you cannot download templates → STOP and inform user.
   If you create files without downloading → you have FAILED.

**8.1 Create temp directory:**
```bash
mkdir -p .kris-temp/commands
```

**8.2 Download CLAUDE.md.base:**
```bash
curl -s "https://raw.githubusercontent.com/ai-focused/kris-base/main/classic-approach/remote-templates/stable/CLAUDE.md.base" > .kris-temp/CLAUDE.md.base
```

**8.3 Download ALL command files:**
```bash
curl -s "https://raw.githubusercontent.com/ai-focused/kris-base/main/classic-approach/remote-templates/stable/commands/kris.md" > .kris-temp/commands/kris.md
curl -s "https://raw.githubusercontent.com/ai-focused/kris-base/main/classic-approach/remote-templates/stable/commands/kris-status.md" > .kris-temp/commands/kris-status.md
curl -s "https://raw.githubusercontent.com/ai-focused/kris-base/main/classic-approach/remote-templates/stable/commands/kris-update.md" > .kris-temp/commands/kris-update.md
curl -s "https://raw.githubusercontent.com/ai-focused/kris-base/main/classic-approach/remote-templates/stable/commands/kris-upgrade.md" > .kris-temp/commands/kris-upgrade.md
curl -s "https://raw.githubusercontent.com/ai-focused/kris-base/main/classic-approach/remote-templates/stable/commands/kris-archive.md" > .kris-temp/commands/kris-archive.md
curl -s "https://raw.githubusercontent.com/ai-focused/kris-base/main/classic-approach/remote-templates/stable/commands/kris-compact.md" > .kris-temp/commands/kris-compact.md
curl -s "https://raw.githubusercontent.com/ai-focused/kris-base/main/classic-approach/remote-templates/stable/commands/kris-query.md" > .kris-temp/commands/kris-query.md
```

**8.4 Verify downloads succeeded:**
```bash
wc -l .kris-temp/CLAUDE.md.base
ls -la .kris-temp/commands/
```

⚠️ If CLAUDE.md.base is < 50 lines, download FAILED. Show this message and STOP:
```
Unable to download templates from GitHub.

Manual installation:
1. Visit: https://github.com/ai-focused/kris-base/tree/main/classic-approach/remote-templates/stable
2. Download CLAUDE.md.base and all files in commands/
3. Place in your project and replace placeholders manually

Your current CLAUDE.md has NOT been modified.
```
DO NOT proceed with generation. DO NOT create files from scratch.

### Step 9: MODIFY CLAUDE.md.base LOCALLY

**9.1 Read the downloaded template:**
Use the Read tool on `.kris-temp/CLAUDE.md.base`

**9.2 Use Edit tool to replace placeholders in .kris-temp/CLAUDE.md.base:**
- {PROJECT_NAME} -> From 1.1
- {ONE_LINE_DESCRIPTION} -> From 1.2
- {TARGET_AUDIENCE} -> From 1.4
- {CURRENT_DATE} -> Today (YYYY-MM-DD)

### Step 10: MOVE FILES TO FINAL LOCATIONS

**10.1 Move commands:**
```bash
mv .kris-temp/commands/*.md .claude/commands/
```

**10.2 Replace scaffolder with final CLAUDE.md:**
```bash
mv .kris-temp/CLAUDE.md.base CLAUDE.md
```

**10.3 Cleanup:**
```bash
rm -rf .kris-temp
```

### Step 11: CONFIRM SUCCESS

Display:
```
╭──────────────────────────────────────────────────────────────╮
│  ✓ KRIS Installation Complete!                               │
╰──────────────────────────────────────────────────────────────╯

Created:
  📁 memory-bank/
     ├── core/ (projectBrief, productContext, techContext)
     ├── inner/ (activeContext, progress)
     ├── middle/
     └── outer/archive/
  📁 .claude/commands/ (7 KRIS commands)
  📄 CLAUDE.md

Available commands:
  /kris          - Show status and next steps
  /kris-status   - Check token usage
  /kris-upgrade  - Upgrade KRIS version

Next steps:
  1. Review CLAUDE.md
  2. Fill in projectBrief.md goals
  3. Start your first task!

Remember: All settings can be changed via prompting or direct edits.
```

---

## VARIABLE SUBSTITUTIONS

| Placeholder | Source |
|-------------|--------|
| {PROJECT_NAME} | Question 1.1 |
| {ONE_LINE_DESCRIPTION} | Question 1.2 |
| {DETAILED_DESCRIPTION} | Question 1.3 |
| {TARGET_AUDIENCE} | Question 1.4 |
| {PROJECT_TYPE} | Question 2.1 |
| {PRIMARY_LANGUAGE} | Question 4.1 |
| {FRAMEWORK} | Question 4.2 |
| {DATABASE} | Question 4.3 |
| {KEY_DEPENDENCIES} | Question 4.4 |
| {DEPLOYMENT_TARGET} | Question 5.3 |
| {CURRENT_DATE} | Today (YYYY-MM-DD) |
| {CURRENT_MONTH_YEAR} | Today (Month YYYY) |
| {SHELL_ENV} | From Step 0 (unix/windows) |

-->
