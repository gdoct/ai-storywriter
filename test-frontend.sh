#!/bin/bash
# Start backend with a test DB, start frontend, run puppeteer tests, then clean up.
REPEAT_MODE=0
if [[ "$1" == "--repeat" ]]; then
  REPEAT_MODE=1
  shift
fi
TEST_DB="/tmp/storywriter_test_$(date +%s).db"
BACKEND_LOG="/tmp/storywriter_backend_test.log"
FRONTEND_LOG="/tmp/storywriter_frontend_test.log"

# --- Kill any running backend or frontend before starting ---
# Kill running backend (python backend/app.py or similar)
if pgrep -f "backend/app.py" > /dev/null; then
  echo "Killing existing backend (python backend/app.py)"
  pkill -f "backend/app.py"
  sleep 2
fi
# Kill running frontend (react-scripts start or npm start)
if pgrep -f "react-scripts start" > /dev/null; then
  echo "Killing existing frontend (react-scripts start)"
  pkill -f "react-scripts start"
  sleep 2
fi
if pgrep -f "npm start" > /dev/null; then
  echo "Killing existing frontend (npm start)"
  pkill -f "npm start"
  sleep 2
fi

# create the database file
if [[ -f "$TEST_DB" ]]; then
  echo "Removing existing test DB: $TEST_DB"
  rm -f "$TEST_DB"
fi

# Start backend with test DB
./start-backend.sh "$TEST_DB" > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
echo "Started backend (PID $BACKEND_PID) with DB $TEST_DB"

# Wait for backend to be ready
sleep 1

# Start frontend
cd  frontend || { echo "Failed to change directory to frontend"; exit 1; }
if ! npm install; then
  echo "Failed to install frontend dependencies"
  exit 1
fi
npm start > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
echo "Started frontend (PID $FRONTEND_PID)"

# Wait for frontend to be ready
sleep 1
# Trap Ctrl-C during repeat mode to break the loop and continue the script
if [[ $REPEAT_MODE -eq 1 ]]; then
  trap 'echo; break_loop=1' INT
  break_loop=0
  while true; do
    # Run puppeteer tests
    npm run test:puppeteer
    TEST_RESULT=$?
    read -p "Do you want to continue? (press Enter to continue, 'x' or 'exit' to stop): " USER_INPUT
    if [[ "$USER_INPUT" == "x" || "$USER_INPUT" == "exit" || $break_loop -eq 1 ]]; then
      break
    fi
  done
  trap - INT
else
  # Run puppeteer tests
  npm run test:puppeteer
  TEST_RESULT=$?
fi

# Cleanup
# --- Kill any running frontend/backend after tests ---
if ps -p $FRONTEND_PID > /dev/null; then
  echo "Killing frontend (PID $FRONTEND_PID)"
  kill $FRONTEND_PID
  sleep 2
fi
# In case npm start spawned a child process (like react-scripts), kill by pattern
pkill -9 -f "react-scripts/scripts/start.js" || true
pkill -9 -f "react-scripts start" || true
pkill -9 -f "npm start" || true

if ps -p $BACKEND_PID > /dev/null; then
  echo "Killing backend (PID $BACKEND_PID)"
  kill $BACKEND_PID
  sleep 2
fi
# Also kill any remaining backend/app.py processes
pkill -9 -f "backend/app.py" || true
rm -f "$TEST_DB"

exit $TEST_RESULT
