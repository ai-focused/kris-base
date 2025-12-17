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
echo -e "  ${GREEN}Remember:${NC} All choices can be changed later via prompting or"
echo -e "  by editing the generated files directly."
echo ""
echo -e "${CYAN}────────────────────────────────────────────────────────────────${NC}"
echo -e "  Need help? Visit: ${BOLD}https://github.com/ai-focused/kris-base${NC}"
echo -e "${CYAN}────────────────────────────────────────────────────────────────${NC}"
echo ""
