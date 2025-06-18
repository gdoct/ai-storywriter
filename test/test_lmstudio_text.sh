#!/bin/bash

# Simple LM Studio text-only test - generates character without image analysis
set -e

# Configuration
LMSTUDIO_URL="http://192.168.32.1:1234"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== LM Studio Text-Only Character Generation Test ===${NC}"

# Check if LM Studio is running
echo -e "${YELLOW}Checking LM Studio connection...${NC}"
if ! curl -s -f "${LMSTUDIO_URL}/v1/models" > /dev/null; then
    echo -e "${RED}❌ LM Studio is not accessible at ${LMSTUDIO_URL}${NC}"
    echo "Please ensure LM Studio is running at ${LMSTUDIO_URL}"
    exit 1
fi

# Get available models
MODELS_RESPONSE=$(curl -s "${LMSTUDIO_URL}/v1/models")
MODEL_ID=$(echo "$MODELS_RESPONSE" | jq -r '.data[0]?.id // ""' 2>/dev/null || echo "")

if [ -z "$MODEL_ID" ] || [ "$MODEL_ID" = "null" ]; then
    echo -e "${RED}❌ No models available${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Using model: ${MODEL_ID}${NC}"

# Character generation prompt (text-only)
CHARACTER_PROMPT="You are a creative character designer for fantasy stories. Generate a detailed fictional character based on these details:

Character Name: Aria Moonstone
Character Role: protagonist  
Additional Description: A skilled mage with silver hair and piercing blue eyes, carries an ancient staff and has a mysterious connection to the moon

Create a rich, detailed character that would make this character memorable in a story. Make the character feel authentic and three-dimensional.

Respond with ONLY a valid JSON object in this exact format:
{
    \"name\": \"Full character name\",
    \"alias\": \"Nickname or alias (can be empty string if none)\",
    \"role\": \"Character's role in the story\",
    \"gender\": \"Character's gender\",
    \"appearance\": \"Detailed physical description including clothing, build, distinctive features\",
    \"backstory\": \"Brief but compelling background story and history\",
    \"extraInfo\": \"Personality traits, quirks, motivations, fears, or other defining characteristics\"
}

Be creative and detailed."

# Create the API request payload
API_PAYLOAD=$(cat <<EOF
{
    "model": "${MODEL_ID}",
    "messages": [
        {
            "role": "user",
            "content": "${CHARACTER_PROMPT}"
        }
    ],
    "max_tokens": 800,
    "temperature": 0.8
}
EOF
)

# Send request to LM Studio
echo -e "${YELLOW}Generating character with LM Studio...${NC}"
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
    
    echo -e "${BLUE}LM Studio Response:${NC}"
    echo "$LLM_RESPONSE"
    echo ""
    
    # Try to extract and format the JSON character data
    echo -e "${BLUE}Formatted Character JSON:${NC}"
    if echo "$LLM_RESPONSE" | grep -q '{'; then
        # Use regex to extract JSON (handles cases where there's extra text)
        CHARACTER_JSON=$(echo "$LLM_RESPONSE" | grep -o '{.*}' | head -1)
        if [ -n "$CHARACTER_JSON" ]; then
            echo "$CHARACTER_JSON" | jq '.' 2>/dev/null || echo "$CHARACTER_JSON"
        else
            echo "No valid JSON found in response"
        fi
    else
        echo "No JSON structure found in response"
        echo "Raw response: $LLM_RESPONSE"
    fi
    
else
    echo -e "${RED}❌ Request failed${NC}"
    echo -e "${BLUE}Error Response:${NC}"
    echo "$BODY"
fi

echo ""
echo -e "${GREEN}LM Studio text generation test complete!${NC}"
