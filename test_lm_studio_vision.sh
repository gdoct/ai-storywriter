#!/bin/bash

# Simple LM Studio Vision Test
# Upload an image and get text response

set -e

# Configuration
LM_STUDIO_URL="http://192.168.32.1:1234"
UPLOAD_DIR="./backend/uploads/character_photos"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== LM Studio Vision Test ===${NC}"

# Find first test image
TEST_IMAGE=""
for img in "$UPLOAD_DIR"/*.jpg "$UPLOAD_DIR"/*.jpeg "$UPLOAD_DIR"/*.png; do
    if [ -f "$img" ]; then
        TEST_IMAGE="$img"
        break
    fi
done

if [ -z "$TEST_IMAGE" ]; then
    echo -e "${RED}❌ No test images found in $UPLOAD_DIR${NC}"
    exit 1
fi

echo -e "${YELLOW}Using test image: $(basename "$TEST_IMAGE")${NC}"

# Convert image to base64
echo -e "${YELLOW}Converting image to base64...${NC}"
IMAGE_BASE64=$(base64 -w 0 "$TEST_IMAGE")
IMAGE_TYPE=$(file -b --mime-type "$TEST_IMAGE")

echo "Image type: $IMAGE_TYPE"
echo ""

# Send vision request using the working format
echo -e "${YELLOW}Sending vision request to LM Studio...${NC}"

RESPONSE=$(curl -s -X POST "${LM_STUDIO_URL}/v1/chat/completions" \
    -H "Content-Type: application/json" \
    -d "{
        \"model\": \"google/gemma-3-4b\",
        \"messages\": [
            {
                \"role\": \"user\",
                \"content\": [
                    {
                        \"type\": \"text\",
                        \"text\": \"Describe what you see in this image.\"
                    },
                    {
                        \"type\": \"image_url\",
                        \"image_url\": {
                            \"url\": \"data:${IMAGE_TYPE};base64,${IMAGE_BASE64}\"
                        }
                    }
                ]
            }
        ],
        \"max_tokens\": 200
    }")

echo -e "${GREEN}✅ Request sent${NC}"
echo ""

# Display the response
echo -e "${BLUE}LM Studio Response:${NC}"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Extract just the text content
echo -e "${BLUE}Generated Text:${NC}"
TEXT_CONTENT=$(echo "$RESPONSE" | jq -r '.choices[0].message.content' 2>/dev/null || echo "Failed to parse")
echo "$TEXT_CONTENT"
echo ""

echo -e "${GREEN}Vision test complete!${NC}"
