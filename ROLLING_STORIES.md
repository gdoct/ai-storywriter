# Feature: Rolling Stories

Interactive story generation where users create stories paragraph by paragraph from a scenario. Users can request the next paragraph, request N paragraphs at once, or be presented with choices that shape the narrative direction.

## End Goal

Interactive "choose your own adventure" style story generation where the user is periodically given choices that affect the story's direction. The mechanics below must be in place first.

## Strategy

The core approach is to provide the LLM with:
1. The original scenario
2. A **Running Storyline** - a structured summary of where the story is, including current situation, tension level, active plot threads, and what should happen next
3. The Story Bible (established facts)
4. Recent story events
5. The last 2 paragraphs (for continuity)

This allows the LLM to write the next paragraph in context. This can theoretically go on forever.

### Running Storyline

The Running Storyline is the key to narrative coherence. Before each 8-paragraph cycle, the system generates a storyline plan:

```json
{
  "current_situation": "Elena has just discovered the hidden door...",
  "tension_level": "building",
  "active_threads": ["mysterious map", "missing brother", "time pressure"],
  "next_beat": "Elena should explore the passage, discovering a clue",
  "pacing_notes": "Slow down, let the atmosphere build"
}
```

This ensures:
- Paragraphs flow naturally into each other
- Story doesn't rush through plot points
- Tension ebbs and flows appropriately
- User choices affect the storyline direction

### User Storyline Influence

Users can provide freeform input to influence the running storyline. Examples:
- "Focus more on the romantic subplot"
- "Speed up the action"
- "I want more mystery and suspense"
- "Let the protagonist fail here"

This is passed in the `storyline_influence` field of the generate request.

## 2-Tier Summarization

To maintain coherence over long stories, we use a 2-tier summarization approach:

### Tier 1: Story Bible (Facts)
A structured record of established facts that must remain consistent:
- **Characters**: Names, descriptions, relationships, traits
- **Setting**: Locations, time period, world rules
- **Objects**: Important items, their properties and locations

### Tier 2: Story Events (Narrative)
A chronological log of significant story developments:
- **Key events**: Major plot points and turning points
- **Decisions**: Choices made by characters that affect the story direction
- **Consequences**: Outcomes of actions and decisions
- **Unresolved threads**: Open questions, foreshadowing, pending conflicts

## Context Assembly

When generating the next paragraph, the LLM receives:
1. Original scenario (establishes premise and tone)
2. Story Bible (facts for consistency)
3. Recent story events (narrative context)
4. Last paragraph (immediate continuation point)

This separation prevents fact drift while preserving narrative flow.

## User Flow

1. **Start**: User selects a scenario and creates a new rolling story
2. **Initial Generation**: Agent generates 8 paragraphs as the opening
3. **Choice Point**: User is presented with 3 choices:
   - **Positive action** - optimistic/heroic/constructive direction
   - **Negative action** - dark/risky/destructive direction
   - **Neutral action** - cautious/balanced/observational direction
4. **Continue**: User selects a choice, agent generates next 8 paragraphs influenced by that choice
5. **Repeat**: Steps 3-4 continue until user ends the story

## Frontend Responsibilities

The frontend maintains the summarization state and provides it to the agent for each generation cycle:

- **Store Story Bible**: Keep the current bible (characters, settings, objects) in state
- **Store Story Events**: Keep the event timeline in state
- **Provide Context**: Send bible + events + last paragraph to backend for each generation request
- **Display Choices**: Present the 3 action choices after each generation cycle
- **Update State**: Merge returned bible/event updates after each generation

### Frontend State Shape
```typescript
interface RollingStoryState {
  storyId: number;
  paragraphs: StoryParagraph[];
  bible: StoryBibleEntry[];
  events: StoryEvent[];
  currentChoices: Choice[] | null;  // null during generation
  status: 'generating' | 'awaiting_choice' | 'completed';
}

interface Choice {
  type: 'positive' | 'negative' | 'neutral';
  description: string;  // e.g., "Confront the stranger directly"
}
```

### UI Components
- **Story Reader**: Displays paragraphs as they're generated (streaming)
- **Choice Selector**: Shows 3 choices after each 8-paragraph cycle
- **Story Bible Panel**: Collapsible sidebar showing characters, settings, objects
- **Event Timeline**: Collapsible view of key events and decisions made

## Data Model

### RollingStory
| Field | Type | Description |
|-------|------|-------------|
| id | int | Primary key |
| scenario_id | int | FK to source scenario |
| user_id | int | FK to owner |
| title | string | User-defined or auto-generated title |
| status | enum | draft, in_progress, completed, abandoned |
| created_at | datetime | Creation timestamp |
| updated_at | datetime | Last modification |

### StoryParagraph
| Field | Type | Description |
|-------|------|-------------|
| id | int | Primary key |
| rolling_story_id | int | FK to parent story |
| sequence | int | Order in story (1, 2, 3...) |
| content | text | The paragraph text |
| created_at | datetime | When generated |

### StoryBible (Tier 1)
| Field | Type | Description |
|-------|------|-------------|
| id | int | Primary key |
| rolling_story_id | int | FK to parent story |
| category | enum | character, setting, object |
| name | string | Entity name |
| details | JSON | Structured facts about the entity |
| introduced_at | int | Paragraph sequence where first mentioned |

### StoryEvent (Tier 2)
| Field | Type | Description |
|-------|------|-------------|
| id | int | Primary key |
| rolling_story_id | int | FK to parent story |
| paragraph_id | int | FK to paragraph where event occurred |
| event_type | enum | key_event, decision, consequence, unresolved |
| summary | text | Brief description of the event |
| resolved | bool | For unresolved threads, whether resolved later |

## API Endpoints

### Story Management
- `POST /api/rolling-stories` - Create new rolling story from scenario
- `GET /api/rolling-stories` - List user's rolling stories
- `GET /api/rolling-stories/{id}` - Get story with paragraphs
- `DELETE /api/rolling-stories/{id}` - Delete story

### Paragraph Generation
- `POST /api/rolling-stories/{id}/generate` - Generate next 8 paragraphs + choices
  - Body: `{ "bible": [...], "events": [...], "chosen_action": "positive" | "negative" | "neutral" | null }`
  - `chosen_action` is null for initial generation, set for subsequent cycles
  - Returns: `{ paragraphs: [...], bible_updates: [...], event_updates: [...], choices: [...] }`

### Story Bible & Events
- `GET /api/rolling-stories/{id}/bible` - Get story bible entries
- `PUT /api/rolling-stories/{id}/bible/{entry_id}` - Update bible entry
- `GET /api/rolling-stories/{id}/events` - Get story events timeline

## Agent Architecture

Rolling stories require a **separate LangGraph agent** distinct from the existing story generation agent. This is necessary because:

1. **Iterative nature**: Rolling stories generate content incrementally over many sessions, unlike one-shot story generation
2. **State management**: Must maintain and update the 2-tier summarization state between generations
3. **Multiple LLM calls per generation**: Each paragraph requires generation + extraction steps
4. **Different context assembly**: Uses bible/events instead of full story text

### RollingStoryAgent

A **single-agent StateGraph** (not a supervisor pattern). This is a linear pipeline with a conditional loop - no routing or orchestration between multiple agents is needed.

Nodes:

```
┌─────────────────┐
│  assemble_context │  ← Gather scenario, bible, events, last paragraph, chosen_action
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ generate_paragraph │  ← LLM generates next paragraph (influenced by chosen_action)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  extract_updates  │  ← LLM extracts bible/event updates from new paragraph
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     persist       │  ← Save paragraph, bible, events to DB
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  check_continue   │  ← If < 8 paragraphs, loop back to assemble_context
└────────┬────────┘
         │ (after 8 paragraphs)
         ▼
┌─────────────────┐
│ generate_choices  │  ← LLM generates 3 choices (positive/negative/neutral)
└─────────────────┘
```

The agent loops 8 times to generate a full cycle, then generates the 3 choices for the user.

## Generation Pipeline

### Step 1: Assemble Context
```
context = {
    scenario: original scenario text,
    bible: current story bible (JSON),
    recent_events: last N story events,
    last_paragraph: most recent paragraph text
}
```

### Step 2: Generate Paragraph
LLM generates next paragraph given the assembled context.

### Step 3: Extract Updates
After generation, a second LLM call (or structured output) extracts:
- New bible entries (characters, settings, objects introduced)
- Updates to existing bible entries
- New story events (key events, decisions, consequences)
- Any resolved threads

### Step 4: Persist
Save paragraph, bible updates, and events to database.

### Step 5: Generate Choices
After 8 paragraphs, LLM generates 3 choices based on current story state:
- **Positive**: An optimistic/heroic/constructive action
- **Negative**: A dark/risky/destructive action
- **Neutral**: A cautious/balanced/observational action

Each choice includes a brief description (e.g., "Confront the stranger directly").

### Step 6: Return
Return all 8 paragraphs + bible/event updates + 3 choices to frontend.

## Implementation Phases

### Phase 1: Core Mechanics
- [ ] Data models and migrations
- [ ] Basic API endpoints (create, list, get, delete)
- [ ] Simple 8-paragraph generation (no summarization yet)
- [ ] Frontend: story reader with streaming display

### Phase 2: Summarization
- [ ] Story Bible extraction after each paragraph
- [ ] Story Events extraction after each paragraph
- [ ] Context assembly using bible + events
- [ ] Frontend: bible viewer panel, event timeline panel

### Phase 3: Interactive Choices
- [ ] Choice generation after each 8-paragraph cycle
- [ ] User choice selection UI
- [ ] Pass chosen_action to influence next generation cycle
- [ ] Frontend: choice selector component

### Phase 4: Polish
- [ ] Story persistence and resume
- [ ] Story ending detection/user-triggered ending
- [ ] Export story to text/PDF