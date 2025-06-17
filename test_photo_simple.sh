#!/bin/bash

# Simple test script for character photo upload - single test with detailed output
set -e

# Configuration
BASE_URL="http://localhost:5000"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="password123"
UPLOAD_DIR="./backend/uploads/character_photos"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Simple Photo Upload Test ===${NC}"

# Find first test image
TEST_IMAGE=""
for img in "$UPLOAD_DIR"/*.jpg "$UPLOAD_DIR"/*.jpeg "$UPLOAD_DIR"/*.png; do
    if [ -f "$img" ]; then
        TEST_IMAGE="$img"
        break
    fi
done

if [ -z "$TEST_IMAGE" ]; then
    echo "❌ No test images found in $UPLOAD_DIR"
    exit 1
fi

echo -e "${YELLOW}Using test image: $(basename "$TEST_IMAGE")${NC}"

# Login
echo -e "${YELLOW}Getting access token...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token' 2>/dev/null || echo "")

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo "❌ Login failed"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Login successful${NC}"

# Upload photo with detailed character information
echo -e "${YELLOW}Uploading photo with character details...${NC}"
echo ""

RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "${BASE_URL}/api/characters/create-from-photo" \
    -H "Authorization: Bearer ${TOKEN}" \
    -F "photo=@${TEST_IMAGE}" \
    -F "scenarioId=test-scenario-detailed" \
    -F "characterName=" \
    -F "characterRole=protagonist" \
    -F "additionalPrompt=")

# Extract HTTP status and body
HTTP_STATUS=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
BODY=$(echo "$RESPONSE" | sed -E 's/HTTPSTATUS:[0-9]{3}$//')

echo -e "${BLUE}HTTP Status: ${HTTP_STATUS}${NC}"
echo ""
echo -e "${BLUE}Full Response:${NC}"
echo "$BODY"
echo ""

# Try to format as JSON if possible
echo -e "${BLUE}Formatted Response:${NC}"
if echo "$BODY" | jq '.' >/dev/null 2>&1; then
    echo "$BODY" | jq '.'
else
    echo "Response is not valid JSON:"
    echo "$BODY"
fi

echo ""
echo -e "${GREEN}Test complete!${NC}"
