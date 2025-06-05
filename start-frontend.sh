#!/bin/bash

# Start the frontend npm development server in the folder ./frontend in dev mode
if [ ! -d "frontend" ]; then
  echo "Frontend directory not found. Please ensure you are in the correct directory."
  exit 1
fi
echo "Starting frontend development server..."
cd frontend
npm install
npm run dev
if [ $? -ne 0 ]; then
  echo "Failed to start the frontend development server."
  exit 1
fi
echo "Frontend development server started successfully."
echo "You can now access the frontend at http://localhost:5173"
echo "Press Ctrl+C to stop the server."
# Wait for the server to finish
wait