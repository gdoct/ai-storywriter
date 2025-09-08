#!/bin/bash
# Test script for the login endpoint

# Configuration
BASE_URL="${VITE_API_URL:-http://localhost:5000}"

echo "Testing login endpoint..."
curl -X POST \
  ${BASE_URL}/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user", "password":"****"}' \
  | python -m json.tool

echo -e "\nTest complete!"
