# Themes & Symbols Tab - Feature Specification

## Overview
The Themes & Symbols tab helps writers develop, track, and weave deeper meaning throughout their story. This tab provides tools for managing thematic elements, symbolic motifs, metaphors, and literary devices that enhance narrative depth and resonance.

### High Level Implementation
The tab will be hosted in the ScenarioEditor component. It will be accessible via the main navigation bar and will be part of the ScenarioEditor state management system. The tab should support the isDirty state to indicate unsaved changes, and it should be able to auto-detect existing data when a scenario is loaded. It should support importing existing  data from other scenarios, similar to the other tabs. The tab will also support AI generation features to help writers create content for the tab. The tab's styling will be similar to the other tabs, such as the CharactersTab, but will focus on thematic and symbolic elements rather than character details.


## Data Structure

### Scenario Data Extension
```typescript
interface ScenarioData {
  // ...existing fields...
  themesAndSymbols?: {
    themes: Theme[];
    symbols: Symbol[];
    motifs: Motif[];
    metaphors: Metaphor[];
    archetypes: Archetype[];
    literaryDevices: LiteraryDevice[];
    generalNotes: string;
  };
}

interface Theme {
  id: string;
  title: string;
  description: string;
  type: 'central' | 'secondary' | 'subtle' | 'emerging';
  statement: string; // Thematic statement
  questions: string[]; // Questions the theme explores
  expressions: ThemeExpression[];
  characterConnections: string[]; // Character IDs
  plotConnections: string[]; // Plot point references
  symbolConnections: string[]; // Symbol IDs
  development: string; // How theme develops through story
  resolution: string; // How theme is resolved
  examples: string[]; // Specific story examples
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Symbol {
  id: string;
  name: string;
  description: string;
  type: 'object' | 'color' | 'animal' | 'nature' | 'action' | 'concept' | 'other';
  meaning: string;
  culturalContext: string;
  appearances: SymbolAppearance[];
  evolution: string; // How meaning changes
  characters: string[]; // Associated character IDs
  locations: string[]; // Where it appears
  frequency: 'recurring' | 'bookend' | 'climactic' | 'subtle';
  photoUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Motif {
  id: string;
  name: string;
  description: string;
  type: 'image' | 'sound' | 'phrase' | 'situation' | 'character' | 'setting';
  pattern: string; // The recurring pattern
  significance: string;
  variations: MotifVariation[];
  themeConnections: string[]; // Theme IDs
  frequency: number; // How often it appears
  distribution: string; // How it's spread through story
  impact: string; // Effect on reader/story
  examples: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Metaphor {
  id: string;
  title: string;
  description: string;
  type: 'extended' | 'dead' | 'mixed' | 'implied' | 'conceptual';
  vehicle: string; // What it's compared to
  tenor: string; // What's being described
  comparison: string; // The comparison itself
  context: string; // Where/when it's used
  effect: string; // Intended impact
  examples: string[];
  relatedSymbols: string[]; // Symbol IDs
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Archetype {
  id: string;
  name: string;
  description: string;
  type: 'character' | 'situation' | 'setting' | 'plot';
  category: string; // Jung, Campbell, etc.
  characteristics: string[];
  manifestation: string; // How it appears in story
  subversion: string; // How it's twisted/subverted
  examples: string[];
  characterMappings: ArchetypeMapping[];
  culturalSignificance: string;
  modernAdaptation: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface LiteraryDevice {
  id: string;
  name: string;
  description: string;
  type: 'narrative' | 'stylistic' | 'rhetorical' | 'structural' | 'linguistic';
  technique: string;
  purpose: string;
  effect: string;
  examples: DeviceExample[];
  frequency: string;
  placement: string; // Where in story
  effectiveness: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface ThemeExpression {
  location: string; // Chapter, scene reference
  method: 'dialogue' | 'action' | 'description' | 'metaphor' | 'symbol' | 'conflict';
  content: string;
  subtlety: 'explicit' | 'implicit' | 'symbolic';
  effectiveness: number; // 1-5 rating
}

interface SymbolAppearance {
  location: string;
  context: string;
  significance: string;
  transformation?: string; // How it changes
}

interface MotifVariation {
  instance: string;
  variation: string;
  significance: string;
  context: string;
}

interface ArchetypeMapping {
  characterId: string;
  characterName: string;
  adherence: number; // How closely they match (1-5)
  deviations: string[];
}

interface DeviceExample {
  location: string;
  example: string;
  analysis: string;
  effectiveness: number;
}
```

## User Interface Design

### Layout Structure
```
┌─ Themes & Symbols Tab ──────────────────────────────────────┐
│                                                             │
│ ┌─ Category Tabs ──────────────────────────────────────────┐ │
│ │ Themes | Symbols | Motifs | Metaphors | Archetypes | Devices │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ Content Area ──────────────────────────────────────────┐ │
│ │                                                         │ │
│ │ ┌─ Element List ────┐  ┌─ Element Details ─────────────┐ │ │
│ │ │ [+] Add New      │  │                               │ │ │
│ │ │                  │  │ Title: [________________]     │ │ │
│ │ │ ⚫ Central Theme  │  │ Type: [Central▼]              │ │ │
│ │ │ ◐ Love & Loss    │  │                               │ │ │
│ │ │ ○ Redemption     │  │ Statement:                    │ │ │
│ │ │ ◐ Coming of Age  │  │ [Text Area_______________]    │ │ │
│ │ │                  │  │                               │ │ │
│ │ │ [Search______]   │  │ Character Connections:        │ │ │
│ │ │ [Filter: All▼]   │  │ [Multi-Select_____________]   │ │ │
│ │ │ [Sort: Name▼]    │  │                               │ │ │
│ │ └─────────────────┘  │ [🎲] Generate  [📊] Analyze   │ │ │
│ │                      │ [💾] Save  [🗑] Delete        │ │ │
│ │                      └───────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ Thematic Analysis ─────────────────────────────────────┐ │
│ │ ┌─ Theme Map ─────────┐ ┌─ Symbol Frequency ───────────┐ │ │
│ │ │ [Visual Network]   │ │ [Chart showing occurrences] │ │ │
│ │ └───────────────────┘ └─────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Sub-Tabs Navigation
- **Themes**: Central themes, questions, development arcs
- **Symbols**: Objects, colors, concepts with deeper meaning
- **Motifs**: Recurring patterns and images
- **Metaphors**: Extended comparisons and conceptual bridges
- **Archetypes**: Universal patterns and character types
- **Devices**: Literary techniques and narrative tools

## Component Architecture

### File Structure
```
frontend/src/components/ScenarioEditor/tabs/
├── ThemesSymbolsTab/
│   ├── index.ts                          # Export barrel
│   ├── ThemesSymbolsTab.tsx              # Main tab component
│   ├── ThemesSymbolsTab.css              # Tab-specific styles
│   ├── components/
│   │   ├── ThemesManager.tsx             # Themes management
│   │   ├── SymbolsManager.tsx            # Symbols management
│   │   ├── MotifsManager.tsx             # Motifs management
│   │   ├── MetaphorsManager.tsx          # Metaphors management
│   │   ├── ArchetypesManager.tsx         # Archetypes management
│   │   ├── DevicesManager.tsx            # Literary devices
│   │   ├── ThemeForm.tsx                 # Theme creation/editing
│   │   ├── SymbolForm.tsx                # Symbol creation/editing
│   │   ├── ThematicAnalysis.tsx          # Analysis dashboard
│   │   ├── ThemeNetwork.tsx              # Visual relationship map
│   │   ├── SymbolTracker.tsx             # Symbol appearance tracker
│   │   ├── MotifPattern.tsx              # Pattern analysis
│   │   └── ArchetypeMapper.tsx           # Character-archetype mapping
│   ├── types/
│   │   └── themesSymbols.ts              # TypeScript interfaces
│   ├── hooks/
│   │   ├── useThematicData.ts            # Data management hook
│   │   ├── useThematicGeneration.ts      # AI generation hook
│   │   └── useThematicAnalysis.ts        # Analysis and visualization
│   └── utils/
│       ├── thematicAnalysis.ts           # Analysis algorithms
│       ├── symbolFrequency.ts            # Frequency calculations
│       └── archetypeMatching.ts          # Archetype comparison
```

### Service Layer
```
frontend/src/services/
├── themesSymbolsService.ts               # CRUD operations
├── thematicGenerationService.ts          # AI generation logic
└── thematicAnalysisService.ts            # Analysis and insights
```

## LLM Generation Features

### Generation Capabilities
1. **Theme Development**:
   - Generate themes based on plot and character elements
   - Create thematic statements and questions
   - Suggest theme expressions throughout story
   - Develop theme evolution and resolution

2. **Symbol Creation**:
   - Generate meaningful symbols relevant to story
   - Create symbolic meanings and cultural contexts
   - Suggest symbol appearances and transformations
   - Design symbol hierarchies and relationships

3. **Motif Development**:
   - Identify potential recurring patterns
   - Generate motif variations and developments
   - Create motif distribution plans
   - Suggest impactful placements

4. **Literary Analysis**:
   - Analyze existing story elements for themes
   - Identify symbolic potential in story elements
   - Suggest literary devices for specific effects
   - Generate archetype mappings for characters

### Generation Prompts
```typescript
interface ThematicPrompts {
  theme: {
    extraction: "Analyze this story summary and identify potential themes: [summary]";
    development: "Develop the theme of [theme] for a [genre] story about [premise]";
    expression: "Suggest ways to express [theme] through [method] in [context]";
  };
  symbol: {
    creation: "Generate symbolic objects for a story exploring [themes] in [setting]";
    meaning: "What could [object] symbolize in the context of [story elements]";
    evolution: "How might [symbol] evolve in meaning from [beginning] to [end]";
  };
  motif: {
    identification: "Identify potential recurring motifs in this story: [elements]";
    variation: "Create variations of the [motif] that show [development]";
    placement: "Where should [motif] appear to maximize impact in [story structure]";
  };
  archetype: {
    mapping: "Which archetypes do these characters embody: [character descriptions]";
    subversion: "How can we subvert the [archetype] in a [genre] story";
    balance: "What archetypes are missing from this character ensemble: [characters]";
  };
}
```

### Context Integration
- Analyze existing story elements for thematic potential
- Reference character arcs and development
- Connect to world building and setting elements
- Maintain consistency with tone and genre

## Data Management

### Auto-Detection Logic
```typescript
export const hasThematicData = (scenario: ScenarioData): boolean => {
  const themes = scenario.themesAndSymbols;
  if (!themes) return false;
  
  return (
    (themes.themes && themes.themes.length > 0) ||
    (themes.symbols && themes.symbols.length > 0) ||
    (themes.motifs && themes.motifs.length > 0) ||
    (themes.metaphors && themes.metaphors.length > 0) ||
    (themes.archetypes && themes.archetypes.length > 0) ||
    (themes.literaryDevices && themes.literaryDevices.length > 0) ||
    (themes.generalNotes && themes.generalNotes.trim().length > 0)
  );
};
```

### Analysis Features
- Theme frequency and distribution analysis
- Symbol appearance tracking and mapping
- Motif pattern recognition and variation analysis
- Archetype adherence and deviation metrics

## User Experience Features

### Visual Analysis
- Interactive theme network showing relationships
- Symbol frequency charts and timelines
- Motif pattern visualization
- Archetype mapping diagrams

### Smart Suggestions
- AI-powered theme extraction from existing content
- Symbol suggestion based on story elements
- Motif pattern completion recommendations
- Literary device suggestions for specific effects

### Integration Tracking
- Track theme expressions across story elements
- Monitor symbol appearances and contexts
- Analyze motif effectiveness and distribution
- Character-archetype alignment tracking

### Export Capabilities
- Generate thematic analysis reports
- Export symbol glossaries and guides
- Create motif pattern documentation
- Produce literary analysis summaries

## Integration Points

### Character Integration
- Map characters to archetypal patterns
- Track character-theme relationships
- Analyze character symbolic associations
- Generate character-specific motifs

### Plot Integration
- Connect themes to story beats and conflicts
- Identify symbolic moments in plot development
- Track motif appearances across plot points
- Analyze thematic resolution in climax

### World Building Integration
- Connect cultural symbols to world building
- Reference mythological and cultural archetypes
- Integrate thematic elements into setting design
- Create culturally consistent symbolic systems

## Implementation Phases

### Phase 1: Core Structure
1. Create data types and interfaces
2. Implement basic CRUD operations
3. Set up component architecture
4. Add to tab configuration

### Phase 2: Basic UI
1. Create management components for each category
2. Implement basic forms and lists
3. Add simple relationship tracking
4. Create basic search and filtering

### Phase 3: Analysis Features
1. Implement visual analysis components
2. Create relationship mapping tools
3. Add frequency and pattern analysis
4. Build thematic dashboard

### Phase 4: AI Integration
1. Implement generation services
2. Create analysis and extraction tools
3. Add smart suggestions and recommendations
4. Integrate with existing story elements

## Future Enhancements

### Advanced Features
- **Thematic Heat Maps**: Visual representation of theme density across story
- **Symbol Evolution Tracking**: Timeline view of how symbols change meaning
- **Motif Network Analysis**: Complex pattern relationship mapping
- **Comparative Analysis**: Compare themes across different stories or genres
- **Reader Impact Prediction**: AI analysis of likely emotional and intellectual impact

### AI Enhancements
- **Deep Thematic Analysis**: Advanced AI examination of subtle thematic elements
- **Cross-Cultural Symbol Recognition**: Understanding symbols across different cultures
- **Genre Convention Analysis**: How themes and symbols work within specific genres
- **Originality Assessment**: Evaluate uniqueness of thematic choices
- **Subtext Generation**: AI suggestions for implicit meaning and layered symbolism

This Themes & Symbols tab will provide writers with sophisticated tools for developing literary depth while maintaining the clean architecture and user experience standards of the application.
