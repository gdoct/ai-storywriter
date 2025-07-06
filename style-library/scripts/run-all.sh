#!/bin/bash

# Complete Project Runner
# This script provides options to run different parts of the @drdata/ai-styles project

SCRIPT_DIR="$(dirname "$0")"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🚀 @drdata/ai-styles Project Runner"
echo "================================="
echo ""

# Function to show menu
show_menu() {
    echo "Please select an option:"
    echo ""
    echo "1) 🎨 Start Storybook (http://localhost:6006)"
    echo "2) 🧪 Run Library Unit Tests"
    echo "3) 🌐 Run E2E Tests (requires Storybook running)"
    echo "4) 🔧 Build Library"
    echo "5) 🔍 Lint Library Code"
    echo "6) 📋 Show Project Status"
    echo "7) 🔄 Install All Dependencies"
    echo "8) 🧹 Clean Build Artifacts"
    echo "9) 🚀 Quick Start (Build + Storybook)"
    echo "0) ❌ Exit"
    echo ""
}

# Function to build library
build_library() {
    echo "🔧 Building component library..."
    cd "$PROJECT_ROOT/lib"
    npm run build
    return $?
}

# Function to start storybook
start_storybook() {
    echo "🎨 Starting Storybook..."
    if build_library; then
        cd "$PROJECT_ROOT/storybook"
        echo "📖 Storybook will be available at: http://localhost:6006"
        npm run storybook
    else
        echo "❌ Failed to build library. Cannot start Storybook."
        return 1
    fi
}

# Function to run library tests
run_library_tests() {
    echo "🧪 Running library unit tests..."
    cd "$PROJECT_ROOT/lib"
    npm test
}

# Function to run E2E tests
run_e2e_tests() {
    echo "🌐 Running E2E tests with Playwright..."
    echo "⚠️  Make sure Storybook is running on http://localhost:6006"
    read -p "Is Storybook running? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd "$PROJECT_ROOT/tests"
        npm install  # Ensure dependencies are installed
        npm run test
    else
        echo "Please start Storybook first with option 1"
    fi
}

# Function to lint code
lint_code() {
    echo "🔍 Linting library code..."
    cd "$PROJECT_ROOT/lib"
    npm run lint
}

# Function to show project status
show_status() {
    echo "📋 Project Status"
    echo "=================="
    echo ""
    
    # Check if library is built
    if [ -d "$PROJECT_ROOT/lib/dist" ]; then
        echo "✅ Library: Built"
    else
        echo "❌ Library: Not built"
    fi
    
    # Check dependencies
    echo ""
    echo "📦 Dependencies:"
    
    if [ -d "$PROJECT_ROOT/lib/node_modules" ]; then
        echo "✅ Library dependencies: Installed"
    else
        echo "❌ Library dependencies: Missing"
    fi
    
    if [ -d "$PROJECT_ROOT/storybook/node_modules" ]; then
        echo "✅ Storybook dependencies: Installed"
    else
        echo "❌ Storybook dependencies: Missing"
    fi
    
    if [ -d "$PROJECT_ROOT/tests/node_modules" ]; then
        echo "✅ Tests dependencies: Installed"
    else
        echo "❌ Tests dependencies: Missing"
    fi
    
    echo ""
    echo "📂 Project Structure:"
    echo "├── lib/ (Component Library)"
    echo "├── storybook/ (Documentation & Demo)"
    echo "├── tests/ (E2E Tests)"
    echo "└── scripts/ (Utility Scripts)"
}

# Function to install all dependencies
install_deps() {
    echo "🔄 Installing all dependencies..."
    
    echo "📦 Installing library dependencies..."
    cd "$PROJECT_ROOT/lib"
    npm install
    
    echo "📦 Installing storybook dependencies..."
    cd "$PROJECT_ROOT/storybook"
    npm install
    
    echo "📦 Installing test dependencies..."
    cd "$PROJECT_ROOT/tests"
    npm install
    
    echo "✅ All dependencies installed!"
}

# Function to clean build artifacts
clean_builds() {
    echo "🧹 Cleaning build artifacts..."
    
    rm -rf "$PROJECT_ROOT/lib/dist"
    rm -rf "$PROJECT_ROOT/storybook/storybook-static"
    
    echo "✅ Build artifacts cleaned!"
}

# Function for quick start
quick_start() {
    echo "🚀 Quick Start: Building library and starting Storybook..."
    if build_library; then
        start_storybook
    fi
}

# Main menu loop
while true; do
    show_menu
    read -p "Enter your choice [0-9]: " choice
    echo ""
    
    case $choice in
        1)
            start_storybook
            ;;
        2)
            run_library_tests
            ;;
        3)
            run_e2e_tests
            ;;
        4)
            build_library
            ;;
        5)
            lint_code
            ;;
        6)
            show_status
            ;;
        7)
            install_deps
            ;;
        8)
            clean_builds
            ;;
        9)
            quick_start
            ;;
        0)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid option. Please try again."
            ;;
    esac
    
    echo ""
    echo "Press any key to continue..."
    read -n 1 -s
    echo ""
done
