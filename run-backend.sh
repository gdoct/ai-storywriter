#!/bin/bash

# Start the backend server
# Usage: ./start-backend.sh [db_path]

# if the virtual environment isn't available, run `. venv/bin/activate`
if [ ! -d "venv" ]; then
  echo "Virtual environment not found. Creating one..."
  python -m venv venv
  source venv/bin/activate
  pip install -r backend/requirements.txt
else
  source venv/bin/activate
fi

if [ -n "$1" ]; then
  export STORYWRITER_DB_PATH="$1"
  echo "Using custom DB: $STORYWRITER_DB_PATH"
fi

echo "Starting FastAPI backend server..."
cd backend && python app.py