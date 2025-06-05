#!/bin/bash
echo "Building frontend .."
# Navigate to the frontend directory
cd frontend
# Install dependencies
npm install
# Build the frontend
npm run build
echo "Frontend build complete."
# Navigate back to the root directory
cd ..
# Start the backend server
echo "Starting backend server..."
python backend/app.py