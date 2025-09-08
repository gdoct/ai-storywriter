#!/bin/bash
set -e

echo "Starting StoryWriter Docker container..."

# Ensure data directory exists and is writable
if [ ! -d "/data" ]; then
    echo "Creating /data directory..."
    mkdir -p /data
fi

# Ensure the directory is writable by the current user
if [ ! -w "/data" ]; then
    echo "Making /data directory writable..."
    chmod 755 /data 2>/dev/null || {
        echo "Warning: Could not change permissions of /data directory"
        echo "This may cause database creation to fail"
    }
fi

# Test if we can create a file in /data
if ! touch /data/.test 2>/dev/null; then
    echo "❌ Error: Cannot write to /data directory!"
    echo "Container user: $(whoami) ($(id))"
    echo "Directory permissions:"
    ls -la / | grep data || echo "/data directory not found"
    exit 1
else
    rm -f /data/.test
    echo "✅ /data directory is writable"
fi

# Print environment info for debugging
echo "Container user: $(whoami) ($(id))"
echo "Database path: ${STORYWRITER_DB_PATH:-/data/storywriter.db}"

# Execute the main application
echo "Starting Python application..."
exec python app.py