#!/usr/bin/bash
echo "starting up"

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

# Run the existing build process
announceStep "Running complete build process..."
./build-solution.sh || error_exit $LINENO

# Verify that the frontend build directory exists
announceStep "Verifying build outputs..."
if [ ! -d "frontend/build" ]; then
  echo "ERROR: frontend/build directory not found after running build-solution.sh"
  echo "Contents of frontend directory:"
  ls -la frontend/
  error_exit $LINENO
fi

echo "✅ Frontend build directory found with $(ls -1 frontend/build | wc -l) files"

# Build Docker image
announceStep "Building Docker image..."
docker build -t storywriter:latest . || error_exit $LINENO

announceStep "Build complete! Docker image 'storywriter:latest' is ready."
echo ""
echo "To run the container:"
echo "  docker run -p 5000:5000 -v \$(pwd)/backend/storywriter.db:/app/backend/storywriter.db -v \$(pwd)/backend/uploads:/app/backend/uploads storywriter:latest"
echo ""
echo "Or with environment variables:"
echo "  docker run -p 5000:5000 -e JWT_SECRET_KEY=your-secret-key -v \$(pwd)/backend/storywriter.db:/app/backend/storywriter.db -v \$(pwd)/backend/uploads:/app/backend/uploads storywriter:latest"