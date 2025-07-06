#!/bin/bash

# Fix React CurrentDispatcher Error
# This script fixes the React version mismatch issue in Storybook

echo "🔧 Fixing React CurrentDispatcher Error..."
echo ""

SCRIPT_DIR="$(dirname "$0")"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "📦 Step 1: Update library dependencies..."
cd "$PROJECT_ROOT/lib"
npm install

echo "🔧 Step 2: Rebuild component library..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to build component library"
    exit 1
fi

echo "📦 Step 3: Clean and reinstall Storybook dependencies..."
cd "$PROJECT_ROOT/storybook"
rm -rf node_modules package-lock.json
npm install

echo "🧹 Step 4: Clear Vite cache..."
rm -rf node_modules/.vite
rm -rf node_modules/.cache

echo "🔍 Step 5: Verify React versions..."
echo "Library React types:"
cd "$PROJECT_ROOT/lib"
npm list @types/react 2>/dev/null || echo "Not found"

echo "Storybook React:"
cd "$PROJECT_ROOT/storybook"
npm list react 2>/dev/null || echo "Not found"

echo ""
echo "✅ React version fix complete!"
echo ""
echo "🎨 Starting Storybook..."
npm run storybook
