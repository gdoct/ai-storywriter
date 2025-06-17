#!/bin/bash

# Usage: bash add_credits.sh <email> <credits>
EMAIL="$1"
CREDITS="$2"

if [ -z "$EMAIL" ] || [ -z "$CREDITS" ]; then
  echo "Usage: $0 <email> <credits>"
  exit 1
fi

BASE_URL="http://localhost:5000"

# Login and get JWT token
TOKEN=$(curl -s -X POST "$BASE_URL/api/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\"}" | jq -r '.access_token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "Login failed. Check your email."
  exit 1
fi

echo "Login successful. Token: $TOKEN"

# Add credits
RESPONSE=$(curl -s -X POST "$BASE_URL/api/user/add-credits" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"credits\": $CREDITS}")

echo "Add credits response: $RESPONSE"