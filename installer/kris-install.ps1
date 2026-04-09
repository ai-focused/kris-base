# KRIS Installer Script for Windows PowerShell
# Version: 1.0
# Downloads KRIS scaffolder and prepares for Claude Code installation

$ErrorActionPreference = "Stop"

# GitHub raw URL base
$GITHUB_RAW_BASE = "https://raw.githubusercontent.com/ai-focused/kris-base/main/classic-approach"
$GITHUB_RAW_ROOT = "https://raw.githubusercontent.com/ai-focused/kris-base/main"

# Clear screen and show banner
Clear-Host
Write-Host @"
╭──────────────────────────────────────────────────────────────────────────╮
│                                                                          │
│   ██╗  ██╗██████╗ ██╗███████╗    ██╗███╗   ██╗███████╗████████╗ █████╗   │
│   ██║ ██╔╝██╔══██╗██║██╔════╝    ██║████╗  ██║██╔════╝╚══██╔══╝██╔══██╗  │
│   █████╔╝ ██████╔╝██║███████╗    ██║██╔██╗ ██║███████╗   ██║   ███████║  │
│   ██╔═██╗ ██╔══██╗██║╚════██║    ██║██║╚██╗██║╚════██║   ██║   ██╔══██║  │
│   ██║  ██╗██║  ██║██║███████║    ██║██║ ╚████║███████║   ██║   ██║  ██║  │
│   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚══════╝    ╚═╝╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝  ╚═╝  │
│                                                                          │
│            Knowledge Rings Information System - Installer                │
│                                                                          │
╰──────────────────────────────────────────────────────────────────────────╯
"@ -ForegroundColor Green

# What is KRIS
Write-Host "`nWhat is KRIS?" -ForegroundColor Cyan
Write-Host ""
Write-Host "KRIS gives AI assistants persistent memory across sessions."
Write-Host "Instead of starting fresh each time, Claude will remember your project's"
Write-Host "context, decisions, and progress."
Write-Host ""
Write-Host "Documentation is organized in four concentric rings:"
Write-Host ""
Write-Host "  📍 Core Ring    → Quick reference, project identity (~15k tokens)" -ForegroundColor Green
Write-Host "  🔄 Inner Ring   → Active work, current progress (~30k tokens)" -ForegroundColor Blue
Write-Host "  📚 Middle Ring  → System docs, architecture (~50k/file)" -ForegroundColor Yellow
Write-Host "  📦 Outer Ring   → Archive, historical docs (unlimited)" -ForegroundColor Red
Write-Host ""

# Credits
Write-Host "────────────────────────────────────────────────────────────────" -ForegroundColor Cyan
Write-Host "  Created by: Alexandru Negrila (alex@scaledagile.pro)"
Write-Host "  Repository: https://github.com/ai-focused/kris-base"
Write-Host "────────────────────────────────────────────────────────────────" -ForegroundColor Cyan
Write-Host ""

# Preparation heads-up
Write-Host "Before You Begin" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────────────────────────────" -ForegroundColor Yellow
Write-Host ""
Write-Host "For the smoothest setup, consider preparing the following information:"
Write-Host ""
Write-Host "  Required:"
Write-Host "    • Project name"
Write-Host "    • One-line description"
Write-Host "    • Detailed description (2-3 sentences)"
Write-Host "    • Target audience"
Write-Host ""
Write-Host "  Optional (Claude can help identify):"
Write-Host "    • Project type (web-app, cli, library, etc.)"
Write-Host "    • Tech stack (language, framework, database)"
Write-Host "    • UI/Design preferences"
Write-Host "    • Development workflow"
Write-Host ""
Write-Host "  TIP: You can prepare a project-brief.txt file with this info," -ForegroundColor Green
Write-Host "       or let Claude guide you through the questionnaire."
Write-Host ""
Write-Host "  NOTE: All choices can be changed later, either manually or by" -ForegroundColor Green
Write-Host "        asking Claude to update them via prompting."
Write-Host ""

# Version selection
Write-Host "Select Version" -ForegroundColor Cyan
Write-Host "────────────────────────────────────────────────────────────────" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1) stable  - Recommended for most users (tested, reliable)" -ForegroundColor Green
Write-Host "  2) latest  - Bleeding edge (may have experimental features)" -ForegroundColor Yellow
Write-Host ""
$version_choice = Read-Host "Enter choice [1/2] (default: 1)"

if ($version_choice -eq "2") {
    $VERSION = "latest"
    Write-Host "`nSelected: latest" -ForegroundColor Yellow
} else {
    $VERSION = "stable"
    Write-Host "`nSelected: stable" -ForegroundColor Green
}

# Check for existing CLAUDE.md
if (Test-Path "CLAUDE.md") {
    Write-Host ""
    Write-Host "Warning: CLAUDE.md already exists in this directory." -ForegroundColor Yellow
    $overwrite = Read-Host "Overwrite? [y/N]"
    if ($overwrite -notmatch "^[Yy]$") {
        Write-Host "Installation cancelled." -ForegroundColor Red
        exit 1
    }
    # Backup existing file
    $backup_name = "CLAUDE.md.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Move-Item "CLAUDE.md" $backup_name
    Write-Host "Backed up existing CLAUDE.md to $backup_name" -ForegroundColor Green
}

# Download scaffolder
Write-Host ""
Write-Host "Downloading KRIS scaffolder ($VERSION)..." -ForegroundColor Cyan

$SCAFFOLDER_URL = "$GITHUB_RAW_BASE/scaffolder/$VERSION/CLAUDE.md"

try {
    Invoke-WebRequest -Uri $SCAFFOLDER_URL -OutFile "CLAUDE.md" -UseBasicParsing
    Write-Host "✓ Scaffolder downloaded successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to download from GitHub." -ForegroundColor Red
    Write-Host "The repository may not be configured yet." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please ensure the scaffolder is available at:"
    Write-Host "  $SCAFFOLDER_URL"
    Write-Host ""
    Write-Host "Or copy the scaffolder manually from the KRIS-Base repository."
    exit 1
}

# Download KRIS UI
Write-Host ""
Write-Host "Downloading KRIS UI..." -ForegroundColor Cyan

# v3.7 latest moves tooling out of memory-bank/ into .kris/.
# Stable still uses memory-bank/ for backwards compatibility.
if ($VERSION -eq "latest") {
    $KRIS_UI_DIR = ".kris\kris-ui"
    $KRIS_MCP_DIR = ".kris\kris-mcp"
} else {
    $KRIS_UI_DIR = "memory-bank\kris-ui"
    $KRIS_MCP_DIR = "memory-bank\kris-mcp"
}
$KRIS_UI_FILES = @(
    "kris-ui.py",
    "kris-ui.md",
    "requirements.txt",
    "templates/index.html",
    "static/css/style.css",
    "static/css/interactive-base.css",
    "static/js/kris-ui.js",
    "static/js/interactive-base.js",
    "templates/interactive/base.html",
    "templates/interactive/dependency-graph/manifest.json",
    "templates/interactive/dependency-graph/template.html",
    "templates/interactive/dependency-graph/format.md",
    "templates/interactive/flow-diagram/manifest.json",
    "templates/interactive/flow-diagram/template.html",
    "templates/interactive/flow-diagram/format.md",
    "templates/interactive/entity-relationship/manifest.json",
    "templates/interactive/entity-relationship/template.html",
    "templates/interactive/entity-relationship/format.md",
    "static/img/kris-logo.png",
    "static/img/favicon.ico",
    "templates/interactive/timeline/manifest.json",
    "templates/interactive/timeline/template.html",
    "templates/interactive/timeline/format.md",
    "templates/interactive/kanban-board/manifest.json",
    "templates/interactive/kanban-board/template.html",
    "templates/interactive/kanban-board/format.md",
    "templates/interactive/comparison-matrix/manifest.json",
    "templates/interactive/comparison-matrix/template.html",
    "templates/interactive/comparison-matrix/format.md",
    "wirepulse.py",
    "static/css/kris-wirepulse.css",
    "static/js/kris-wirepulse.js"
)

# Create directory structure
New-Item -ItemType Directory -Force -Path "$KRIS_UI_DIR\templates\interactive\dependency-graph" | Out-Null
New-Item -ItemType Directory -Force -Path "$KRIS_UI_DIR\templates\interactive\flow-diagram" | Out-Null
New-Item -ItemType Directory -Force -Path "$KRIS_UI_DIR\templates\interactive\entity-relationship" | Out-Null
New-Item -ItemType Directory -Force -Path "$KRIS_UI_DIR\templates\interactive\timeline" | Out-Null
New-Item -ItemType Directory -Force -Path "$KRIS_UI_DIR\templates\interactive\kanban-board" | Out-Null
New-Item -ItemType Directory -Force -Path "$KRIS_UI_DIR\templates\interactive\comparison-matrix" | Out-Null
New-Item -ItemType Directory -Force -Path "$KRIS_UI_DIR\static\css" | Out-Null
New-Item -ItemType Directory -Force -Path "$KRIS_UI_DIR\static\js" | Out-Null
New-Item -ItemType Directory -Force -Path "$KRIS_UI_DIR\static\img" | Out-Null

$kris_ui_ok = $true
foreach ($file in $KRIS_UI_FILES) {
    $url = "$GITHUB_RAW_BASE/remote-templates/$VERSION/kris-ui/$file"
    $dest = "$KRIS_UI_DIR\$($file -replace '/', '\')"
    try {
        Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing
    } catch {
        Write-Host "  ✗ Failed: $file" -ForegroundColor Red
        $kris_ui_ok = $false
    }
}

if ($kris_ui_ok) {
    Write-Host "✓ KRIS UI downloaded ($($KRIS_UI_FILES.Count) files)" -ForegroundColor Green
} else {
    Write-Host "⚠ Some KRIS UI files failed to download. You can re-run the installer later." -ForegroundColor Yellow
}

# Download kris-mcp (MCP server for ring operations + WirePulse)
Write-Host ""
Write-Host "Downloading kris-mcp..." -ForegroundColor Cyan

# KRIS_MCP_DIR was set earlier based on $VERSION
$KRIS_MCP_FILES = @("kris-mcp.py", "requirements.txt")

New-Item -ItemType Directory -Force -Path $KRIS_MCP_DIR | Out-Null

$kris_mcp_ok = $true
foreach ($file in $KRIS_MCP_FILES) {
    $url = "$GITHUB_RAW_BASE/remote-templates/$VERSION/kris-mcp/$file"
    $dest = "$KRIS_MCP_DIR\$file"
    try {
        Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing
    } catch {
        Write-Host "  ✗ Failed: $file" -ForegroundColor Red
        $kris_mcp_ok = $false
    }
}

$kris_mcp_venv_ok = $false
if ($kris_mcp_ok) {
    Write-Host "✓ kris-mcp downloaded ($($KRIS_MCP_FILES.Count) files)" -ForegroundColor Green

    # Try to find a Python 3.10+ interpreter — kris-mcp needs it.
    $kris_mcp_py = $null
    foreach ($candidate in @("python3.13", "python3.12", "python3.11", "python3.10", "python", "python3")) {
        $cmd = Get-Command $candidate -ErrorAction SilentlyContinue
        if ($cmd) {
            $ver = & $candidate -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>$null
            if ($ver -match "^3\.(\d+)$" -and [int]$Matches[1] -ge 10) {
                $kris_mcp_py = $cmd.Source
                break
            }
        }
    }

    if ($kris_mcp_py) {
        Write-Host "  Creating kris-mcp venv ($kris_mcp_py)..." -ForegroundColor Cyan
        try {
            Push-Location $KRIS_MCP_DIR
            & $kris_mcp_py -m venv .venv 2>&1 | Out-Null
            & ".venv\Scripts\python.exe" -m pip install -q --upgrade pip 2>&1 | Out-Null
            & ".venv\Scripts\pip.exe" install -q -r requirements.txt 2>&1 | Out-Null
            Pop-Location
            if (Test-Path "$KRIS_MCP_DIR\.venv\Scripts\python.exe") {
                Write-Host "✓ kris-mcp venv ready" -ForegroundColor Green
                $kris_mcp_venv_ok = $true
            } else {
                Write-Host "⚠ kris-mcp venv creation failed — install later with:" -ForegroundColor Yellow
                Write-Host "    cd $KRIS_MCP_DIR; $kris_mcp_py -m venv .venv; .venv\Scripts\pip install -r requirements.txt" -ForegroundColor Yellow
            }
        } catch {
            Pop-Location -ErrorAction SilentlyContinue
            Write-Host "⚠ kris-mcp venv creation failed: $_" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠ Python 3.10+ not found — kris-mcp needs it. After installing:" -ForegroundColor Yellow
        Write-Host "    cd $KRIS_MCP_DIR; python -m venv .venv; .venv\Scripts\pip install -r requirements.txt" -ForegroundColor Yellow
    }

    # Register kris-mcp in .mcp.json (project root) ONLY if the venv is actually usable.
    # Claude Code reads project-scoped MCP servers from .mcp.json at the repo root —
    # NOT from .claude/settings.json.
    if ($kris_mcp_venv_ok) {
        $mcpJsonPath = ".mcp.json"
        try {
            if (Test-Path $mcpJsonPath) {
                $mcp = Get-Content $mcpJsonPath -Raw | ConvertFrom-Json
            } else {
                $mcp = [PSCustomObject]@{}
            }
            if (-not $mcp.PSObject.Properties.Match("mcpServers").Count) {
                $mcp | Add-Member -NotePropertyName "mcpServers" -NotePropertyValue ([PSCustomObject]@{})
            }
            if (-not $mcp.mcpServers.PSObject.Properties.Match("kris-mcp").Count) {
                $krisMcp = [PSCustomObject]@{
                    command = "$KRIS_MCP_DIR\.venv\Scripts\python.exe"
                    args    = @("$KRIS_MCP_DIR\kris-mcp.py")
                }
                $mcp.mcpServers | Add-Member -NotePropertyName "kris-mcp" -NotePropertyValue $krisMcp
                $mcp | ConvertTo-Json -Depth 10 | Set-Content $mcpJsonPath
                Write-Host "✓ kris-mcp registered in .mcp.json" -ForegroundColor Green
            } else {
                Write-Host "✓ kris-mcp already registered in .mcp.json" -ForegroundColor Green
            }
        } catch {
            Write-Host "⚠ Could not update .mcp.json — add kris-mcp manually" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  Skipping .mcp.json registration — venv not ready yet." -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ kris-mcp download failed. You can install it later from kris-base/kris-mcp." -ForegroundColor Yellow
}

# Download KRIS Tasks (for multi-agent support)
Write-Host ""
Write-Host "Downloading KRIS Tasks..." -ForegroundColor Cyan

$KRIS_TASKS_DIR = ".kris\tasks"
$KRIS_TASK_FILES = @(
    "kris.md",
    "kris-status.md",
    "kris-update.md",
    "kris-upgrade.md",
    "kris-archive.md",
    "kris-compact.md",
    "kris-query.md"
)

New-Item -ItemType Directory -Force -Path $KRIS_TASKS_DIR | Out-Null

$kris_tasks_ok = $true
foreach ($file in $KRIS_TASK_FILES) {
    $url = "$GITHUB_RAW_BASE/remote-templates/$VERSION/tasks/$file"
    $dest = "$KRIS_TASKS_DIR\$file"
    try {
        Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing
    } catch {
        Write-Host "  ✗ Failed: $file" -ForegroundColor Red
        $kris_tasks_ok = $false
    }
}

if ($kris_tasks_ok) {
    Write-Host "✓ KRIS Tasks downloaded ($($KRIS_TASK_FILES.Count) files)" -ForegroundColor Green
} else {
    Write-Host "⚠ Some task files failed to download." -ForegroundColor Yellow
}

# Download Claude Code commands
Write-Host ""
Write-Host "Downloading KRIS Commands (Claude Code)..." -ForegroundColor Cyan

$COMMANDS_DIR = ".claude\commands"
New-Item -ItemType Directory -Force -Path $COMMANDS_DIR | Out-Null

$kris_cmds_ok = $true
foreach ($file in $KRIS_TASK_FILES) {
    $url = "$GITHUB_RAW_BASE/remote-templates/$VERSION/commands/$file"
    $dest = "$COMMANDS_DIR\$file"
    try {
        Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing
    } catch {
        Write-Host "  ✗ Failed: $file" -ForegroundColor Red
        $kris_cmds_ok = $false
    }
}

if ($kris_cmds_ok) {
    Write-Host "✓ KRIS Commands downloaded ($($KRIS_TASK_FILES.Count) files)" -ForegroundColor Green
} else {
    Write-Host "⚠ Some command files failed to download." -ForegroundColor Yellow
}

# Download AGENTS.md (non-destructive)
Write-Host ""
Write-Host "Setting up AGENTS.md..." -ForegroundColor Cyan

$AGENTS_URL = "$GITHUB_RAW_BASE/remote-templates/$VERSION/AGENTS.md.base"

if (Test-Path "AGENTS.md") {
    if (Select-String -Path "AGENTS.md" -Pattern "KRIS" -Quiet) {
        Write-Host "✓ AGENTS.md already has KRIS configuration" -ForegroundColor Green
    } else {
        try {
            Invoke-WebRequest -Uri $AGENTS_URL -OutFile ".kris-agents-block.tmp" -UseBasicParsing
            $krisBlock = Get-Content ".kris-agents-block.tmp" -Raw
            $existing = Get-Content "AGENTS.md" -Raw
            "$krisBlock`n`n---`n`n$existing" | Set-Content "AGENTS.md"
            Remove-Item ".kris-agents-block.tmp" -Force
            Write-Host "✓ KRIS block prepended to existing AGENTS.md" -ForegroundColor Green
        } catch {
            Write-Host "⚠ Could not update AGENTS.md" -ForegroundColor Yellow
        }
    }
} else {
    try {
        Invoke-WebRequest -Uri $AGENTS_URL -OutFile "AGENTS.md" -UseBasicParsing
        Write-Host "✓ AGENTS.md created" -ForegroundColor Green
    } catch {
        Write-Host "⚠ Could not download AGENTS.md" -ForegroundColor Yellow
    }
}

# Add KRIS tooling entries to .gitignore (idempotent).
# KRIS tooling (.kris/, .claude/commands/kris*.md) is downloaded on install/upgrade —
# it's not project content and shouldn't be committed.
Write-Host ""
Write-Host "Updating .gitignore..." -ForegroundColor Cyan
if (-not (Test-Path ".gitignore")) {
    New-Item -ItemType File -Path ".gitignore" | Out-Null
}
$gitignoreContent = Get-Content .gitignore -Raw -ErrorAction SilentlyContinue
if (-not ($gitignoreContent -match "# KRIS tooling")) {
    $krisBlock = @"

# KRIS tooling — installed via kris-install.ps1 or /kris-upgrade
.kris/
.claude/commands/kris.md
.claude/commands/kris-*.md
"@
    Add-Content -Path .gitignore -Value $krisBlock
    Write-Host "✓ KRIS tooling entries added to .gitignore" -ForegroundColor Green
} else {
    Write-Host "✓ .gitignore already has KRIS tooling entries" -ForegroundColor Green
}

# Success message and next steps
Write-Host ""
Write-Host "╭──────────────────────────────────────────────────────────────╮" -ForegroundColor Green
Write-Host "│                    Installation Complete!                     │" -ForegroundColor Green
Write-Host "╰──────────────────────────────────────────────────────────────╯" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:"
Write-Host ""
Write-Host "  1. Launch Claude Code in this directory:"
Write-Host ""
Write-Host "     claude `"install KRIS`"" -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. Claude will:"
Write-Host "     • Auto-detect your project (if existing files found)"
Write-Host "     • Guide you through the setup questionnaire"
Write-Host "     • Help you choose the best options for your project"
Write-Host "     • Create the complete KRIS structure"
Write-Host ""
Write-Host "  KRIS UI: After setup, start the visual doc browser with:" -ForegroundColor Green
Write-Host "     cd $KRIS_UI_DIR; python -m venv .venv; .venv\Scripts\pip install -r requirements.txt; .venv\Scripts\python kris-ui.py" -ForegroundColor Cyan
Write-Host ""
if ($kris_mcp_venv_ok) {
    Write-Host "  kris-mcp: Registered in .mcp.json — Claude Code will load it on next session." -ForegroundColor Green
} else {
    Write-Host "  kris-mcp: Venv not ready. After installing Python 3.10+, run:" -ForegroundColor Yellow
    Write-Host "     cd $KRIS_MCP_DIR; python -m venv .venv; .venv\Scripts\pip install -r requirements.txt" -ForegroundColor Cyan
    Write-Host "     Then create .mcp.json at the repo root with the kris-mcp entry" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "  Remember: All choices can be changed later via prompting or" -ForegroundColor Green
Write-Host "  by editing the generated files directly."
Write-Host ""
Write-Host "────────────────────────────────────────────────────────────────" -ForegroundColor Cyan
Write-Host "  Need help? Visit: https://github.com/ai-focused/kris-base"
Write-Host "────────────────────────────────────────────────────────────────" -ForegroundColor Cyan
Write-Host ""
