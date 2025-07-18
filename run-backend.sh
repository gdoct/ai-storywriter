#!/bin/bash

# Start the backend server
# Usage: ./start-backend.sh [db_path]
if [ -n "$1" ]; then
  export STORYWRITER_DB_PATH="$1"
  echo "Using custom DB: $STORYWRITER_DB_PATH"
fi

echo "Starting backend server..."
python backend/app.py