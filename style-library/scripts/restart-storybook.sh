#!/bin/bash

# Clean restart script for Storybook
# This script cleans caches and restarts Storybook cleanly

SCRIPT_DIR="$(dirname "$0")"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🧹 Cleaning Storybook and restarting..."
echo ""

# Navigate to storybook directory
cd "$PROJECT_ROOT/storybook"

# Kill any existing processes on port 6006
echo "🔍 Checking for existing processes on port 6006..."
if lsof -Pi :6006 -sTCP:LISTEN -t >/dev/null; then
    echo "⚠️  Found existing process on port 6006, killing it..."
    kill -9 $(lsof -Pi :6006 -sTCP:LISTEN -t) 2>/dev/null || true
    sleep 2
fi

# Clear node_modules cache (optional, uncomment if needed)
# echo "🗑️  Clearing node_modules cache..."
# rm -rf node_modules/.cache 2>/dev/null || true

# Clear any Vite cache
echo "🗑️  Clearing Vite cache..."
rm -rf node_modules/.vite 2>/dev/null || true

# Build the library first
echo "🔧 Building component library..."
cd "$PROJECT_ROOT/lib"
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to build component library"
    exit 1
fi

# Return to storybook and start fresh
cd "$PROJECT_ROOT/storybook"
echo ""
echo "🎨 Starting fresh Storybook server..."
echo "📖 Storybook will be available at: http://localhost:6006"
echo "⏹️  Press Ctrl+C to stop the server"
echo ""

npm run storybook
