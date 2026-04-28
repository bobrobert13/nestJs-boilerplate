#!/bin/bash

# ============================================
# NestJS Boilerplate - Package Setup Launcher
# ============================================
#
# Supported platforms:
#   - Linux (bash)
#   - macOS (bash/zsh)
#   - Windows (via Git Bash, WSL, or MSYS2)
#
# Requirements:
#   - Node.js 20+ installed
#   - npm installed
#
# Usage:
#   ./setup.sh          # Interactive setup
#   ./setup.sh --help   # Show help
#
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SETUP_DIR="$SCRIPT_DIR"

# Colors (Git Bash, WSL, Linux, macOS)
if [ -t 1 ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    CYAN='\033[0;36m'
    BOLD='\033[1m'
    NC='\033[0m'
else
    RED=''
    GREEN=''
    YELLOW=''
    CYAN=''
    BOLD=''
    NC=''
fi

show_help() {
    echo ""
    echo -e "${BOLD}${CYAN}NestJS Boilerplate - Package Setup${NC}"
    echo ""
    echo "Usage: ./setup.sh [options]"
    echo ""
    echo "Options:"
    echo "  --help, -h     Show this help message"
    echo "  --skip-env     Skip environment variable collection"
    echo "  --list         List available packages"
    echo "  --reset        Reset previous selection"
    echo ""
    echo "Examples:"
    echo "  ./setup.sh              # Run full setup"
    echo "  ./setup.sh --list       # Show available packages"
    echo "  ./setup.sh --reset      # Clear saved selection"
    echo ""
}

list_packages() {
    echo ""
    echo -e "${BOLD}${CYAN}Available Packages:${NC}"
    echo ""

    if [ ! -f "$SETUP_DIR/package-config.json" ]; then
        echo -e "${RED}Error: package-config.json not found${NC}"
        exit 1
    fi

    node -e "
        const config = require('$SETUP_DIR/package-config.json');
        config.packages.forEach(pkg => {
            const selected = pkg.selected ? '${GREEN}[x]${NC}' : '${RED}[ ]${NC}';
            console.log('  ' + selected + ' ${BOLD}' + pkg.name + '${NC}');
            console.log('       ' + pkg.description);
            console.log('');
        });
    "
}

reset_selection() {
    local selection_file="$SETUP_DIR/selection.json"

    if [ -f "$selection_file" ]; then
        rm -f "$selection_file"
        echo -e "${GREEN}Selection reset successfully${NC}"
    else
        echo -e "${YELLOW}No previous selection found${NC}"
    fi
}

# Parse arguments
SKIP_ENV=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            show_help
            exit 0
            ;;
        --skip-env)
            SKIP_ENV=true
            shift
            ;;
        --list)
            list_packages
            exit 0
            ;;
        --reset)
            reset_selection
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js 20+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}Error: Node.js 20+ is required (found: $(node -v))${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  NestJS Boilerplate - Package Setup${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""
echo -e "Node.js: ${GREEN}$(node -v)${NC}"
echo -e "npm: ${GREEN}$(npm -v)${NC}"
echo ""

# Check if npm install is needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}First time setup detected. Installing base dependencies...${NC}"
    echo ""
    npm install --silent
    echo ""
fi

# Run setup
echo -e "${CYAN}Starting package setup wizard...${NC}"
echo ""

cd "$SETUP_DIR"
node setup.js

echo ""
echo -e "${GREEN}Setup wizard completed!${NC}"
echo ""
