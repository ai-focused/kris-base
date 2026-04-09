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

# v3.7 latest moves tooling out of memory-bank/ into .kris/.
# Stable still uses memory-bank/ for backwards compatibility.
if [ "$VERSION" = "latest" ]; then
    KRIS_UI_DIR=".kris/kris-ui"
    KRIS_MCP_DIR=".kris/kris-mcp"
else
    KRIS_UI_DIR="memory-bank/kris-ui"
    KRIS_MCP_DIR="memory-bank/kris-mcp"
fi
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
    "wirepulse.py"
    "static/css/kris-wirepulse.css"
    "static/js/kris-wirepulse.js"
)

# Create directory structure
mkdir -p "$KRIS_UI_DIR/templates/interactive/dependency-graph" "$KRIS_UI_DIR/templates/interactive/flow-diagram" "$KRIS_UI_DIR/templates/interactive/entity-relationship" "$KRIS_UI_DIR/templates/interactive/timeline" "$KRIS_UI_DIR/templates/interactive/kanban-board" "$KRIS_UI_DIR/templates/interactive/comparison-matrix" "$KRIS_UI_DIR/static/css" "$KRIS_UI_DIR/static/js" "$KRIS_UI_DIR/static/img"

kris_ui_ok=true
for file in "${KRIS_UI_FILES[@]}"; do
    url="${GITHUB_RAW_BASE}/remote-templates/${VERSION}/kris-ui/${file}"
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

# Download kris-mcp (MCP server for ring operations + WirePulse)
# KRIS_MCP_DIR was set earlier based on VERSION (.kris/ for latest, memory-bank/ for stable)
echo ""
echo -e "${CYAN}Downloading kris-mcp...${NC}"

KRIS_MCP_FILES=("kris-mcp.py" "requirements.txt")

mkdir -p "$KRIS_MCP_DIR"

kris_mcp_ok=true
for file in "${KRIS_MCP_FILES[@]}"; do
    url="${GITHUB_RAW_BASE}/remote-templates/${VERSION}/kris-mcp/${file}"
    dest="${KRIS_MCP_DIR}/${file}"
    if command -v curl &> /dev/null; then
        curl -fsSL "$url" -o "$dest" 2>/dev/null || { echo -e "${RED}  ✗ Failed: ${file}${NC}"; kris_mcp_ok=false; }
    elif command -v wget &> /dev/null; then
        wget -q "$url" -O "$dest" 2>/dev/null || { echo -e "${RED}  ✗ Failed: ${file}${NC}"; kris_mcp_ok=false; }
    fi
done

if $kris_mcp_ok; then
    echo -e "${GREEN}✓ kris-mcp downloaded (${#KRIS_MCP_FILES[@]} files)${NC}"

    # Try to find a Python 3.10+ interpreter — kris-mcp needs it.
    kris_mcp_py=""
    for candidate in python3.13 python3.12 python3.11 python3.10 python3; do
        if command -v "$candidate" &> /dev/null; then
            ver=$("$candidate" -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")' 2>/dev/null)
            major=$(echo "$ver" | cut -d. -f1)
            minor=$(echo "$ver" | cut -d. -f2)
            if [ "$major" = "3" ] && [ "$minor" -ge 10 ] 2>/dev/null; then
                kris_mcp_py=$(command -v "$candidate")
                break
            fi
        fi
    done

    kris_mcp_venv_ok=false
    if [ -n "$kris_mcp_py" ]; then
        echo -e "${CYAN}  Creating kris-mcp venv (${kris_mcp_py})...${NC}"
        if (cd "$KRIS_MCP_DIR" && "$kris_mcp_py" -m venv .venv && .venv/bin/pip install -q --upgrade pip && .venv/bin/pip install -q -r requirements.txt) 2>/dev/null; then
            echo -e "${GREEN}✓ kris-mcp venv ready (Python $("$kris_mcp_py" -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")'))${NC}"
            kris_mcp_venv_ok=true
        else
            echo -e "${YELLOW}⚠ kris-mcp venv creation failed — install later with:${NC}"
            echo -e "${YELLOW}    cd ${KRIS_MCP_DIR} && ${kris_mcp_py} -m venv .venv && .venv/bin/pip install -r requirements.txt${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ Python 3.10+ not found — kris-mcp needs it. After installing:${NC}"
        echo -e "${YELLOW}    cd ${KRIS_MCP_DIR} && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt${NC}"
    fi

    # Register kris-mcp in .mcp.json (project root) ONLY if the venv is actually usable.
    # Claude Code reads project-scoped MCP servers from .mcp.json at the repo root —
    # NOT from .claude/settings.json (which is for permissions, hooks, statusLine).
    if $kris_mcp_venv_ok; then
        if command -v python3 &> /dev/null; then
            KRIS_MCP_DIR="$KRIS_MCP_DIR" python3 - <<'PYEOF' 2>/dev/null && echo -e "${GREEN}✓ kris-mcp registered in .mcp.json${NC}" || echo -e "${YELLOW}⚠ Could not update .mcp.json — add kris-mcp manually${NC}"
import json, os
path = ".mcp.json"
mcp_dir = os.environ.get("KRIS_MCP_DIR", "memory-bank/kris-mcp")
data = {}
if os.path.exists(path):
    try:
        with open(path) as f:
            data = json.load(f)
    except Exception:
        data = {}
servers = data.setdefault("mcpServers", {})
if "kris-mcp" not in servers:
    servers["kris-mcp"] = {
        "command": f"{mcp_dir}/.venv/bin/python3",
        "args": [f"{mcp_dir}/kris-mcp.py"],
    }
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
        f.write("\n")
PYEOF
        else
            echo -e "${YELLOW}⚠ python3 not found — skipping .mcp.json registration${NC}"
        fi
    else
        echo -e "${YELLOW}  Skipping .mcp.json registration — venv not ready yet.${NC}"
        echo -e "${YELLOW}  After installing Python 3.10+ and creating the venv, add this to .mcp.json at the repo root:${NC}"
        echo -e "${YELLOW}    {\"mcpServers\": {\"kris-mcp\": {\"command\": \"${KRIS_MCP_DIR}/.venv/bin/python3\", \"args\": [\"${KRIS_MCP_DIR}/kris-mcp.py\"]}}}${NC}"
    fi
else
    echo -e "${YELLOW}⚠ kris-mcp download failed. You can install it later from kris-base/kris-mcp.${NC}"
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

# Add KRIS tooling entries to .gitignore (idempotent).
# KRIS tooling (.kris/, .claude/commands/kris*.md) is downloaded on install/upgrade —
# it's not project content and shouldn't be committed. memory-bank/ IS project content
# and stays committed.
echo ""
echo -e "${CYAN}Updating .gitignore...${NC}"
touch .gitignore
kris_gitignore_block=$(cat <<'EOF'

# KRIS tooling — installed via kris-install.sh or /kris-upgrade
.kris/
.claude/commands/kris.md
.claude/commands/kris-*.md
EOF
)
if ! grep -q "^# KRIS tooling" .gitignore 2>/dev/null; then
    echo "$kris_gitignore_block" >> .gitignore
    echo -e "${GREEN}✓ KRIS tooling entries added to .gitignore${NC}"
else
    echo -e "${GREEN}✓ .gitignore already has KRIS tooling entries${NC}"
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
echo -e "     ${CYAN}cd ${KRIS_UI_DIR} && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt && .venv/bin/python3 kris-ui.py${NC}"
echo ""
if $kris_mcp_venv_ok 2>/dev/null; then
    echo -e "  ${GREEN}kris-mcp:${NC} Registered in .mcp.json — Claude Code will load it on next session."
else
    echo -e "  ${YELLOW}kris-mcp:${NC} Venv not ready. After installing Python 3.10+, run:"
    echo -e "     ${CYAN}cd ${KRIS_MCP_DIR} && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt${NC}"
    echo -e "     Then create .mcp.json at the repo root with:"
    echo -e "     ${CYAN}{\"mcpServers\": {\"kris-mcp\": {\"command\": \"${KRIS_MCP_DIR}/.venv/bin/python3\", \"args\": [\"${KRIS_MCP_DIR}/kris-mcp.py\"]}}}${NC}"
fi
echo ""
echo -e "  ${GREEN}Remember:${NC} All choices can be changed later via prompting or"
echo -e "  by editing the generated files directly."
echo ""
echo -e "${CYAN}────────────────────────────────────────────────────────────────${NC}"
echo -e "  Need help? Visit: ${BOLD}https://github.com/ai-focused/kris-base${NC}"
echo -e "${CYAN}────────────────────────────────────────────────────────────────${NC}"
echo ""
