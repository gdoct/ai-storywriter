#!/bin/bash
# build the style library
echo "Building style library..."
cd style-library/ai-styles
npm install
npm run build

cd ../..
echo "Style library built successfully."

# Start the frontend npm development server in the folder ./frontend in dev mode
echo "Preparing to run frontend development server..."
if [ ! -d "frontend" ]; then
  echo "Frontend directory not found. Please ensure you are in the correct directory."
  exit 1
fi
cd frontend
npm install
echo "Running frontend development server..."
BROWSER=none npm run dev
if [ $? -ne 0 ]; then
  echo "Failed to start the frontend development server."
  exit 1
fi
echo "Frontend development server started successfully."
echo "You can now access the frontend at http://localhost:5173"
echo "Press Ctrl+C to stop the server."
# Wait for the server to finish
wait
