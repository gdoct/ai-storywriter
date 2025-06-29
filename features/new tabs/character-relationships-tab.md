# Character Relationships Tab - Feature Specification

## Overview
The Character Relationships tab provides writers with tools to map, develop, and track the complex web of relationships between characters. This tab helps maintain consistency in character interactions, develop relationship arcs, and create compelling interpersonal dynamics that drive story conflict and growth.

## Data Structure

### Scenario Data Extension
```typescript
interface ScenarioData {
  // ...existing fields...
  characterRelationships?: {
    relationships: Relationship[];
    relationshipTypes: RelationshipType[];
    dynamics: RelationshipDynamic[];
    conflicts: RelationshipConflict[];
    histories: RelationshipHistory[];
    groups: CharacterGroup[];
    generalNotes: string;
  };
}

interface Relationship {
  id: string;
  characterA: string; // Character ID
  characterB: string; // Character ID
  type: string; // Relationship type ID
  status: 'active' | 'strained' | 'broken' | 'healing' | 'evolving' | 'static';
  strength: number; // 1-10 intensity
  description: string;
  publicPerception: string; // How others see the relationship
  secretAspects: string; // Hidden elements
  origin: RelationshipOrigin;
  development: RelationshipArc[];
  currentState: string;
  tensions: string[];
  bonds: string[];
  powerDynamics: PowerDynamic;
  communication: CommunicationStyle;
  futureProjection: string;
  storyImportance: 'critical' | 'major' | 'supporting' | 'background';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface RelationshipType {
  id: string;
  name: string;
  category: 'family' | 'romantic' | 'friendship' | 'professional' | 'adversarial' | 'mentor' | 'social' | 'custom';
  description: string;
  characteristics: string[];
  commonTensions: string[];
  typicalArcs: string[];
  examples: string[];
  isCustom: boolean;
  tags: string[];
}

interface RelationshipDynamic {
  id: string;
  relationshipId: string;
  type: 'power' | 'emotional' | 'intellectual' | 'physical' | 'spiritual' | 'social';
  description: string;
  dominantParty?: string; // Character ID
  balance: 'balanced' | 'character_a_dominant' | 'character_b_dominant' | 'unstable';
  factors: DynamicFactor[];
  evolution: string; // How it changes over time
  triggers: string[]; // What affects this dynamic
  manifestations: string[]; // How it shows in story
  impact: string; // Effect on characters and plot
}

interface RelationshipConflict {
  id: string;
  relationshipId: string;
  title: string;
  type: 'values' | 'goals' | 'methods' | 'misunderstanding' | 'external' | 'internal' | 'historical';
  description: string;
  root_cause: string;
  manifestation: string;
  stakes: string; // What's at risk
  positions: ConflictPosition[];
  escalation: ConflictEscalation[];
  resolution: ConflictResolution;
  impact: string;
  lessons: string[];
  recurringElement: boolean;
  status: 'brewing' | 'active' | 'escalating' | 'resolving' | 'resolved' | 'dormant';
  storyRelevance: string;
}

interface RelationshipHistory {
  id: string;
  relationshipId: string;
  title: string;
  timeframe: string;
  description: string;
  type: 'origin' | 'milestone' | 'crisis' | 'growth' | 'setback' | 'revelation';
  impact: string;
  emotions: string[];
  consequences: string[];
  witnesses: string[]; // Character IDs
  secrets: string[];
  storyRelevance: string;
  order: number; // Chronological order
}

interface CharacterGroup {
  id: string;
  name: string;
  description: string;
  type: 'family' | 'team' | 'organization' | 'social' | 'temporary' | 'alliance' | 'opposition';
  members: GroupMember[];
  hierarchy: GroupHierarchy[];
  purpose: string;
  dynamics: string;
  conflicts: string[];
  bonds: string[];
  traditions: string[];
  secrets: string[];
  influence: string;
  stability: 'stable' | 'growing' | 'declining' | 'volatile' | 'transforming';
  storyRole: string;
}

interface RelationshipOrigin {
  when: string;
  where: string;
  how: string;
  circumstances: string;
  firstImpressions: FirstImpression[];
  immediate_impact: string;
  witnesses: string[];
}

interface RelationshipArc {
  stage: string;
  description: string;
  keyEvents: string[];
  emotions: string[];
  growth: string;
  setbacks: string;
  timeframe: string;
  storyConnection: string;
}

interface PowerDynamic {
  type: 'equal' | 'dominant_submissive' | 'shifting' | 'complex';
  description: string;
  sources: string[]; // What gives power
  manifestations: string[];
  changes: string; // How it evolves
}

interface CommunicationStyle {
  frequency: 'constant' | 'regular' | 'occasional' | 'rare' | 'crisis_only';
  methods: string[]; // How they communicate
  barriers: string[]; // What hinders communication
  patterns: string[]; // Recurring communication patterns
  effectiveness: number; // 1-10 rating
}

interface DynamicFactor {
  factor: string;
  influence: number; // -5 to +5
  description: string;
  stability: 'constant' | 'variable' | 'seasonal' | 'event_driven';
}

interface ConflictPosition {
  characterId: string;
  position: string;
  reasoning: string;
  emotions: string[];
  stakes: string;
  flexibility: number; // 1-10, willingness to compromise
}

interface ConflictEscalation {
  stage: string;
  description: string;
  triggers: string[];
  actions: string[];
  consequences: string[];
  pointOfNoReturn?: boolean;
}

interface ConflictResolution {
  type: 'compromise' | 'victory' | 'defeat' | 'transformation' | 'external' | 'unresolved';
  description: string;
  outcome: string;
  growth: string[];
  costs: string[];
  newEquilibrium: string;
}

interface GroupMember {
  characterId: string;
  role: string;
  status: 'core' | 'peripheral' | 'new' | 'leaving' | 'expelled' | 'honorary';
  influence: number; // 1-10
  loyalty: number; // 1-10
  joinDate: string;
  contributions: string[];
  conflicts: string[];
}

interface GroupHierarchy {
  level: number;
  title: string;
  characterId: string;
  responsibilities: string[];
  authority: string[];
  accountableTo?: string; // Character ID
}

interface FirstImpression {
  characterId: string;
  impression: string;
  accuracy: 'accurate' | 'partially_accurate' | 'misleading' | 'completely_wrong';
  evolution: string; // How it changed over time
}
```

## User Interface Design

### Layout Structure
```
┌─ Character Relationships Tab ───────────────────────────────┐
│                                                             │
│ ┌─ View Tabs ─────────────────────────────────────────────┐ │
│ │ Network | Relationships | Dynamics | Conflicts | Groups  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ Network View ──────────────────────────────────────────┐ │
│ │ ┌─ Controls ──────────────────────────────────────────┐  │ │
│ │ │ Filter: [All▼] Show: [Active▼] Layout: [Circular▼]  │  │ │
│ │ │ [🔍] Search [+] Add Relationship [📊] Analysis      │  │ │
│ │ └─────────────────────────────────────────────────────┘  │ │
│ │                                                         │ │
│ │ ┌─ Relationship Network ──────────────────────────────┐  │ │
│ │ │        Alice ●━━━━━● Bob                            │  │ │
│ │ │          │    ╲   ╱  │                             │  │ │
│ │ │          │     ╲ ╱   │                             │  │ │
│ │ │          │      ╳    │                             │  │ │
│ │ │          │     ╱ ╲   │                             │  │ │
│ │ │          │    ╱   ╲  │                             │  │ │
│ │ │        Carol ●─────● Dave                          │  │ │
│ │ │                                                    │  │ │
│ │ │ Legend: ━ Strong ─ Moderate ┅ Weak ╋ Conflict     │  │ │
│ │ └────────────────────────────────────────────────────┘  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ Relationship Details ──────────────────────────────────┐ │
│ │ Between: Alice & Bob | Type: Siblings | Status: Strained │ │
│ │ Description: [Text Area_____________________________]   │ │
│ │ Tensions: [Tag Input____________________________]       │ │
│ │ [📷] Photo [🎲] Generate [📈] Timeline [💾] Save       │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Sub-Tabs Navigation
- **Network**: Visual relationship mapping with interactive diagrams
- **Relationships**: Detailed list view with filtering and search
- **Dynamics**: Power dynamics, communication patterns, emotional bonds
- **Conflicts**: Relationship conflicts, tensions, and resolutions
- **Groups**: Character groups, families, teams, organizations

## Component Architecture

### File Structure
```
frontend/src/components/ScenarioEditor/tabs/
├── CharacterRelationshipsTab/
│   ├── index.ts                          # Export barrel
│   ├── CharacterRelationshipsTab.tsx     # Main tab component
│   ├── CharacterRelationshipsTab.css     # Tab-specific styles
│   ├── components/
│   │   ├── RelationshipNetwork.tsx       # Interactive network diagram
│   │   ├── RelationshipsList.tsx         # List view with filtering
│   │   ├── RelationshipForm.tsx          # Create/edit relationships
│   │   ├── DynamicsManager.tsx           # Power dynamics and patterns
│   │   ├── ConflictsManager.tsx          # Relationship conflicts
│   │   ├── GroupsManager.tsx             # Character groups
│   │   ├── RelationshipTimeline.tsx      # Relationship history
│   │   ├── RelationshipAnalysis.tsx      # Analysis dashboard
│   │   ├── NetworkVisualization.tsx      # D3.js network rendering
│   │   ├── RelationshipCard.tsx          # Individual relationship display
│   │   ├── ConflictForm.tsx              # Conflict creation/editing
│   │   ├── GroupForm.tsx                 # Group creation/editing
│   │   ├── DynamicForm.tsx               # Dynamic creation/editing
│   │   └── RelationshipImporter.tsx      # Import from character data
│   ├── types/
│   │   └── relationships.ts              # TypeScript interfaces
│   ├── hooks/
│   │   ├── useRelationshipData.ts        # Data management hook
│   │   ├── useRelationshipGeneration.ts  # AI generation hook
│   │   ├── useNetworkVisualization.ts    # Network visualization hook
│   │   └── useRelationshipAnalysis.ts    # Analysis and insights
│   └── utils/
│       ├── networkCalculations.ts        # Network analysis algorithms
│       ├── relationshipMatching.ts       # Relationship similarity
│       ├── conflictAnalysis.ts           # Conflict pattern analysis
│       └── groupDynamics.ts              # Group behavior analysis
```

### Service Layer
```
frontend/src/services/
├── relationshipsService.ts               # CRUD operations
├── relationshipGenerationService.ts      # AI generation logic
├── networkAnalysisService.ts             # Network analysis tools
└── relationshipImportService.ts          # Import from existing data
```

## LLM Generation Features

### Generation Capabilities
1. **Relationship Development**:
   - Generate relationships based on character personalities and backgrounds
   - Create relationship histories and origin stories
   - Develop relationship arcs and evolution patterns
   - Suggest realistic relationship dynamics

2. **Conflict Generation**:
   - Create believable conflicts based on character differences
   - Generate escalation patterns and resolution paths
   - Develop multi-layered relationship tensions
   - Suggest conflict triggers and consequences

3. **Group Dynamics**:
   - Generate realistic group structures and hierarchies
   - Create group conflicts and alliances
   - Develop group traditions and cultures
   - Suggest group evolution patterns

4. **Communication Patterns**:
   - Generate realistic communication styles between characters
   - Create dialogue patterns and recurring themes
   - Develop miscommunication scenarios
   - Suggest communication growth opportunities

### Generation Prompts
```typescript
interface RelationshipPrompts {
  relationship: {
    creation: "Generate a relationship between [character A] and [character B] based on their personalities";
    development: "How might the relationship between [characters] evolve given [circumstances]";
    history: "Create a shared history for [characters] that explains their current dynamic";
  };
  conflict: {
    generation: "Create a realistic conflict between [characters] based on [differences]";
    escalation: "How might this conflict escalate: [conflict description]";
    resolution: "Suggest resolution paths for [conflict] that allow for character growth";
  };
  dynamics: {
    power: "Analyze the power dynamic between [characters] given their [traits/positions]";
    communication: "How do [characters] communicate given their personalities and relationship";
    evolution: "How might the dynamic between [characters] change over [story arc]";
  };
  groups: {
    formation: "Create a group structure for [characters] with [purpose/goal]";
    hierarchy: "Design a realistic hierarchy for [group] based on [criteria]";
    dynamics: "What group dynamics would emerge between [characters] in [situation]";
  };
}
```

### Context Integration
- Use existing character data to generate realistic relationships
- Reference story events for relationship development
- Connect to world building for cultural relationship norms
- Maintain consistency with established character arcs

## Data Management

### Auto-Detection Logic
```typescript
export const hasRelationshipData = (scenario: ScenarioData): boolean => {
  const relationships = scenario.characterRelationships;
  if (!relationships) return false;
  
  return (
    (relationships.relationships && relationships.relationships.length > 0) ||
    (relationships.dynamics && relationships.dynamics.length > 0) ||
    (relationships.conflicts && relationships.conflicts.length > 0) ||
    (relationships.histories && relationships.histories.length > 0) ||
    (relationships.groups && relationships.groups.length > 0) ||
    (relationships.generalNotes && relationships.generalNotes.trim().length > 0)
  );
};
```

### Network Analysis
- Relationship strength and influence calculations
- Network centrality and importance metrics
- Conflict pattern recognition and analysis
- Group cohesion and stability measurements

## User Experience Features

### Interactive Network Visualization
- Drag-and-drop relationship mapping
- Dynamic network layouts (circular, hierarchical, force-directed)
- Relationship strength visualization through line thickness
- Conflict visualization through color coding and line styles

### Advanced Filtering
- Filter by relationship type, strength, status
- Character-centric views showing all relationships
- Timeline filtering for relationship evolution
- Group-based filtering and analysis

### Relationship Timeline
- Chronological view of relationship development
- Key milestone tracking and visualization
- Relationship arc progression mapping
- Historical event integration

### Analysis Dashboard
- Relationship network statistics and metrics
- Conflict frequency and resolution patterns
- Group stability and influence analysis
- Character isolation and connection analysis

## Integration Points

### Character Integration
- Auto-import relationships from character backgrounds
- Link relationship changes to character development
- Reference character traits in relationship dynamics
- Update character arcs based on relationship evolution

### Plot Integration
- Connect relationship conflicts to story conflicts
- Reference key relationships in plot development
- Track relationship changes through story beats
- Use relationships to drive plot progression

### Timeline Integration
- Connect relationship events to story timeline
- Track relationship evolution through historical events
- Reference relationship histories in backstory
- Coordinate relationship arcs with plot timeline

### Overview
The tab will be hosted in the ScenarioEditor component. It will be accessible via the main navigation bar and will be part of the ScenarioEditor state management system. The tab should support the isDirty state to indicate unsaved changes, and it should be able to auto-detect existing data when a scenario is loaded. It should support importing existing  data from other scenarios, similar to the other tabs. The tab will also support AI generation features to help writers create content for the tab. The tab's styling will be similar to the other tabs, such as the CharactersTab, but will focus on relationships between characters rather than individual character details.

## Implementation Phases

### Phase 1: Core Structure
1. Create data types and interfaces
2. Implement basic CRUD operations
3. Set up component architecture
4. Add to tab configuration

### Phase 2: Basic UI
1. Create relationship list and form components
2. Implement basic network visualization
3. Add conflict and group management
4. Create relationship search and filtering

### Phase 3: Advanced Visualization
1. Implement interactive network diagrams
2. Add relationship timeline views
3. Create analysis dashboard
4. Build group visualization tools

### Phase 4: AI Integration
1. Implement generation services
2. Add relationship analysis and suggestions
3. Create conflict generation and resolution tools
4. Integrate with existing character and plot data

## Future Enhancements

### Advanced Features
- **3D Relationship Networks**: Three-dimensional relationship visualization
- **Relationship Simulation**: AI-powered relationship evolution simulation
- **Emotional Heat Maps**: Visual representation of emotional dynamics
- **Relationship Templates**: Pre-built relationship patterns for common scenarios
- **Multi-Story Analysis**: Compare relationship patterns across different stories

### AI Enhancements
- **Relationship Psychology**: Deep analysis using psychological relationship models
- **Conflict Prediction**: AI prediction of likely relationship conflicts
- **Resolution Optimization**: AI suggestions for optimal conflict resolution
- **Character Compatibility**: Advanced compatibility analysis between characters
- **Relationship Authenticity**: AI validation of relationship realism and consistency

This Character Relationships tab will provide writers with comprehensive tools for developing complex, realistic character dynamics while maintaining the clean architecture and user experience standards of the application.
