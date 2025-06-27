# World Building Tab - Feature Specification

## Overview
The World Building tab provides writers with tools to create, organize, and develop the physical, cultural, and magical aspects of their story's setting. This tab follows the established pattern of LLM-assisted generation with photo upload capabilities, similar to the Characters tab.

## Data Structure

### Scenario Data Extension
```typescript
interface ScenarioData {
  // ...existing fields...
  worldBuilding?: {
    locations: Location[];
    cultures: Culture[];
    magicSystems: MagicSystem[];
    technologies: Technology[];
    religions: Religion[];
    organizations: Organization[];
    generalNotes: string;
  };
}

interface Location {
  id: string;
  name: string;
  type: 'city' | 'region' | 'building' | 'landmark' | 'natural' | 'other';
  description: string;
  climate?: string;
  population?: string;
  government?: string;
  economy?: string;
  culture?: string;
  history?: string;
  threats?: string;
  resources?: string;
  photoUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Culture {
  id: string;
  name: string;
  description: string;
  values: string;
  traditions: string;
  language?: string;
  clothing?: string;
  architecture?: string;
  food?: string;
  socialStructure?: string;
  photoUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface MagicSystem {
  id: string;
  name: string;
  description: string;
  rules: string;
  costs: string;
  limitations: string;
  source: string;
  practitioners?: string;
  effects?: string;
  history?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Technology {
  id: string;
  name: string;
  description: string;
  functionality: string;
  availability: string;
  creators?: string;
  impact?: string;
  limitations?: string;
  evolution?: string;
  photoUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Religion {
  id: string;
  name: string;
  description: string;
  beliefs: string;
  practices: string;
  hierarchy?: string;
  symbols?: string;
  holidays?: string;
  prophecies?: string;
  influence?: string;
  photoUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Organization {
  id: string;
  name: string;
  type: 'guild' | 'government' | 'military' | 'religious' | 'criminal' | 'academic' | 'commercial' | 'other';
  description: string;
  purpose: string;
  structure: string;
  membership?: string;
  resources?: string;
  influence?: string;
  rivals?: string;
  history?: string;
  photoUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
```

## User Interface Design

### Layout Structure
```
┌─ World Building Tab ────────────────────────────────────────┐
│                                                             │
│ ┌─ Category Tabs ──────────────────────────────────────────┐ │
│ │ Locations | Cultures | Magic | Tech | Religions | Orgs   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ Content Area ──────────────────────────────────────────┐ │
│ │                                                         │ │
│ │ ┌─ Item List ──────┐  ┌─ Item Details ─────────────────┐ │ │
│ │ │ [+] Add New      │  │                               │ │ │
│ │ │                  │  │ Name: [_______________]       │ │ │
│ │ │ □ Location A     │  │ Type: [Dropdown_______]       │ │ │
│ │ │ □ Location B     │  │                               │ │ │
│ │ │ □ Location C     │  │ Description:                  │ │ │
│ │ │                  │  │ [Text Area_______________]    │ │ │
│ │ │ [Search______]   │  │                               │ │ │
│ │ │ [Filter: All▼]   │  │ [📷] Photo Upload             │ │ │
│ │ └─────────────────┘  │                               │ │ │
│ │                      │ [🎲] Generate with AI         │ │ │
│ │                      │ [💾] Save  [🗑] Delete        │ │ │
│ │                      └───────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ General Notes ─────────────────────────────────────────┐ │
│ │ [Text Area for overall world building notes_________]   │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Sub-Tabs Navigation
- **Locations**: Cities, regions, buildings, landmarks
- **Cultures**: Societies, ethnicities, civilizations
- **Magic Systems**: Rules, limitations, practitioners
- **Technology**: Tools, weapons, transportation, communication
- **Religions**: Beliefs, practices, organizations
- **Organizations**: Guilds, governments, factions

## Component Architecture

### File Structure
```
frontend/src/components/ScenarioEditor/tabs/
├── WorldBuildingTab/
│   ├── index.ts                          # Export barrel
│   ├── WorldBuildingTab.tsx              # Main tab component
│   ├── WorldBuildingTab.css              # Tab-specific styles
│   ├── components/
│   │   ├── LocationManager.tsx           # Locations sub-component
│   │   ├── CultureManager.tsx            # Cultures sub-component
│   │   ├── MagicSystemManager.tsx        # Magic systems sub-component
│   │   ├── TechnologyManager.tsx         # Technology sub-component
│   │   ├── ReligionManager.tsx           # Religions sub-component
│   │   ├── OrganizationManager.tsx       # Organizations sub-component
│   │   ├── WorldBuildingItemForm.tsx     # Generic form component
│   │   ├── WorldBuildingItemList.tsx     # Generic list component
│   │   └── WorldBuildingSubTabs.tsx      # Sub-navigation component
│   ├── types/
│   │   └── worldBuilding.ts              # TypeScript interfaces
│   └── hooks/
│       ├── useWorldBuildingData.ts       # Data management hook
│       └── useWorldBuildingGeneration.ts # AI generation hook
```

### Service Layer
```
frontend/src/services/
├── worldBuildingService.ts               # CRUD operations
└── worldBuildingGenerationService.ts     # AI generation logic
```

## LLM Generation Features

### Generation Capabilities
1. **Smart Context Awareness**: Use existing scenario data (genre, tone, characters) to generate contextually appropriate world elements

2. **Location Generation**:
   - Generate based on story requirements
   - Consider climate, culture, and story themes
   - Create interconnected locations with logical relationships

3. **Culture Generation**:
   - Generate societies that fit the world's themes
   - Create unique traditions, values, and social structures
   - Ensure cultural diversity and depth

4. **Magic System Generation**:
   - Create consistent rule sets
   - Define limitations and costs
   - Generate practitioners and training methods

5. **Organization Generation**:
   - Create factions relevant to the story
   - Generate realistic hierarchies and goals
   - Establish relationships between organizations

### Generation Prompts
```typescript
interface WorldBuildingPrompts {
  location: {
    basic: "Generate a [type] location for a [genre] story with [tone] tone...";
    detailed: "Create a detailed location including climate, culture, economy...";
    connected: "Generate a location that connects to existing locations...";
  };
  culture: {
    society: "Create a unique culture for [location] in a [genre] setting...";
    traditions: "Generate cultural traditions and practices for...";
    conflicts: "Create cultural tensions and conflicts that could drive story...";
  };
  magicSystem: {
    rules: "Design a magic system with clear rules and limitations...";
    practitioners: "Create magical practitioners and their training...";
    consequences: "Define the costs and consequences of using magic...";
  };
  // ... other categories
}
```

### Photo Integration
- Support photo uploads for locations, cultures, technologies, organizations
- Generate visual descriptions when photos are uploaded
- Use photos to inspire and refine generated content
- Maintain consistent visual themes across related elements

## Data Management

### Auto-Detection Logic
```typescript
export const hasWorldBuildingData = (scenario: ScenarioData): boolean => {
  const wb = scenario.worldBuilding;
  if (!wb) return false;
  
  return (
    (wb.locations && wb.locations.length > 0) ||
    (wb.cultures && wb.cultures.length > 0) ||
    (wb.magicSystems && wb.magicSystems.length > 0) ||
    (wb.technologies && wb.technologies.length > 0) ||
    (wb.religions && wb.religions.length > 0) ||
    (wb.organizations && wb.organizations.length > 0) ||
    (wb.generalNotes && wb.generalNotes.trim().length > 0)
  );
};
```

### State Management
- Use existing ScenarioEditor context pattern
- Add world building specific actions to reducer
- Maintain sub-tab navigation state
- Handle CRUD operations for all world building elements

## User Experience Features

### Smart Defaults
- Pre-populate relevant fields based on genre and tone
- Suggest location types based on story requirements
- Recommend cultural elements that complement existing characters

### Search and Filter
- Search across all world building elements
- Filter by type, tags, or custom criteria
- Quick access to related elements

### Relationship Mapping
- Visual connections between locations
- Cultural influences on characters
- Organization relationships and conflicts

### Export/Import
- Export world building data as structured documents
- Import from common world building tools
- Generate summary documents for reference

## Integration Points

### Character Tab Integration
- Link characters to cultures, locations, organizations
- Reference character backgrounds in world building
- Generate characters that fit the established world

### Story Arc Integration
- Use world building elements in plot development
- Reference locations and organizations in story beats
- Ensure world consistency across story elements

### Backstory Integration
- Connect historical events to current world state
- Reference past cultures and lost locations
- Build world history that supports story themes

## Implementation Phases

### Phase 1: Core Structure
1. Create data types and interfaces
2. Set up component architecture
3. Implement basic CRUD operations
4. Add to tab configuration

### Phase 2: Basic UI
1. Create main WorldBuildingTab component
2. Implement sub-tab navigation
3. Create basic item list and form components
4. Add photo upload capability

### Phase 3: LLM Generation
1. Implement generation service
2. Create context-aware prompts
3. Add generation buttons to forms
4. Integrate with existing LLM infrastructure

### Phase 4: Advanced Features
1. Add search and filtering
2. Implement relationship mapping
3. Create export/import functionality
4. Add integration with other tabs

## Future Enhancements

### Advanced Features
- **Visual Map Builder**: Interactive map creation with drag-and-drop locations
- **Timeline Integration**: Connect world events to timeline
- **Cultural Language Generator**: Basic language creation tools
- **Economic Systems**: Trade routes, currencies, markets
- **Political Systems**: Governments, laws, diplomatic relations
- **Natural Systems**: Weather patterns, seasons, natural disasters

### AI Enhancements
- **Consistency Checking**: AI validates world building consistency
- **Relationship Suggestions**: AI suggests logical connections between elements
- **Gap Analysis**: AI identifies missing world building elements
- **Style Matching**: AI ensures all elements match the story's tone and genre

This World Building tab will provide writers with comprehensive tools to create rich, detailed fictional worlds while maintaining the clean architecture and user experience standards of the application.
