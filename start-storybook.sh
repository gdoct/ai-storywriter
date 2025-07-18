#!/bin/bash

# Start Storybook Development Server
# This script starts the Storybook server for the @drdata/ai-styles component library

echo "🚀 Starting Storybook server for @drdata/ai-styles component library..."
echo "📍 Location: /storybook"
echo ""

# Navigate to the storybook directory
cd "$(dirname "$0")/style-library/storybook" || {
    echo "❌ Error: Could not navigate to storybook directory"
    exit 1
}

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Error: Failed to install dependencies"
        exit 1
    fi
fi

# Check if the library is built
echo "🔧 Building component library..."
cd ../lib
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to build component library"
    exit 1
fi

# Return to storybook directory
cd ../storybook

# Remove any cached modules to ensure fresh start
echo "🧹 Cleaning Storybook cache..."
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf node_modules/.vite 2>/dev/null || true

echo "🎨 Starting Storybook development server..."
echo "📖 Storybook will be available at: http://localhost:6006"
echo "⏹️  Press Ctrl+C to stop the server"
echo ""

# Start Storybook
npm run storybook
