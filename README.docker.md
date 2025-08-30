#########################################################
Build complete! Docker image 'storywriter:latest' is ready.
#########################################################


To run the container:
  docker run -p 5000:5000 -v $(pwd)/backend/storywriter.db:/app/backend/storywriter.db -v $(pwd)/backend/uploads:/app/backend/uploads storywriter:latest

Or with environment variables:
  docker run -p 5000:5000 -e JWT_SECRET_KEY=your-secret-key -v $(pwd)/backend/storywriter.db:/app/backend/storywriter.db -v $(pwd)/backend/uploads:/app/backend/uploads storywriter:latest
