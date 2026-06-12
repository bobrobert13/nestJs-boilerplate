#!/bin/sh

# Docker entrypoint script for NestJS Boilerplate Service
# This script ensures Playwright browsers are properly configured before starting the app

set -e

echo "🚀 Starting NestJS Boilerplate Service..."

# Validate that the app is built
if [ ! -f "dist/apps/nominas/main" ]; then
    echo "❌ ERROR: Application not built. Run 'npm run build' first."
    echo "   Expected: dist/apps/nominas/main"
    exit 1
fi
echo "✅ Application binary found: dist/apps/nominas/main"

# Set default browsers path if not provided
export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-/opt/playwright/browsers}"

# Check if Playwright browsers are installed
if [ -d "$PLAYWRIGHT_BROWSERS_PATH" ]; then
  echo "✅ Playwright browsers found at: $PLAYWRIGHT_BROWSERS_PATH"

  # Find and fix permissions for chrome-headless-shell
  HEADLESS_SHELL=$(find "$PLAYWRIGHT_BROWSERS_PATH" -name "chrome-headless-shell" -type f 2>/dev/null | head -1)
  if [ -n "$HEADLESS_SHELL" ] && [ ! -x "$HEADLESS_SHELL" ]; then
    echo "🔧 Fixing permissions for: $HEADLESS_SHELL"
    chmod +x "$HEADLESS_SHELL"
  fi

  # List installed browsers
  echo "📦 Installed browsers:"
  find "$PLAYWRIGHT_BROWSERS_PATH" -maxdepth 2 -type d -name "chromium*" 2>/dev/null | while read dir; do
    echo "   - $(basename $dir)"
  done

  # Show executable path
  if [ -n "$HEADLESS_SHELL" ]; then
    echo "✅ Chrome headless shell found: $HEADLESS_SHELL"
  fi
else
  echo "⚠️  Playwright browsers not found at: $PLAYWRIGHT_BROWSERS_PATH"
  echo "⚠️  Attempting to install..."
  npx playwright install chromium || {
    echo "❌ ERROR: Playwright browser installation failed."
    echo "   The application may not function correctly without browsers."
    exit 1
  }
  echo "✅ Playwright browsers installed successfully"
fi

echo ""
echo "📡 Starting NestJS application..."
exec "$@"
