#!/bin/bash

# Usage: bash add_credits.sh <email> <credits>
EMAIL="$1"
CREDITS="$2"

if [ -z "$EMAIL" ] || [ -z "$CREDITS" ]; then
  echo "Usage: $0 <email> <credits>"
  exit 1
fi

BASE_URL="http://localhost:5000"

# read the ADMIN_TOKEN from the .env file
if [ -f ../.env ]; then
  source ../.env
else
  echo "Error: .env file not found."
  exit 1
fi

if [ "$ADMIN_TOKEN" == "null" ] || [ -z "$ADMIN_TOKEN" ]; then
  echo "Login failed. Check your email."
  exit 1
fi

echo "Login successful. Token: $ADMIN_TOKEN"

# Add credits
RESPONSE=$(curl -s -X POST "$BASE_URL/api/user/add-credits" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"credits\": $CREDITS}")

echo "Add credits response: $RESPONSE"