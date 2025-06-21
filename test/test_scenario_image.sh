#!/bin/bash

# Test script for scenario image upload functionality
# This script tests the image upload endpoint by uploading test images

set -e  # Exit on any error

# Configuration
BASE_URL="http://localhost:5000"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="password123"
TEST_IMAGE="./test/test_images/test_scenario_cover.jpg"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Scenario Image Upload Test Script ===${NC}"
echo "Testing scenario image upload functionality..."
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

# Check if test image exists
echo -e "${YELLOW}2. Checking for test image...${NC}"
if [ ! -f "$TEST_IMAGE" ]; then
    echo -e "${RED}❌ Test image not found at $TEST_IMAGE${NC}"
    echo "Creating test image..."
    
    # Create test image using Python
    python3 -c "
from PIL import Image
import os

# Create test images directory if it doesn't exist
os.makedirs('test/test_images', exist_ok=True)

# Create a simple test image
img = Image.new('RGB', (400, 300), color=(135, 206, 235))
from PIL import ImageDraw
draw = ImageDraw.Draw(img)
center_x, center_y = 200, 150
radius = 50
draw.ellipse([center_x-radius, center_y-radius, center_x+radius, center_y+radius], fill=(255, 0, 0))
img.save('test/test_images/test_scenario_cover.jpg', 'JPEG', quality=85)
print('Test image created')
"
fi
echo -e "${GREEN}✅ Test image available${NC}"

# Login to get token
echo -e "${YELLOW}3. Logging in to get access token...${NC}"
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

# Create test scenario
echo -e "${YELLOW}4. Creating test scenario...${NC}"
SCENARIO_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/scenario" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -d '{
        "title": "Test Scenario for Image Upload",
        "synopsis": "A test scenario to verify image upload functionality",
        "userId": "test-user",
        "writingStyle": {
            "style": "Narrative",
            "genre": "Fantasy"
        }
    }')

if echo "$SCENARIO_RESPONSE" | grep -q "id"; then
    SCENARIO_ID=$(echo "$SCENARIO_RESPONSE" | jq -r '.id')
    echo -e "${GREEN}✅ Test scenario created with ID: ${SCENARIO_ID}${NC}"
else
    echo -e "${RED}❌ Failed to create test scenario${NC}"
    echo "Response: $SCENARIO_RESPONSE"
    exit 1
fi

# Upload image
echo -e "${YELLOW}5. Uploading scenario image...${NC}"
UPLOAD_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/scenario/${SCENARIO_ID}/upload-image" \
    -H "Authorization: Bearer ${TOKEN}" \
    -F "image=@${TEST_IMAGE}")

if echo "$UPLOAD_RESPONSE" | grep -q "imageId"; then
    echo -e "${GREEN}✅ Image upload successful${NC}"
    IMAGE_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.imageId')
    IMAGE_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.imageUrl')
    echo "Image ID: $IMAGE_ID"
    echo "Image URL: $IMAGE_URL"
    
    # Test image access
    echo -e "${YELLOW}6. Testing image access...${NC}"
    if curl -s -f "${BASE_URL}${IMAGE_URL}" > /dev/null; then
        echo -e "${GREEN}✅ Image accessible via URL${NC}"
    else
        echo -e "${RED}❌ Image not accessible via URL${NC}"
    fi
else
    echo -e "${RED}❌ Image upload failed${NC}"
    echo "Response: $UPLOAD_RESPONSE"
fi

# Delete image
echo -e "${YELLOW}7. Testing image deletion...${NC}"
DELETE_RESPONSE=$(curl -s -X DELETE "${BASE_URL}/api/scenario/${SCENARIO_ID}/delete-image" \
    -H "Authorization: Bearer ${TOKEN}")

if echo "$DELETE_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Image deletion successful${NC}"
else
    echo -e "${RED}❌ Image deletion failed${NC}"
    echo "Response: $DELETE_RESPONSE"
fi

# Clean up test scenario
echo -e "${YELLOW}8. Cleaning up test scenario...${NC}"
CLEANUP_RESPONSE=$(curl -s -X DELETE "${BASE_URL}/api/scenario/${SCENARIO_ID}" \
    -H "Authorization: Bearer ${TOKEN}")

if echo "$CLEANUP_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Test scenario cleaned up${NC}"
else
    echo -e "${YELLOW}⚠️ Failed to clean up test scenario${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Scenario image upload test completed!${NC}"
