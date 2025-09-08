# Simple Dockerfile for StoryWriter Application
# Uses pre-built artifacts from build-solution.sh

FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    sqlite3 \
    curl \
    gcc \
    g++ \
    python3-dev \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --shell /bin/bash storywriter

# Set working directory
WORKDIR /app

# Copy backend requirements and install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend application code
COPY backend/ ./backend/

# Copy and set up entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
    && chown storywriter:storywriter /usr/local/bin/docker-entrypoint.sh

# Create frontend directory structure and copy pre-built frontend
RUN mkdir -p ./frontend/build/
COPY frontend/build/ ./frontend/build/

# Declare external volume for the SQLite DB
RUN mkdir -p /data \
    && chown -R storywriter:storywriter /app /data \
    && chmod 775 /data
VOLUME ["/data"]



# Create necessary directories and set permissions
RUN mkdir -p ./backend/uploads/character_photos ./backend/uploads/photos ./backend/uploads/scenario_images \
    && mkdir -p /data \
    && chown -R storywriter:storywriter /app /data \
    && chmod 775 /data

    # Switch to non-root user
USER storywriter

# Build-time arguments for configuration
ARG BACKEND_HOST=0.0.0.0
ARG BACKEND_PORT=5000
# Note: Admin credentials should be passed as runtime environment variables for security

# Set environment variables
ENV PYTHONPATH=/app/backend
ENV PYTHONUNBUFFERED=1
ENV NODE_ENV=production
ENV STORYWRITER_DB_PATH=/data/storywriter.db
ENV BACKEND_HOST=${BACKEND_HOST}
ENV BACKEND_PORT=${BACKEND_PORT}
# Admin credentials will be set at runtime via docker run -e

# Expose the port that the app runs on (configurable via build arg)
EXPOSE ${BACKEND_PORT}

# Health check (uses environment variable for port)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${BACKEND_PORT:-5000}/api/health || exit 1

# Set working directory and entrypoint
WORKDIR /app/backend
ENTRYPOINT ["docker-entrypoint.sh"]