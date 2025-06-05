#!/bin/bash
# Test script for the login endpoint

echo "Testing login endpoint..."
curl -X POST \
  http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user", "password":"****"}' \
  | python -m json.tool

echo -e "\nTest complete!"
