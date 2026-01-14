# Story Generator Agent

## Overview
The Story Generator Agent is a LangGraph-based agent responsible for generating complete stories from scenario data. This agent is part of the broader initiative to refactor all user prompts from the frontend into backend agents for better maintainability, consistency, and centralized prompt management.

## Core Responsibilities
- **Scenario Processing**: Analyze and process all components of a scenario (characters, backstory, plot, settings, etc.)
- **Prompt Engineering**: Transform scenario data into optimized story generation prompts
- **Story Generation**: Generate high-quality stories using configured LLM models
- **Streaming Output**: Deliver story content token-by-token for real-time user experience
- **Model Integration**: Respect user model settings and backend configurations

## Architecture

### LangGraph Implementation
Based on the ScenarioEditor tabs, the agent processes these scenario components:

```
StoryGeneratorGraph:
├── scenario_analysis_node        # Analyze and validate scenario structure
├── general_processing_node       # Process title, synopsis, and style settings
├── characters_processing_node    # Process character data and relationships
├── locations_processing_node     # Process location descriptions and context
├── backstory_processing_node     # Extract and organize backstory elements
├── storyarc_processing_node      # Process story arc and narrative structure
├── timeline_processing_node      # Process timeline events and sequencing
├── notes_processing_node         # Incorporate additional notes and context
├── custom_prompts_processing_node # Handle custom prompt settings
├── fillin_processing_node        # Process fill-in story segments
├── prompt_construction_node      # Build final story generation prompt
├── story_generation_node         # Generate story using LLM
└── output_formatting_node        # Format and stream output
```

### Node Responsibilities

#### 1. Scenario Analysis Node
- Validate scenario JSON structure
- Identify available components across all tabs
- Determine story generation strategy based on available data
- Route processing to appropriate subnodes

#### 2. General Processing Node (GeneralTab)
- Process **title** and **synopsis** for story foundation
- Extract **StyleSettings**: genre, tone, theme, writing style, language
- Handle **story length** and **perspective** preferences
- Build narrative voice and style context

#### 3. Characters Processing Node (CharactersTab)
- Process **Character** objects with full details:
  - Basic info: name, alias, role, gender
  - Descriptions: appearance, backstory, extraInfo
  - Visual data: photoId, photoUrl, photo_data (if multimodal enabled)
- Build character relationship maps
- Create consistent character voice guidelines
- Handle character-driven narrative elements

#### 4. Locations Processing Node (LocationsTab)
- Process **Location** objects with complete details:
  - Basic info: name, visualDescription
  - Context: background, extraInfo
  - Visual data: imageId, imageUrl, image_data (if multimodal enabled)
- Build world-building context
- Create environmental atmosphere
- Handle location-based scene descriptions

#### 5. Backstory Processing Node (BackstoryTab)
- Extract and parse **backstory** text content
- Identify historical events and context
- Build narrative foundation and world history
- Connect backstory to current story timeline

#### 6. StoryArc Processing Node (StoryArcTab)
- Process **storyarc** structure and progression
- Analyze plot points and narrative beats
- Plan story pacing and dramatic structure
- Handle three-act structure or custom progressions

#### 7. Timeline Processing Node (TimelineTab)
- Process **TimelineEvent** objects:
  - Event details: title, description, date, location
  - Participants: charactersInvolved
  - Story integration: includeInStory flag
  - Relationships: connections (inputs/outputs)
- Build chronological event sequences
- Separate story events from backstory context
- Handle parallel event timelines

#### 8. Notes Processing Node (NotesTab)
- Incorporate **notes** as additional context
- Extract writer's intent and special instructions
- Handle meta-narrative guidance
- Preserve creative direction and preferences

#### 9. Custom Prompts Processing Node (CustomPromptTab)
- Process **PromptSettings**:
  - systemPromptPrefix: Custom system instructions
  - userPromptPrefix: Custom user prompt modifications
  - keywords: Important terms and concepts
- Integrate custom prompts with base templates
- Handle user-specific prompt engineering

#### 10. FillIn Processing Node (FillInTab)
- Process **FillIn** story segments:
  - beginning: Pre-written story opening
  - ending: Pre-written story conclusion
- Handle partial story completion scenarios
- Maintain consistency with existing content
- Bridge gaps between pre-written segments

#### 11. Prompt Construction Node
- **Central Prompt Repository**: All story generation prompts centralized here
- Combine all processed scenario elements into optimized prompts
- Apply prompt engineering best practices
- Handle conditional prompt sections based on available data
- Inject context from all processed nodes

#### 12. Story Generation Node
- Execute story generation using user's configured model
- Handle streaming output with proper error handling
- Apply user's model settings (temperature, etc.)
- Manage token counting for credit deduction
- Support different story lengths and formats

#### 13. Output Formatting Node
- Format story output for client consumption
- Handle markdown formatting if needed
- Manage streaming response packaging
- Support different export formats (text, markdown, chapters)

## API Specification

### Authentication & Authorization
- **JWT Token Validation**: Required for all endpoints
- **Role-Based Access**: Support for user/moderator/admin roles
- **Mode Support**: Both BYOK and member modes
- **Credit Validation**: Verify sufficient credits for member mode

### Endpoint: `/api/agent/story/generate`

#### Request Format
Based on the ScenarioEditor tabs structure:

```json
{
  "scenario": {
    "id": "string",
    "userId": "string",
    "title": "string",
    "synopsis": "string",

    // GeneralTab - StyleSettings
    "writingStyle": {
      "style": "string",
      "genre": "string",
      "tone": "string",
      "communicationStyle": "string",
      "theme": "string",
      "other": "string",
      "language": "string"
    },

    // CharactersTab
    "characters": [
      {
        "id": "string",
        "name": "string",
        "alias": "string",
        "role": "string",
        "gender": "string",
        "appearance": "string",
        "backstory": "string",
        "extraInfo": "string",
        "photoId": "string",
        "photoUrl": "string",
        "photo_data": "string",
        "photo_mime_type": "string"
      }
    ],

    // LocationsTab
    "locations": [
      {
        "id": "string",
        "name": "string",
        "visualDescription": "string",
        "background": "string",
        "extraInfo": "string",
        "imageId": "string",
        "imageUrl": "string",
        "image_data": "string",
        "image_mime_type": "string"
      }
    ],

    // BackstoryTab
    "backstory": "string",

    // StoryArcTab
    "storyarc": "string",

    // TimelineTab
    "timeline": [
      {
        "id": "string",
        "title": "string",
        "description": "string",
        "date": "string",
        "location": "string",
        "charactersInvolved": ["string"],
        "includeInStory": boolean,
        "position": {"x": number, "y": number},
        "connections": {
          "inputs": ["string"],
          "outputs": ["string"]
        }
      }
    ],

    // NotesTab
    "notes": "string",

    // CustomPromptTab
    "promptSettings": {
      "systemPromptPrefix": "string",
      "userPromptPrefix": "string",
      "keywords": "string"
    },

    // FillInTab
    "fillIn": {
      "beginning": "string",
      "ending": "string"
    }
  },

  "generation_options": {
    "model": "string",
    "temperature": 0.8,
    "max_tokens": 2000,
    "seed": null,
    "stream": true
  }
}
```

#### Response Format (SSE Stream)
```
data: {"type": "status", "message": "Analyzing scenario structure..."}

data: {"type": "progress", "step": "general_processing", "progress": 0.1, "message": "Processing title and style settings"}

data: {"type": "progress", "step": "characters_processing", "progress": 0.2, "message": "Processing 3 characters"}

data: {"type": "progress", "step": "locations_processing", "progress": 0.3, "message": "Processing 2 locations"}

data: {"type": "progress", "step": "backstory_processing", "progress": 0.4, "message": "Integrating backstory context"}

data: {"type": "progress", "step": "timeline_processing", "progress": 0.5, "message": "Processing 5 timeline events"}

data: {"type": "progress", "step": "prompt_construction", "progress": 0.7, "message": "Building story generation prompt"}

data: {"type": "status", "message": "Generating story..."}

data: {"type": "content", "text": "Once upon a time..."}

data: {"type": "content", "text": " in a distant kingdom..."}

data: {"type": "complete", "total_tokens": 1500, "credits_used": 1500, "processing_summary": {"nodes_processed": 8, "characters": 3, "locations": 2, "timeline_events": 5}}
```

### Error Handling
- **400 Bad Request**: Invalid scenario data or missing required fields
- **402 Payment Required**: Insufficient credits for member mode
- **403 Forbidden**: BYOK mode without valid API configuration
- **503 Service Unavailable**: LLM backend not available
- **500 Internal Server Error**: Agent processing errors

## Prompt Management Strategy

### Centralized Prompt System
- **Base Templates**: Core story generation prompt templates
- **Component Injectors**: Specialized prompts for different scenario elements
- **Style Modifiers**: Prompts that adjust tone, genre, and perspective
- **Context Builders**: Prompts that maintain consistency across story sections

### Prompt Migration from Frontend
1. **Audit**: Identify all story-related prompts in `storyGenerator.ts`
2. **Extract**: Move prompts to agent prompt repository
3. **Enhance**: Improve prompts with backend-specific optimizations
4. **Template**: Create reusable prompt templates with variable injection
5. **Test**: Validate prompt effectiveness with various scenarios

### Prompt Categories
```
story_prompts/
├── base_templates/
│   ├── narrative_foundation.txt
│   ├── character_driven_story.txt
│   └── plot_driven_story.txt
├── component_injectors/
│   ├── character_context.txt
│   ├── backstory_integration.txt
│   └── setting_atmosphere.txt
├── style_modifiers/
│   ├── genre_specific/
│   ├── tone_adjustments/
│   └── perspective_shifts/
└── context_builders/
    ├── consistency_maintenance.txt
    └── narrative_flow.txt
```

## Integration Requirements

### Database Integration
- **Token Tracking**: Record token usage in credit transactions table
- **Story Storage**: Save generated stories with metadata
- **User Preferences**: Respect user's model and style preferences

### Model Configuration
- **User Settings**: Use user's configured text generation model
- **Backend Validation**: Validate model availability before generation
- **Credit Calculation**: Accurate token counting for billing

### Streaming Infrastructure
- **Server-Sent Events**: Real-time story delivery
- **Error Recovery**: Graceful handling of stream interruptions
- **Progress Tracking**: User feedback during generation process

## Future Enhancements

### Advanced Features
- **Multi-Part Stories**: Support for chapter-based story generation
- **Interactive Elements**: User guidance during story generation
- **Style Learning**: Adapt to user's preferred writing styles
- **Collaboration**: Multi-user story development support

### Quality Improvements
- **Content Filtering**: Ensure appropriate content generation
- **Consistency Checking**: Validate story coherence across sections
- **Revision Suggestions**: Offer story improvement recommendations
- **Export Options**: Multiple format support (markdown, PDF, etc.)

## Success Metrics
- **Response Time**: < 2 seconds for first token
- **Generation Quality**: User satisfaction ratings
- **Token Efficiency**: Optimal prompt-to-output ratios
- **Error Rate**: < 1% failed generations
- **Credit Accuracy**: Precise token counting

## Implementation Priority
1. **Phase 1**: Basic story generation with core scenario processing
2. **Phase 2**: Advanced prompt engineering and style customization
3. **Phase 3**: Multi-part stories and interactive features
4. **Phase 4**: Quality enhancements and advanced integrations

