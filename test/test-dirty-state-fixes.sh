#!/bin/bash

# Test script to verify dirty state bug fixes
# This script will start the application and run basic tests

echo "Starting backend..."
cd /home/guido/storywriter
./start-backend.sh &
BACKEND_PID=$!

echo "Waiting for backend to start..."
sleep 5

echo "Starting frontend..."
./start-frontend.sh &
FRONTEND_PID=$!

echo "Waiting for frontend to start..."
sleep 10

echo "Application should now be running at:"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:5000"

echo ""
echo "Manual testing checklist for dirty state fixes:"
echo "1. Load a scenario from dropdown - should NOT show 'unsaved changes' dialog"
echo "2. Try 'Save As' with a new name - should NOT cause flickering between scenarios"
echo "3. Generate a story - should NOT mark scenario as dirty"
echo "4. Switch between tabs - should NOT trigger dirty state unless actual edits are made"
echo "5. Make actual edits to scenario content - SHOULD mark scenario as dirty"

echo ""
echo "Press any key to stop the servers..."
read -n 1

echo "Stopping servers..."
kill $BACKEND_PID 2>/dev/null
kill $FRONTEND_PID 2>/dev/null

echo "Test environment stopped."
