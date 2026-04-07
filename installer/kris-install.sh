#!/bin/bash

# KRIS Installer Script
# Version: 1.0
# Downloads KRIS scaffolder and prepares for Claude Code installation

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# GitHub raw URL base
GITHUB_RAW_BASE="https://raw.githubusercontent.com/ai-focused/kris-base/main/classic-approach"
GITHUB_RAW_ROOT="https://raw.githubusercontent.com/ai-focused/kris-base/main"

# Clear screen and show banner
clear
echo -e "${GREEN}"
cat << 'EOF'
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
EOF
echo -e "${NC}"

# What is KRIS
echo -e "${CYAN}${BOLD}What is KRIS?${NC}"
echo ""
echo -e "KRIS gives AI assistants ${BOLD}persistent memory${NC} across sessions."
echo -e "Instead of starting fresh each time, Claude will remember your project's"
echo -e "context, decisions, and progress."
echo ""
echo -e "Documentation is organized in ${BOLD}four concentric rings${NC}:"
echo ""
echo -e "  ${GREEN}📍 Core Ring${NC}    → Quick reference, project identity (~15k tokens)"
echo -e "  ${BLUE}🔄 Inner Ring${NC}   → Active work, current progress (~30k tokens)"
echo -e "  ${YELLOW}📚 Middle Ring${NC}  → System docs, architecture (~50k/file)"
echo -e "  ${RED}📦 Outer Ring${NC}   → Archive, historical docs (unlimited)"
echo ""

# Credits
echo -e "${CYAN}────────────────────────────────────────────────────────────────${NC}"
echo -e "  Created by: ${BOLD}Alexandru Negrila${NC} (alex@scaledagile.pro)"
echo -e "  Repository: ${BOLD}https://github.com/ai-focused/kris-base${NC}"
echo -e "${CYAN}────────────────────────────────────────────────────────────────${NC}"
echo ""

# Preparation heads-up
echo -e "${YELLOW}${BOLD}Before You Begin${NC}"
echo -e "${YELLOW}────────────────────────────────────────────────────────────────${NC}"
echo ""
echo -e "For the smoothest setup, consider preparing the following information:"
echo ""
echo -e "  ${BOLD}Required:${NC}"
echo -e "    • Project name"
echo -e "    • One-line description"
echo -e "    • Detailed description (2-3 sentences)"
echo -e "    • Target audience"
echo ""
echo -e "  ${BOLD}Optional (Claude can help identify):${NC}"
echo -e "    • Project type (web-app, cli, library, etc.)"
echo -e "    • Tech stack (language, framework, database)"
echo -e "    • UI/Design preferences"
echo -e "    • Development workflow"
echo ""
echo -e "  ${GREEN}TIP:${NC} You can prepare a ${BOLD}project-brief.txt${NC} file with this info,"
echo -e "       or let Claude guide you through the questionnaire."
echo ""
echo -e "  ${GREEN}NOTE:${NC} All choices can be changed later, either manually or by"
echo -e "        asking Claude to update them via prompting."
echo ""

# Version selection
echo -e "${CYAN}${BOLD}Select Version${NC}"
echo -e "${CYAN}────────────────────────────────────────────────────────────────${NC}"
echo ""
echo -e "  ${BOLD}1)${NC} ${GREEN}stable${NC}  - Recommended for most users (tested, reliable)"
echo -e "  ${BOLD}2)${NC} ${YELLOW}latest${NC}  - Bleeding edge (may have experimental features)"
echo ""
read -p "Enter choice [1/2] (default: 1): " version_choice

case $version_choice in
    2)
        VERSION="latest"
        echo -e "\n${YELLOW}Selected: latest${NC}"
        ;;
    *)
        VERSION="stable"
        echo -e "\n${GREEN}Selected: stable${NC}"
        ;;
esac

# Check for existing CLAUDE.md
if [ -f "CLAUDE.md" ]; then
    echo ""
    echo -e "${YELLOW}${BOLD}Warning:${NC} CLAUDE.md already exists in this directory."
    read -p "Overwrite? [y/N]: " overwrite
    if [[ ! $overwrite =~ ^[Yy]$ ]]; then
        echo -e "${RED}Installation cancelled.${NC}"
        exit 1
    fi
    # Backup existing file
    backup_name="CLAUDE.md.backup-$(date +%Y%m%d-%H%M%S)"
    mv CLAUDE.md "$backup_name"
    echo -e "${GREEN}Backed up existing CLAUDE.md to ${backup_name}${NC}"
fi

# Download scaffolder
echo ""
echo -e "${CYAN}Downloading KRIS scaffolder (${VERSION})...${NC}"

SCAFFOLDER_URL="${GITHUB_RAW_BASE}/scaffolder/${VERSION}/CLAUDE.md"

if command -v curl &> /dev/null; then
    if curl -fsSL "$SCAFFOLDER_URL" -o CLAUDE.md 2>/dev/null; then
        echo -e "${GREEN}✓ Scaffolder downloaded successfully${NC}"
    else
        echo -e "${RED}✗ Failed to download from GitHub.${NC}"
        echo -e "${YELLOW}The repository may not be configured yet.${NC}"
        echo ""
        echo -e "Please ensure the scaffolder is available at:"
        echo -e "  ${SCAFFOLDER_URL}"
        echo ""
        echo -e "Or copy the scaffolder manually from the KRIS-Base repository."
        exit 1
    fi
elif command -v wget &> /dev/null; then
    if wget -q "$SCAFFOLDER_URL" -O CLAUDE.md 2>/dev/null; then
        echo -e "${GREEN}✓ Scaffolder downloaded successfully${NC}"
    else
        echo -e "${RED}✗ Failed to download from GitHub.${NC}"
        exit 1
    fi
else
    echo -e "${RED}Error: Neither curl nor wget found. Please install one.${NC}"
    exit 1
fi

# Download KRIS UI
echo ""
echo -e "${CYAN}Downloading KRIS UI...${NC}"

KRIS_UI_DIR="memory-bank/kris-ui"
KRIS_UI_FILES=(
    "kris-ui.py"
    "kris-ui.md"
    "requirements.txt"
    "templates/index.html"
    "static/css/style.css"
    "static/css/interactive-base.css"
    "static/js/kris-ui.js"
    "static/js/interactive-base.js"
    "templates/interactive/base.html"
    "templates/interactive/dependency-graph/manifest.json"
    "templates/interactive/dependency-graph/template.html"
    "templates/interactive/dependency-graph/format.md"
    "templates/interactive/flow-diagram/manifest.json"
    "templates/interactive/flow-diagram/template.html"
    "templates/interactive/flow-diagram/format.md"
    "templates/interactive/entity-relationship/manifest.json"
    "templates/interactive/entity-relationship/template.html"
    "templates/interactive/entity-relationship/format.md"
    "static/img/kris-logo.png"
    "static/img/favicon.ico"
    "templates/interactive/timeline/manifest.json"
    "templates/interactive/timeline/template.html"
    "templates/interactive/timeline/format.md"
    "templates/interactive/kanban-board/manifest.json"
    "templates/interactive/kanban-board/template.html"
    "templates/interactive/kanban-board/format.md"
    "templates/interactive/comparison-matrix/manifest.json"
    "templates/interactive/comparison-matrix/template.html"
    "templates/interactive/comparison-matrix/format.md"
    "sync.py"
    "static/css/kris-sync.css"
    "static/js/kris-sync.js"
)

# Create directory structure
mkdir -p "$KRIS_UI_DIR/templates/interactive/dependency-graph" "$KRIS_UI_DIR/templates/interactive/flow-diagram" "$KRIS_UI_DIR/templates/interactive/entity-relationship" "$KRIS_UI_DIR/templates/interactive/timeline" "$KRIS_UI_DIR/templates/interactive/kanban-board" "$KRIS_UI_DIR/templates/interactive/comparison-matrix" "$KRIS_UI_DIR/static/css" "$KRIS_UI_DIR/static/js" "$KRIS_UI_DIR/static/img"

kris_ui_ok=true
for file in "${KRIS_UI_FILES[@]}"; do
    url="${GITHUB_RAW_ROOT}/kris-ui/${file}"
    dest="${KRIS_UI_DIR}/${file}"
    if command -v curl &> /dev/null; then
        curl -fsSL "$url" -o "$dest" 2>/dev/null || { echo -e "${RED}  ✗ Failed: ${file}${NC}"; kris_ui_ok=false; }
    elif command -v wget &> /dev/null; then
        wget -q "$url" -O "$dest" 2>/dev/null || { echo -e "${RED}  ✗ Failed: ${file}${NC}"; kris_ui_ok=false; }
    fi
done

if $kris_ui_ok; then
    echo -e "${GREEN}✓ KRIS UI downloaded (${#KRIS_UI_FILES[@]} files)${NC}"
else
    echo -e "${YELLOW}⚠ Some KRIS UI files failed to download. You can re-run the installer later.${NC}"
fi

# Download KRIS Tasks (for multi-agent support)
echo ""
echo -e "${CYAN}Downloading KRIS Tasks...${NC}"

KRIS_TASKS_DIR=".kris/tasks"
KRIS_TASK_FILES=(
    "kris.md"
    "kris-status.md"
    "kris-update.md"
    "kris-upgrade.md"
    "kris-archive.md"
    "kris-compact.md"
    "kris-query.md"
)

mkdir -p "$KRIS_TASKS_DIR"

kris_tasks_ok=true
for file in "${KRIS_TASK_FILES[@]}"; do
    url="${GITHUB_RAW_BASE}/remote-templates/${VERSION}/tasks/${file}"
    dest="${KRIS_TASKS_DIR}/${file}"
    if command -v curl &> /dev/null; then
        curl -fsSL "$url" -o "$dest" 2>/dev/null || { echo -e "${RED}  ✗ Failed: ${file}${NC}"; kris_tasks_ok=false; }
    elif command -v wget &> /dev/null; then
        wget -q "$url" -O "$dest" 2>/dev/null || { echo -e "${RED}  ✗ Failed: ${file}${NC}"; kris_tasks_ok=false; }
    fi
done

if $kris_tasks_ok; then
    echo -e "${GREEN}✓ KRIS Tasks downloaded (${#KRIS_TASK_FILES[@]} files)${NC}"
else
    echo -e "${YELLOW}⚠ Some task files failed to download.${NC}"
fi

# Download Claude Code commands
echo ""
echo -e "${CYAN}Downloading KRIS Commands (Claude Code)...${NC}"

COMMANDS_DIR=".claude/commands"
mkdir -p "$COMMANDS_DIR"

kris_cmds_ok=true
for file in "${KRIS_TASK_FILES[@]}"; do
    url="${GITHUB_RAW_BASE}/remote-templates/${VERSION}/commands/${file}"
    dest="${COMMANDS_DIR}/${file}"
    if command -v curl &> /dev/null; then
        curl -fsSL "$url" -o "$dest" 2>/dev/null || { echo -e "${RED}  ✗ Failed: ${file}${NC}"; kris_cmds_ok=false; }
    elif command -v wget &> /dev/null; then
        wget -q "$url" -O "$dest" 2>/dev/null || { echo -e "${RED}  ✗ Failed: ${file}${NC}"; kris_cmds_ok=false; }
    fi
done

if $kris_cmds_ok; then
    echo -e "${GREEN}✓ KRIS Commands downloaded (${#KRIS_TASK_FILES[@]} files)${NC}"
else
    echo -e "${YELLOW}⚠ Some command files failed to download.${NC}"
fi

# Download AGENTS.md (non-destructive)
echo ""
echo -e "${CYAN}Setting up AGENTS.md...${NC}"

AGENTS_URL="${GITHUB_RAW_BASE}/remote-templates/${VERSION}/AGENTS.md.base"

if [ -f "AGENTS.md" ]; then
    if grep -q "KRIS" AGENTS.md 2>/dev/null; then
        echo -e "${GREEN}✓ AGENTS.md already has KRIS configuration${NC}"
    else
        # Prepend KRIS block to existing AGENTS.md
        if command -v curl &> /dev/null; then
            curl -fsSL "$AGENTS_URL" -o .kris-agents-block.tmp 2>/dev/null
        elif command -v wget &> /dev/null; then
            wget -q "$AGENTS_URL" -O .kris-agents-block.tmp 2>/dev/null
        fi
        if [ -f ".kris-agents-block.tmp" ] && [ -s ".kris-agents-block.tmp" ]; then
            { cat .kris-agents-block.tmp; echo ""; echo "---"; echo ""; cat AGENTS.md; } > .kris-agents-merged.tmp
            mv .kris-agents-merged.tmp AGENTS.md
            rm -f .kris-agents-block.tmp
            echo -e "${GREEN}✓ KRIS block prepended to existing AGENTS.md${NC}"
        fi
    fi
else
    if command -v curl &> /dev/null; then
        curl -fsSL "$AGENTS_URL" -o AGENTS.md 2>/dev/null && echo -e "${GREEN}✓ AGENTS.md created${NC}"
    elif command -v wget &> /dev/null; then
        wget -q "$AGENTS_URL" -O AGENTS.md 2>/dev/null && echo -e "${GREEN}✓ AGENTS.md created${NC}"
    fi
fi

# Success message and next steps
echo ""
echo -e "${GREEN}${BOLD}╭──────────────────────────────────────────────────────────────╮${NC}"
echo -e "${GREEN}${BOLD}│                    Installation Complete!                     │${NC}"
echo -e "${GREEN}${BOLD}╰──────────────────────────────────────────────────────────────╯${NC}"
echo ""
echo -e "${BOLD}Next Steps:${NC}"
echo ""
echo -e "  1. Launch Claude Code in this directory:"
echo ""
echo -e "     ${CYAN}${BOLD}claude \"install KRIS\"${NC}"
echo ""
echo -e "  2. Claude will:"
echo -e "     • Auto-detect your project (if existing files found)"
echo -e "     • Guide you through the setup questionnaire"
echo -e "     • Help you choose the best options for your project"
echo -e "     • Create the complete KRIS structure"
echo ""
echo -e "  ${GREEN}KRIS UI:${NC} After setup, start the visual doc browser with:"
echo -e "     ${CYAN}cd memory-bank/kris-ui && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt && .venv/bin/python3 kris-ui.py${NC}"
echo ""
echo -e "  ${GREEN}Remember:${NC} All choices can be changed later via prompting or"
echo -e "  by editing the generated files directly."
echo ""
echo -e "${CYAN}────────────────────────────────────────────────────────────────${NC}"
echo -e "  Need help? Visit: ${BOLD}https://github.com/ai-focused/kris-base${NC}"
echo -e "${CYAN}────────────────────────────────────────────────────────────────${NC}"
echo ""
