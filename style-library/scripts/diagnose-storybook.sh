#!/bin/bash

# Storybook Diagnosis Script
# This script helps identify and fix common Storybook build issues

echo "🔍 Diagnosing Storybook Build Issues"
echo "===================================="
echo ""

SCRIPT_DIR="$(dirname "$0")"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Step 1: Check if library is built
echo "1. Checking library build..."
if [ -f "$PROJECT_ROOT/lib/dist/index.js" ] && [ -f "$PROJECT_ROOT/lib/dist/index.d.ts" ]; then
    echo "✅ Library is built successfully"
    echo "   - JS: $(ls -lh $PROJECT_ROOT/lib/dist/index.js | awk '{print $5}')"
    echo "   - Types: $(ls -lh $PROJECT_ROOT/lib/dist/index.d.ts | awk '{print $5}')"
else
    echo "❌ Library not built or missing files"
    echo "   Building library now..."
    cd "$PROJECT_ROOT/lib"
    npm run build
fi

echo ""

# Step 2: Check Storybook configuration
echo "2. Checking Storybook configuration..."
cd "$PROJECT_ROOT/storybook"

if [ -f ".storybook/main.ts" ]; then
    echo "✅ Storybook main config exists"
else
    echo "❌ Missing .storybook/main.ts"
fi

if [ -f "src/stories/IconButton.stories.tsx" ]; then
    echo "✅ IconButton stories exist"
else
    echo "❌ Missing IconButton stories"
fi

if [ -f "src/stories/AiTextBox.stories.tsx" ]; then
    echo "✅ AiTextBox stories exist"
else
    echo "❌ Missing AiTextBox stories"
fi

echo ""

# Step 3: Check TypeScript compilation
echo "3. Checking TypeScript compilation..."
npx tsc --noEmit --skipLibCheck 2>&1 | head -20

echo ""

# Step 4: Show package versions
echo "4. Package versions:"
echo "   - React: $(npm list react --depth=0 2>/dev/null | grep react@ || echo 'Not found')"
echo "   - Storybook: $(npm list storybook --depth=0 2>/dev/null | grep storybook@ || echo 'Not found')"
echo "   - Vite: $(npm list vite --depth=0 2>/dev/null | grep vite@ || echo 'Not found')"

echo ""

# Step 5: Check for common issues
echo "5. Common issue checks:"

# Check for conflicting React versions
REACT_VERSION=$(npm list react --depth=0 2>/dev/null | grep react@ | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' || echo "unknown")
echo "   - React version: $REACT_VERSION"

# Check for memory issues
echo "   - Node memory: $(node -e "console.log(Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB')")"

# Check for permission issues
if [ -w "node_modules" ]; then
    echo "   - Write permissions: ✅ OK"
else
    echo "   - Write permissions: ❌ Limited"
fi

echo ""
echo "🚀 To start Storybook:"
echo "   ./scripts/start-storybook.sh"
echo ""
echo "🔧 To manually build and start:"
echo "   cd lib && npm run build"
echo "   cd ../storybook && npm run storybook"
