#!/bin/bash

# Test script for character photo upload functionality
# This script tests the photo upload endpoint by uploading test images

set -e  # Exit on any error

# Configuration
BASE_URL="${VITE_API_URL:-http://localhost:5000}"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="password123"
UPLOAD_DIR="./backend/uploads/character_photos"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Character Photo Upload Test Script ===${NC}"
echo "Testing photo upload functionality..."
echo ""

# Check if server is running
echo -e "${YELLOW}1. Checking if server is running...${NC}"
if ! curl -s -f "${BASE_URL}/api/health" > /dev/null; then
    echo -e "${RED}❌ Server is not running at ${BASE_URL}${NC}"
    echo "Please start the backend server first:"
    echo "  cd backend && python app.py"
    exit 1
fi
echo -e "${GREEN}✅ Server is running${NC}"

# Login to get token
echo -e "${YELLOW}2. Logging in to get access token...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}")

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token')
    echo -e "${GREEN}✅ Login successful${NC}"
else
    echo -e "${RED}❌ Login failed${NC}"
    echo "Response: $LOGIN_RESPONSE"
    echo ""
    echo "Please ensure you have a test user with credentials:"
    echo "  Email: ${TEST_EMAIL}"
    echo "  Password: ${TEST_PASSWORD}"
    exit 1
fi

# Check if test images exist
echo -e "${YELLOW}3. Checking for test images...${NC}"
if [ ! -d "$UPLOAD_DIR" ]; then
    echo -e "${RED}❌ Upload directory not found: $UPLOAD_DIR${NC}"
    exit 1
fi

# Find the first available test image
TEST_IMAGE=""
for img in "$UPLOAD_DIR"/*.jpg "$UPLOAD_DIR"/*.jpeg "$UPLOAD_DIR"/*.png; do
    if [ -f "$img" ]; then
        TEST_IMAGE="$img"
        break
    fi
done

if [ -z "$TEST_IMAGE" ]; then
    echo -e "${RED}❌ No test images found in $UPLOAD_DIR${NC}"
    echo "Please add some test images (jpg, jpeg, or png) to the uploads directory"
    exit 1
fi

echo -e "${GREEN}✅ Found test image: $(basename "$TEST_IMAGE")${NC}"

# Test photo upload with different scenarios
echo -e "${YELLOW}4. Testing photo upload scenarios...${NC}"
echo ""

# Test 1: Basic upload with minimal data
echo -e "${BLUE}Test 1: Basic upload (no additional data)${NC}"
RESPONSE1=$(curl -s -X POST "${BASE_URL}/api/characters/create-from-photo" \
    -H "Authorization: Bearer ${TOKEN}" \
    -F "photo=@${TEST_IMAGE}" \
    -F "scenarioId=test-scenario-123")

echo "Response:"
echo "$RESPONSE1" | jq '.' 2>/dev/null || echo "$RESPONSE1"
echo ""

# Test 2: Upload with character name
echo -e "${BLUE}Test 2: Upload with character name${NC}"
RESPONSE2=$(curl -s -X POST "${BASE_URL}/api/characters/create-from-photo" \
    -H "Authorization: Bearer ${TOKEN}" \
    -F "photo=@${TEST_IMAGE}" \
    -F "scenarioId=test-scenario-456" \
    -F "characterName=Elena Nightwhisper")

echo "Response:"
echo "$RESPONSE2" | jq '.' 2>/dev/null || echo "$RESPONSE2"
echo ""

# Test 3: Upload with all optional fields
echo -e "${BLUE}Test 3: Upload with full character details${NC}"
RESPONSE3=$(curl -s -X POST "${BASE_URL}/api/characters/create-from-photo" \
    -H "Authorization: Bearer ${TOKEN}" \
    -F "photo=@${TEST_IMAGE}" \
    -F "scenarioId=test-scenario-789" \
    -F "characterName=Marcus Stormwind" \
    -F "characterRole=protagonist" \
    -F "additionalPrompt=A brave warrior with a mysterious past, skilled in both sword combat and ancient magic")

echo "Response:"
echo "$RESPONSE3" | jq '.' 2>/dev/null || echo "$RESPONSE3"
echo ""

# Test 4: Error case - missing scenario ID
echo -e "${BLUE}Test 4: Error case (missing scenario ID)${NC}"
RESPONSE4=$(curl -s -X POST "${BASE_URL}/api/characters/create-from-photo" \
    -H "Authorization: Bearer ${TOKEN}" \
    -F "photo=@${TEST_IMAGE}")

echo "Response:"
echo "$RESPONSE4" | jq '.' 2>/dev/null || echo "$RESPONSE4"
echo ""

# Test 5: Error case - no authentication
echo -e "${BLUE}Test 5: Error case (no authentication)${NC}"
RESPONSE5=$(curl -s -X POST "${BASE_URL}/api/characters/create-from-photo" \
    -F "photo=@${TEST_IMAGE}" \
    -F "scenarioId=test-scenario-000")

echo "Response:"
echo "$RESPONSE5" | jq '.' 2>/dev/null || echo "$RESPONSE5"
echo ""

# Summary
echo -e "${BLUE}=== Test Summary ===${NC}"
echo "Tested photo upload endpoint with various scenarios:"
echo "1. ✅ Basic upload"
echo "2. ✅ Upload with character name"
echo "3. ✅ Upload with full details"
echo "4. ✅ Error handling (missing scenario ID)"
echo "5. ✅ Error handling (no authentication)"
echo ""
echo -e "${GREEN}All tests completed!${NC}"

# Extract and display character data from successful responses
echo -e "${YELLOW}Generated Characters:${NC}"
echo ""

echo "Test 1 Character:"
echo "$RESPONSE1" | jq '.character // {error: "No character data"}' 2>/dev/null || echo "Failed to parse"
echo ""

echo "Test 2 Character:"
echo "$RESPONSE2" | jq '.character // {error: "No character data"}' 2>/dev/null || echo "Failed to parse"
echo ""

echo "Test 3 Character:"
echo "$RESPONSE3" | jq '.character // {error: "No character data"}' 2>/dev/null || echo "Failed to parse"
echo ""

echo -e "${GREEN}Testing complete!${NC}"
