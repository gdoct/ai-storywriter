# Character Field Generation Feature

This feature allows users to generate individual character field values using AI, based on the character's existing properties and the story context.

## How it Works

1. **Generate Button**: Each character field in the edit form now has a small "✨" button next to it
2. **Context-Aware**: The AI considers:
   - The character's other filled properties
   - The story's genre, tone, and theme
   - Other characters in the scenario
   - Field-specific requirements
3. **Streaming Results**: Generated values appear in real-time as the AI writes them
4. **Form Disabled**: The entire form is disabled during generation to prevent conflicts

## Field-Specific Generation

### Name
- Considers gender, role, and genre
- Generates names that fit the story world

### Alias
- Creates nicknames that reflect personality or background
- Fits the genre setting

### Role
- Determines appropriate story function
- Based on other character traits

### Gender
- Considers name, role, and story context

### Physical Appearance
- 2-3 sentence descriptions
- Focuses on distinctive features
- Matches personality and role

### Backstory
- Compelling 2-3 sentence background
- Includes formative experiences
- Relevant to genre and story

### Extra Information
- Additional character details
- Skills, personality traits, motivations
- 2-3 memorable details

## User Interface

- **✨ Button**: Click to generate field value
- **× Button**: Appears during generation to cancel
- **Streaming Text**: Shows AI output in real-time
- **Form Lock**: All fields disabled during generation
- **Error Handling**: Graceful fallback if generation fails

## Technical Implementation

### Files Modified/Created:
- `llmPromptService.ts`: Added `createCharacterFieldPrompt()` function
- `characterFieldGenerator.ts`: New service for field generation
- `CharactersTab.tsx`: Added UI components and state management
- `TabStylesNew.css`: Added styles for generation buttons

### Key Features:
- Streaming AI responses
- Context-aware prompts
- Form state management
- Error handling
- Cancellation support
