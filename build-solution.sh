#!/bin/bash

error_exit() {
  echo "Error occurred at line $1. Exiting."
  exit 1
}

announceStep() {
    echo ""
    echo "#########################################################"
    echo "$1"
    echo "#########################################################"
    echo ""
}

trap 'error_exit $LINENO' ERR

set -e

# 1. build style library in /style-library/ai-styles
announceStep "Building style library..."
cd style-library/ai-styles || error_exit $LINENO
npm install || error_exit $LINENO
npm run build || error_exit $LINENO
cd ../.. || error_exit $LINENO

# 2. build storybook in /style-library/storybook
announceStep "# Building storybook..."
cd style-library/storybook || error_exit $LINENO
npm install || error_exit $LINENO
npm run build || error_exit $LINENO
cd ../.. || error_exit $LINENO

if [ ! -f .env ]; then
  announceStep "Creating .env file..."
  echo "JWT_SECRET_KEY=your-secure-secret-key-change-this-in-production" > .env
  echo "STORYWRITER_DB_PATH=$(pwd)/backend/storywriter.db" >> .env
  echo "BACKEND_HOST=0.0.0.0" >> .env
  echo "BACKEND_PORT=5000" >> .env
  echo "VITE_API_URL=http://localhost:5000" >> .env
  echo "ADMIN_DEFAULT_USERNAME=admin" >> .env
  echo "ADMIN_DEFAULT_EMAIL=admin@storywriter.local" >> .env
  echo "ADMIN_DEFAULT_PASSWORD=change-this-secure-password" >> .env
fi

# 4. build the backend in ./backend

announceStep "Building backend..."
cd backend || error_exit $LINENO
pip install -r requirements.txt || error_exit $LINENO
python -m compileall -q . || error_exit $LINENO
cd .. || error_exit $LINENO

# 5. build the frontend in ./frontend
announceStep "# Building frontend..."
cd frontend || error_exit $LINENO
npm install || error_exit $LINENO
npm run build || error_exit $LINENO
cd .. || error_exit $LINENO