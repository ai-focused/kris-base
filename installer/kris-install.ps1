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

$KRIS_UI_DIR = "memory-bank\kris-ui"
$KRIS_UI_FILES = @(
    "kris-ui.py",
    "requirements.txt",
    "templates/index.html",
    "static/css/style.css",
    "static/js/kris-ui.js"
)

# Create directory structure
New-Item -ItemType Directory -Force -Path "$KRIS_UI_DIR\templates" | Out-Null
New-Item -ItemType Directory -Force -Path "$KRIS_UI_DIR\static\css" | Out-Null
New-Item -ItemType Directory -Force -Path "$KRIS_UI_DIR\static\js" | Out-Null

$kris_ui_ok = $true
foreach ($file in $KRIS_UI_FILES) {
    $url = "$GITHUB_RAW_ROOT/kris-ui/$file"
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
Write-Host "     cd memory-bank\kris-ui; python -m venv .venv; .venv\Scripts\pip install -r requirements.txt; .venv\Scripts\python kris-ui.py" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Remember: All choices can be changed later via prompting or" -ForegroundColor Green
Write-Host "  by editing the generated files directly."
Write-Host ""
Write-Host "────────────────────────────────────────────────────────────────" -ForegroundColor Cyan
Write-Host "  Need help? Visit: https://github.com/ai-focused/kris-base"
Write-Host "────────────────────────────────────────────────────────────────" -ForegroundColor Cyan
Write-Host ""
