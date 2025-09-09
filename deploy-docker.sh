#!/bin/bash
REMOTE_SERVER="user@example.com"
. deploy-docker.sh.user

# Exit on any error
set -e

# Helper functions
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

# Keep track of the last executed command
trap 'last_command=$current_command; current_command=$BASH_COMMAND' DEBUG

# Echo an error message before exiting
trap 'exit_code=$?; if [ $exit_code -ne 0 ]; then echo "The command \"${last_command}\" failed with exit code $exit_code."; fi' EXIT


# Skip the build step if -s was provided on the command line
SKIP_BUILD=false
for arg in "$@"; do
    if [ "$arg" = "-s" ]; then
        SKIP_BUILD=true
        break
    fi
done

if [ "$SKIP_BUILD" = true ]; then
    echo "Skipping build process because -s was provided"
else
    echo "Running complete build process..."
    ./build-solution.sh || error_exit $LINENO
fi

# Verify that the frontend build directory exists
echo "Verifying build outputs..."
if [ ! -d "frontend/build" ]; then
  echo "ERROR: frontend/build directory not found after running build-solution.sh"
  echo "Contents of frontend directory:"
  ls -la frontend/
  error_exit $LINENO
fi

echo "✅ Frontend build directory found with $(ls -1 frontend/build | wc -l) files"

announceStep "Loading environment variables..."
# Source .env file if it exists to get configuration
if [ -f .env ]; then
    source .env
    echo "✅ Loaded environment variables from .env"
else
    echo "❌ No .env file found. Please create one with required variables."
    exit 1
fi

# Check for required admin credentials
if [ -z "$ADMIN_DEFAULT_USERNAME" ] || [ -z "$ADMIN_DEFAULT_EMAIL" ] || [ -z "$ADMIN_DEFAULT_PASSWORD" ]; then
    echo "❌ Missing admin credentials in .env file!"
    echo "Please set: ADMIN_DEFAULT_USERNAME, ADMIN_DEFAULT_EMAIL, ADMIN_DEFAULT_PASSWORD"
    exit 1
fi

announceStep "Building Docker image with environment variables..."
docker build \
  --build-arg BACKEND_HOST="${BACKEND_HOST:-0.0.0.0}" \
  --build-arg BACKEND_PORT="${BACKEND_PORT:-5000}" \
  --build-arg UPLOAD_FOLDER="${UPLOAD_FOLDER:-/data/uploads}" \
  -t storywriter:latest . || error_exit $LINENO

announceStep "Saving Docker image for deployment..."
mkdir -p build
docker save -o build/storywriter-docker.img storywriter:latest
# Check if the remote server is reachable

if ! ssh -o BatchMode=yes -o ConnectTimeout=5 "$REMOTE_SERVER" exit; then
    echo "Remote server is not reachable. Exiting."
    exit 1
fi
scp build/storywriter-docker.img $REMOTE_SERVER:~ 
ssh $REMOTE_SERVER bash << EOF
export BACKEND_HOST="${BACKEND_HOST:-0.0.0.0}"
export BACKEND_PORT="${BACKEND_PORT:-5000}"
export ADMIN_DEFAULT_USERNAME="$ADMIN_DEFAULT_USERNAME"
export ADMIN_DEFAULT_EMAIL="$ADMIN_DEFAULT_EMAIL"
export ADMIN_DEFAULT_PASSWORD="$ADMIN_DEFAULT_PASSWORD"
export JWT_SECRET_KEY="${JWT_SECRET_KEY:-your-secure-secret-key-change-this-in-production}"
export UPLOAD_FOLDER=${UPLOAD_FOLDER:-/data/uploads}

# remove the running container
echo "Removing the running container..."
docker rm -f storywriter 2>/dev/null || true

# load the new image (this will overwrite any existing one)
echo "Loading the new image..."
docker load -i storywriter-docker.img

# remove any dangling images to clean up
echo "Cleaning up old images..."
docker image prune -f 2>/dev/null || true

# Create data directory if it doesn't exist
echo "Creating data directory..."
sudo mkdir -p /var/lib/storywriter
sudo chmod 777 /var/lib/storywriter
# Allow any user to write to this directory (needed for container user)
sudo chown -R 1000:1000 /var/lib/storywriter 2>/dev/null || true

# deploy the new image to a new container
echo "Deploying the new image to a new container..."
docker run --name storywriter --restart unless-stopped --network host -d \
  -e BACKEND_HOST="\$BACKEND_HOST" \
  -e BACKEND_PORT="\$BACKEND_PORT" \
  -e ADMIN_DEFAULT_USERNAME="\$ADMIN_DEFAULT_USERNAME" \
  -e ADMIN_DEFAULT_EMAIL="\$ADMIN_DEFAULT_EMAIL" \
  -e ADMIN_DEFAULT_PASSWORD="\$ADMIN_DEFAULT_PASSWORD" \
  -e JWT_SECRET_KEY="\$JWT_SECRET_KEY" \
  -e UPLOAD_FOLDER="\$UPLOAD_FOLDER" \
  -v /var/lib/storywriter:/data \
  storywriter:latest

# remove the image from the remote server
echo "Removing the image from the remote server..."
rm storywriter-docker.img
EOF

echo "Deployment completed successfully, waiting for container to start.."
# wait 10 seconds for the container to start
sleep 4
# Check if the container is running
ssh "$REMOTE_SERVER" 'bash' << 'EOF'
last_line=$(docker logs storywriter 2>&1 | tail -n 1)
if [[ "$last_line" == "INFO:     Waiting for application startup." ]]; then
    echo "[OK] Container in starting state.."
elif [[ "$last_line" == "INFO:watchfiles.main:3 changes detected." ]]; then
    echo "[OK] Container running"
elif [[ "$last_line" == "INFO:     Application startup complete." ]]; then
    echo "[OK] Container running"
elif [[ "$last_line" == "INFO:     Uvicorn running on http://0.0.0.0:5600 (Press CTRL+C to quit)" ]]; then
    echo "[OK] Container running"
else
    echo "[WARN] $last_line"
fi
EOF
