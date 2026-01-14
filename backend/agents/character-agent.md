# feature: character agent
this agent is meant to generate or modify characters
optionally it can use an image as input for a multimodal model
optionally it can generate an image

## API Specification

the agent should be integrated with the current fastapi/langgraph setup in the backend
the agent should be reachable through these API endpoints:
- /agent/character/generate
data: scenario json, optional binary image input, optional image uri (user can provide either image or url), optional image generation flag
response: character json, uri to optional generated image
- /agent/character/modify
data: scenario json, character id, field names to modify, optional image input, optional image generation flag
response: updated character json

the response of these api endpoints should be streaming in SSEs

if an image input is provided and no multimodal endpoint is configured for the user, throw an error
if an image generation flag is provided and no image generation endpoint is configured for the user, throw an error

each text item for the character should be generated separately and streamed as soon as available for example, the name should be generated and streamed before the description is generated. the client can then parse the partial json from the response and update the character in the UI as soon as a new item is available

## Implementation Task List

### 1. **Core Infrastructure**
- [x] Create `character_agent.py` router in `/presentation/routers/`
- [x] Define Pydantic models for character agent requests/responses
- [x] Add character agent router to `app.py` with `/api/agent/character` prefix
- [x] Create character agent service class in `/domain/services/`

### 2. **LangGraph Agent Integration**
- [x] Create character agent graph definition in `/agents/character_agent/character_graph.py`
- [x] Implement character generation node with progressive field streaming
- [x] Implement character modification node with selective field updates
- [x] Add multimodal image analysis node for image input processing
- [x] Add image generation node for character portrait creation (placeholder)

### 3. **Service Layer Components**
- [x] Extend multimodal service to handle character image analysis
- [x] Extend image generation service for character-specific prompts (placeholder)
- [x] Create character field extraction and validation logic
- [x] Implement progressive JSON streaming for character fields
- [x] Add service configuration validation (multimodal/image gen availability)

### 4. **API Endpoint Implementation**
- [x] `/agent/character/generate` endpoint with SSE streaming
- [x] `/agent/character/modify` endpoint with SSE streaming
- [x] Request validation for image inputs (binary/URI)
- [x] Error handling for missing service configurations
- [x] Authentication and authorization integration

### 5. **Data Models & Validation**
- [x] Character generation request model (scenario, image options, flags)
- [x] Character modification request model (character ID, fields, options)
- [x] Character response model with optional image URI
- [x] Streaming response models for progressive updates
- [x] Image input validation (binary data vs URI)

### 6. **Integration & Testing**
- [ ] Unit tests for character agent service
- [ ] Integration tests with multimodal/image generation services
- [ ] End-to-end API tests for both endpoints
- [ ] Mock services for testing without external dependencies
- [ ] Load testing for streaming performance

### 7. **Error Handling & Monitoring**
- [ ] Service availability checks and error responses
- [ ] Graceful degradation when optional services unavailable
- [ ] Logging and monitoring for agent performance
- [ ] Rate limiting for character generation requests
- [ ] Timeout handling for long-running operations

## Implementation Priority

**Phase 1 (Core):** Tasks 1-2 - Basic router and LangGraph integration
**Phase 2 (Services):** Task 3 - Service layer and streaming logic
**Phase 3 (API):** Task 4 - Complete API endpoints with SSE
**Phase 4 (Quality):** Tasks 5-7 - Models, testing, and production readiness

## Architecture Integration Notes

- ✅ Properly integrates with existing FastAPI/LangGraph setup
- ✅ Follows current patterns with `/agent/*` endpoints
- ✅ Leverages existing multimodal and image generation services
- ✅ Supports streaming SSE responses like current streaming_agent
- ✅ Includes proper error handling for missing service configurations
- ✅ Implements progressive streaming of character fields
- ✅ Matches existing proxy pattern (`multimodal_proxy.py`, `image_proxy.py`)
- ✅ Compatible with LangGraph workflow system
- ✅ Uses established authentication/authorization patterns
