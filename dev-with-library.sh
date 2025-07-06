#!/bin/bash

# Development script to run both library and frontend with live updates

echo "Starting development with live library updates..."

# Kill any existing processes on these ports
echo "Cleaning up any existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Start the library in watch mode
echo "Starting library in watch mode..."
cd /home/guido/storywriter/docomo/lib
npm run build:watch &
LIBRARY_PID=$!

# Wait a moment for the initial build
echo "Waiting for initial library build..."
sleep 3

# Start the frontend development server
echo "Starting frontend development server..."
cd /home/guido/storywriter/storywriter/frontend
npm run dev &
FRONTEND_PID=$!

echo "Development servers started!"
echo "Library watch mode PID: $LIBRARY_PID"
echo "Frontend dev server PID: $FRONTEND_PID"
echo ""
echo "Frontend is running at: http://localhost:3000"
echo "Library changes will automatically trigger rebuilds"
echo ""
echo "Press Ctrl+C to stop all servers"

# Function to cleanup on exit
cleanup() {
    echo "Shutting down development servers..."
    kill $LIBRARY_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

# Trap Ctrl+C
trap cleanup INT

# Wait for processes
wait