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

# Create frontend directory structure and copy pre-built frontend
RUN mkdir -p ./frontend/build/
COPY frontend/build/ ./frontend/build/

# Create necessary directories and set permissions
RUN mkdir -p ./backend/uploads/character_photos ./backend/uploads/photos ./backend/uploads/scenario_images \
    && chown -R storywriter:storywriter /app

# Switch to non-root user
USER storywriter

# Set environment variables
ENV PYTHONPATH=/app/backend
ENV PYTHONUNBUFFERED=1
ENV NODE_ENV=production

# Expose the port that the app runs on
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Command to run the application
WORKDIR /app/backend
CMD ["python", "app.py"]