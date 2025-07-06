#!/bin/bash

# Clean and restart Storybook
# This script cleans the Storybook cache and restarts it fresh

echo "🧹 Cleaning Storybook cache and restarting..."
echo ""

SCRIPT_DIR="$(dirname "$0")"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT/storybook"

echo "🗑️  Cleaning node_modules and cache..."
rm -rf node_modules/.cache
rm -rf node_modules/.vite
rm -rf storybook-static

echo "🔧 Building component library..."
cd ../lib
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to build component library"
    exit 1
fi

echo "📦 Reinstalling Storybook dependencies..."
cd ../storybook
npm install

echo "🎨 Starting clean Storybook server..."
echo "📖 Storybook will be available at: http://localhost:6006"
echo "⏹️  Press Ctrl+C to stop the server"
echo ""

npm run storybook
