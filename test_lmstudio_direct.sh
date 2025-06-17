#!/bin/bash

# Direct LM Studio test script - bypasses backend and sends photo directly to LM Studio
set -e

# Configuration
LMSTUDIO_URL="http://192.168.32.1:1234"
UPLOAD_DIR="./backend/uploads/character_photos"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Direct LM Studio Photo Test ===${NC}"

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

# Check if LM Studio is running
echo -e "${YELLOW}Checking LM Studio connection...${NC}"
if ! curl -s -f "${LMSTUDIO_URL}/v1/models" > /dev/null; then
    echo -e "${RED}❌ LM Studio is not accessible at ${LMSTUDIO_URL}${NC}"
    echo "Please ensure:"
    echo "1. LM Studio is running"
    echo "2. A vision-capable model is loaded (e.g., LLaVA, GPT-4V compatible)"
    echo "3. The server is accessible at ${LMSTUDIO_URL}"
    exit 1
fi

# Get available models
echo -e "${YELLOW}Getting available models...${NC}"
MODELS_RESPONSE=$(curl -s "${LMSTUDIO_URL}/v1/models")
echo "Available models:"
echo "$MODELS_RESPONSE" | jq -r '.data[]?.id // "No models found"' 2>/dev/null || echo "$MODELS_RESPONSE"

# Get the first available model
MODEL_ID=$(echo "$MODELS_RESPONSE" | jq -r '.data[0]?.id // ""' 2>/dev/null || echo "")
if [ -z "$MODEL_ID" ] || [ "$MODEL_ID" = "null" ]; then
    echo -e "${RED}❌ No models available${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Using model: ${MODEL_ID}${NC}"

# Convert image to base64
echo -e "${YELLOW}Converting image to base64...${NC}"
IMAGE_BASE64=$(base64 -w 0 "$TEST_IMAGE")
IMAGE_TYPE=$(file --mime-type -b "$TEST_IMAGE")

echo -e "${GREEN}✅ Image converted (${IMAGE_TYPE})${NC}"

# Character generation prompt
CHARACTER_PROMPT="You are a creative character designer for fantasy stories. Analyze this image and generate a detailed fictional character based on what you see.

Character Details to Generate:
- Name: Create an interesting fantasy name
- Role: Choose from Protagonist, Antagonist, Supporting Character, Love Interest, Mentor, Comic Relief
- Gender: Based on appearance
- Appearance: Detailed physical description including clothing, build, distinctive features
- Backstory: Brief but compelling background story
- Personality: Character traits, quirks, motivations, fears

Respond with ONLY a valid JSON object in this exact format:
{
    \"name\": \"Full character name\",
    \"alias\": \"Nickname or alias (can be empty string if none)\",
    \"role\": \"Character's role in the story\",
    \"gender\": \"Character's gender\",
    \"appearance\": \"Detailed physical description including clothing and distinctive features\",
    \"backstory\": \"Brief but compelling background story and history\",
    \"extraInfo\": \"Personality traits, quirks, motivations, fears, or other defining characteristics\"
}

Make the character feel authentic and three-dimensional. Be creative and detailed."

# Create the API request payload
API_PAYLOAD=$(cat <<EOF
{
    "model": "${MODEL_ID}",
    "messages": [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "${CHARACTER_PROMPT}"
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "data:${IMAGE_TYPE};base64,${IMAGE_BASE64}"
                    }
                }
            ]
        }
    ],
    "max_tokens": 1000,
    "temperature": 0.8
}
EOF
)

# Send request to LM Studio
echo -e "${YELLOW}Sending image and prompt to LM Studio...${NC}"
echo ""

RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "${LMSTUDIO_URL}/v1/chat/completions" \
    -H "Content-Type: application/json" \
    -d "$API_PAYLOAD")

# Extract HTTP status and body
HTTP_STATUS=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
BODY=$(echo "$RESPONSE" | sed -E 's/HTTPSTATUS:[0-9]{3}$//')

echo -e "${BLUE}HTTP Status: ${HTTP_STATUS}${NC}"
echo ""

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Request successful${NC}"
    echo ""
    
    # Extract the assistant's response
    LLM_RESPONSE=$(echo "$BODY" | jq -r '.choices[0]?.message?.content // "No response content"' 2>/dev/null || echo "Failed to parse response")
    
    echo -e "${BLUE}LM Studio Raw Response:${NC}"
    echo "$LLM_RESPONSE"
    echo ""
    
    # Try to extract and format the JSON character data
    echo -e "${BLUE}Extracted Character JSON:${NC}"
    if echo "$LLM_RESPONSE" | grep -q '{'; then
        # Extract JSON portion (in case there's extra text)
        CHARACTER_JSON=$(echo "$LLM_RESPONSE" | sed -n 's/.*\({.*}\).*/\1/p')
        if [ -n "$CHARACTER_JSON" ]; then
            echo "$CHARACTER_JSON" | jq '.' 2>/dev/null || echo "$CHARACTER_JSON"
        else
            echo "No JSON found in response"
        fi
    else
        echo "No JSON structure found in response"
    fi
    
    echo ""
    echo -e "${BLUE}Full API Response:${NC}"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    
else
    echo -e "${RED}❌ Request failed${NC}"
    echo -e "${BLUE}Error Response:${NC}"
    echo "$BODY"
fi

echo ""
echo -e "${GREEN}Direct LM Studio test complete!${NC}"
