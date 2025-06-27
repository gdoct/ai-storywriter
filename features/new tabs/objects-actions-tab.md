# Objects & Actions Tab - Feature Specification

## Overview
The Objects & Actions tab provides writers with tools to catalog, develop, and track the physical elements and behaviors that populate their story world. This tab helps maintain consistency in object descriptions, track important items, and develop meaningful actions that advance plot and character development.

### High Level Implementation
The tab will be hosted in the ScenarioEditor component. It will be accessible via the main navigation bar and will be part of the ScenarioEditor state management system. The tab should support the isDirty state to indicate unsaved changes, and it should be able to auto-detect existing data when a scenario is loaded. It should support importing existing  data from other scenarios, similar to the other tabs. The tab will also support AI generation features to help writers create content for the tab. The tab's styling will be similar to the other tabs, such as the CharactersTab, but will focus on objects and actions rather than character details. The tab will include a rich text editor for object descriptions, a structured format for actions, and tools for tracking object usage and action sequences.

## Data Structure

### Scenario Data Extension
```typescript
interface ScenarioData {
  // ...existing fields...
  objectsAndActions?: {
    objects: StoryObject[];
    actions: StoryAction[];
    objectCategories: ObjectCategory[];
    actionCategories: ActionCategory[];
    interactions: ObjectInteraction[];
    sequences: ActionSequence[];
    generalNotes: string;
  };
}

interface StoryObject {
  id: string;
  name: string;
  type: 'weapon' | 'tool' | 'artifact' | 'clothing' | 'furniture' | 'vehicle' | 'document' | 'jewelry' | 'technology' | 'natural' | 'magical' | 'other';
  description: string;
  physicalProperties: PhysicalProperties;
  significance: 'critical' | 'important' | 'useful' | 'decorative' | 'background';
  rarity: 'unique' | 'rare' | 'uncommon' | 'common' | 'abundant';
  condition: 'pristine' | 'good' | 'worn' | 'damaged' | 'broken' | 'destroyed';
  origin: ObjectOrigin;
  history: ObjectHistory[];
  ownership: Ownership[];
  location: ObjectLocation;
  capabilities: string[];
  limitations: string[];
  symbolism?: ObjectSymbolism;
  storyRole: ObjectRole;
  appearances: ObjectAppearance[];
  interactions: string[]; // Interaction IDs
  relatedObjects: string[]; // Related object IDs
  culturalContext?: string;
  photoUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface StoryAction {
  id: string;
  name: string;
  type: 'physical' | 'mental' | 'social' | 'magical' | 'technological' | 'emotional' | 'narrative' | 'other';
  category: string; // User-defined category
  description: string;
  purpose: ActionPurpose;
  complexity: 'simple' | 'moderate' | 'complex' | 'intricate';
  duration: ActionDuration;
  requirements: ActionRequirements;
  consequences: ActionConsequences;
  variations: ActionVariation[];
  context: ActionContext[];
  frequency: 'one-time' | 'rare' | 'occasional' | 'frequent' | 'habitual';
  significance: 'trivial' | 'minor' | 'moderate' | 'major' | 'pivotal';
  storyFunction: 'plot-advancing' | 'character-revealing' | 'world-building' | 'tension-building' | 'resolution' | 'transition';
  characterAssociations: CharacterActionAssociation[];
  objectInvolvement: string[]; // Object IDs used in action
  locationRelevance: string[];
  culturalAspects?: CulturalAction;
  symbolism?: ActionSymbolism;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface ObjectCategory {
  id: string;
  name: string;
  description: string;
  parentCategory?: string;
  attributes: CategoryAttribute[];
  defaultProperties: Partial<PhysicalProperties>;
  commonUses: string[];
  typicalLocations: string[];
  examples: string[];
  culturalVariations?: string[];
  isCustom: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface ActionCategory {
  id: string;
  name: string;
  description: string;
  parentCategory?: string;
  characteristics: string[];
  typicalRequirements: ActionRequirements;
  commonOutcomes: string[];
  skillsInvolved: string[];
  difficultyRange: string;
  examples: string[];
  culturalVariations?: string[];
  isCustom: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface ObjectInteraction {
  id: string;
  name: string;
  description: string;
  participants: InteractionParticipant[];
  objects: string[]; // Object IDs involved
  actions: string[]; // Action IDs involved
  type: 'usage' | 'combination' | 'transformation' | 'discovery' | 'creation' | 'destruction' | 'trade' | 'ritual';
  requirements: string[];
  outcomes: InteractionOutcome[];
  context: string;
  frequency: 'unique' | 'rare' | 'occasional' | 'common';
  storyRelevance: 'critical' | 'important' | 'supporting' | 'background';
  symbolism?: string;
  consequences: string[];
  variations: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface ActionSequence {
  id: string;
  name: string;
  description: string;
  type: 'combat' | 'ritual' | 'procedure' | 'journey' | 'investigation' | 'negotiation' | 'crafting' | 'other';
  steps: SequenceStep[];
  participants: string[]; // Character IDs
  objects: string[]; // Object IDs involved
  duration: string;
  complexity: 'simple' | 'moderate' | 'complex' | 'elaborate';
  purpose: string;
  outcomes: SequenceOutcome[];
  variations: SequenceVariation[];
  prerequisites: string[];
  context: string;
  storySignificance: 'major' | 'moderate' | 'minor' | 'background';
  culturalContext?: string;
  symbolism?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface PhysicalProperties {
  size: 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'massive';
  weight: 'negligible' | 'light' | 'moderate' | 'heavy' | 'very-heavy';
  material: string[];
  color: string[];
  texture: string;
  temperature?: string;
  durability: 'fragile' | 'delicate' | 'sturdy' | 'robust' | 'indestructible';
  flexibility: 'rigid' | 'semi-rigid' | 'flexible' | 'elastic';
  transparency: 'opaque' | 'translucent' | 'transparent';
  special: string[]; // Special physical properties
}

interface ObjectOrigin {
  creator?: string;
  creationMethod: string;
  creationDate?: string;
  creationLocation?: string;
  materials: string[];
  purpose: string;
  inspiration?: string;
  backstory: string;
}

interface ObjectHistory {
  event: string;
  date: string;
  location: string;
  participants: string[];
  significance: string;
  changes: string[];
  context: string;
}

interface Ownership {
  ownerId: string;
  ownerName: string;
  ownerType: 'character' | 'organization' | 'location' | 'entity';
  acquisitionMethod: 'inherited' | 'purchased' | 'found' | 'gifted' | 'stolen' | 'created' | 'other';
  acquisitionDate?: string;
  acquisitionStory?: string;
  currentStatus: 'current' | 'past' | 'disputed' | 'unknown';
  relationship: string; // How they relate to the object
}

interface ObjectLocation {
  currentLocation: string;
  locationType: 'carried' | 'stored' | 'displayed' | 'hidden' | 'lost' | 'destroyed' | 'unknown';
  accessibility: 'public' | 'restricted' | 'private' | 'secret' | 'impossible';
  security: 'none' | 'basic' | 'moderate' | 'high' | 'extreme';
  conditions: string[];
  history: LocationHistory[];
}

interface ObjectSymbolism {
  meaning: string;
  culturalSignificance: string;
  personalSignificance?: string;
  evolution: string;
  interpretation: string[];
}

interface ObjectRole {
  plotRole: 'macguffin' | 'weapon' | 'key' | 'evidence' | 'catalyst' | 'obstacle' | 'reward' | 'none';
  characterRole: 'signature-item' | 'memento' | 'tool' | 'burden' | 'goal' | 'none';
  themeRole: string;
  importance: 'essential' | 'important' | 'useful' | 'decorative';
}

interface ObjectAppearance {
  location: string; // Where in story
  context: string;
  purpose: string;
  description: string;
  changes?: string;
  significance: string;
}

interface ActionPurpose {
  immediate: string;
  longTerm?: string;
  hidden?: string;
  character: string; // What it reveals about character
  plot: string; // How it advances plot
  theme?: string; // Thematic significance
}

interface ActionDuration {
  timeframe: 'instant' | 'seconds' | 'minutes' | 'hours' | 'days' | 'longer';
  specific?: string;
  variable: boolean;
  factors?: string[]; // What affects duration
}

interface ActionRequirements {
  skills: string[];
  tools: string[]; // Object IDs
  conditions: string[];
  knowledge: string[];
  physical: string[];
  mental: string[];
  resources?: string[];
}

interface ActionConsequences {
  immediate: string[];
  shortTerm: string[];
  longTerm: string[];
  unintended: string[];
  risks: string[];
  benefits: string[];
}

interface ActionVariation {
  name: string;
  description: string;
  differences: string[];
  requirements: string[];
  outcomes: string[];
  context: string;
}

interface ActionContext {
  situation: string;
  appropriateness: string;
  effectiveness: string;
  alternatives: string[];
  considerations: string[];
}

interface CharacterActionAssociation {
  characterId: string;
  characterName: string;
  proficiency: 'novice' | 'competent' | 'skilled' | 'expert' | 'master';
  frequency: 'never' | 'rarely' | 'sometimes' | 'often' | 'always';
  style: string; // How they perform it
  motivation: string; // Why they do it
  history: string; // Their experience with it
}

interface CulturalAction {
  culturalSignificance: string;
  traditions: string[];
  taboos: string[];
  variations: string[];
  ritualAspects?: string;
  socialImplications: string[];
}

interface ActionSymbolism {
  meaning: string;
  interpretation: string[];
  context: string;
  evolution?: string;
}

interface CategoryAttribute {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'list';
  required: boolean;
  defaultValue?: any;
  options?: string[];
  description: string;
}

interface InteractionParticipant {
  id: string;
  type: 'character' | 'group' | 'entity';
  role: string;
  involvement: 'primary' | 'secondary' | 'observer' | 'affected';
}

interface InteractionOutcome {
  type: 'creation' | 'destruction' | 'transformation' | 'discovery' | 'transfer' | 'change';
  description: string;
  objects: string[]; // Affected object IDs
  probability: 'certain' | 'likely' | 'possible' | 'unlikely';
  conditions?: string[];
}

interface SequenceStep {
  order: number;
  name: string;
  description: string;
  actions: string[]; // Action IDs
  duration: string;
  requirements: string[];
  outcomes: string[];
  alternatives?: string[];
  failures?: string[];
}

interface SequenceOutcome {
  type: 'success' | 'failure' | 'partial' | 'unexpected';
  description: string;
  consequences: string[];
  probability: string;
  conditions: string[];
}

interface SequenceVariation {
  name: string;
  description: string;
  changes: string[];
  context: string;
  outcomes: string[];
}

interface LocationHistory {
  location: string;
  period: string;
  reason: string;
  circumstances: string;
}
```

## User Interface Design

### Layout Structure
```
┌─ Objects & Actions Tab ─────────────────────────────────────┐
│                                                             │
│ ┌─ Category Tabs ──────────────────────────────────────────┐ │
│ │ Objects | Actions | Categories | Interactions | Sequences │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ Content Area ──────────────────────────────────────────┐ │
│ │                                                         │ │
│ │ ┌─ Item Grid ───────┐  ┌─ Item Details ─────────────────┐ │ │
│ │ │ [+] Add New      │  │                               │ │ │
│ │ │ [📋] Categories  │  │ Name: [Excalibur_________]    │ │ │
│ │ │                  │  │ Type: [Weapon▼] [🏷 Rare]     │ │ │
│ │ │ ⚔️ Weapons       │  │                               │ │ │
│ │ │ • Sword          │  │ Description:                  │ │ │
│ │ │ • Bow            │  │ [Rich Text Editor__________]  │ │ │
│ │ │ • Dagger         │  │                               │ │ │
│ │ │                  │  │ Physical Properties:          │ │ │
│ │ │ 🔧 Tools         │  │ Size: [Large▼] Weight: [Heavy▼] │ │ │
│ │ │ • Lockpicks      │  │ Material: [Steel, Leather]   │ │ │
│ │ │ • Compass        │  │                               │ │ │
│ │ │                  │  │ [📷] Photo [🎲] Generate      │ │ │
│ │ │ [🔍] Search      │  │ [💾] Save  [🗑] Delete        │ │ │
│ │ │ [🏷] Filter      │  └───────────────────────────────┘ │ │
│ │ └─────────────────┘                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ Quick Stats ───────────────────────────────────────────┐ │
│ │ Objects: 127 | Actions: 89 | Interactions: 23          │ │
│ │ Critical Items: 5 | Magical Objects: 12 | Weapons: 18  │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Sub-Tabs Navigation
- **Objects**: Physical items, artifacts, tools, weapons
- **Actions**: Behaviors, skills, techniques, procedures
- **Categories**: Object and action classification systems
- **Interactions**: How objects and actions combine
- **Sequences**: Complex multi-step action chains

## Component Architecture

### File Structure
```
frontend/src/components/ScenarioEditor/tabs/
├── ObjectsActionsTab/
│   ├── index.ts                          # Export barrel
│   ├── ObjectsActionsTab.tsx             # Main tab component
│   ├── ObjectsActionsTab.css             # Tab-specific styles
│   ├── components/
│   │   ├── ObjectsManager.tsx            # Objects management
│   │   ├── ActionsManager.tsx            # Actions management
│   │   ├── CategoriesManager.tsx         # Category management
│   │   ├── InteractionsManager.tsx       # Object interactions
│   │   ├── SequencesManager.tsx          # Action sequences
│   │   ├── ObjectForm.tsx                # Object creation/editing
│   │   ├── ActionForm.tsx                # Action creation/editing
│   │   ├── CategoryForm.tsx              # Category management
│   │   ├── InteractionForm.tsx           # Interaction creation
│   │   ├── SequenceForm.tsx              # Sequence creation
│   │   ├── ObjectGrid.tsx                # Visual object display
│   │   ├── ActionLibrary.tsx             # Action reference library
│   │   ├── PhysicalProperties.tsx        # Object properties form
│   │   ├── ActionRequirements.tsx        # Action requirements form
│   │   ├── ObjectTracker.tsx             # Object location/status tracking
│   │   ├── ActionSequencer.tsx           # Multi-step action builder
│   │   ├── InteractionVisualizer.tsx     # Object relationship mapping
│   │   └── UsageAnalyzer.tsx             # Object/action usage statistics
│   ├── types/
│   │   └── objectsActions.ts             # TypeScript interfaces
│   ├── hooks/
│   │   ├── useObjectsActionsData.ts      # Data management hook
│   │   ├── useObjectsActionsGeneration.ts # AI generation hook
│   │   ├── useObjectTracking.ts          # Object tracking
│   │   └── useActionSequencing.ts        # Action sequence management
│   └── utils/
│       ├── objectValidation.ts           # Object data validation
│       ├── actionAnalysis.ts             # Action analysis utilities
│       ├── categoryManager.ts            # Category management
│       ├── interactionCalculator.ts      # Interaction logic
│       └── sequenceBuilder.ts            # Sequence construction
```

### Service Layer
```
frontend/src/services/
├── objectsActionsService.ts              # CRUD operations
├── objectsActionsGenerationService.ts    # AI generation logic
├── objectTrackingService.ts              # Object tracking
└── actionSequenceService.ts              # Sequence management
```

## LLM Generation Features

### Generation Capabilities
1. **Object Creation**:
   - Generate objects based on story needs and world building
   - Create detailed physical descriptions and properties
   - Develop object histories and significance
   - Design object interactions and capabilities

2. **Action Development**:
   - Generate actions appropriate to characters and situations
   - Create detailed action descriptions and requirements
   - Develop action variations and cultural contexts
   - Design skill progressions and mastery levels

3. **Interaction Design**:
   - Create meaningful object-character interactions
   - Generate object combination effects
   - Design ritual and ceremonial object uses
   - Develop object-based problem-solving scenarios

4. **Sequence Planning**:
   - Generate complex multi-step action sequences
   - Create combat choreography and procedure flows
   - Design crafting and creation processes
   - Develop investigation and discovery sequences

### Generation Prompts
```typescript
interface ObjectsActionsPrompts {
  objects: {
    creation: "Generate a [type] object for [character] in [setting] with [significance]";
    description: "Describe the physical properties of [object] used for [purpose]";
    history: "Create a history for [object] that explains its [current state/significance]";
  };
  actions: {
    development: "Create actions for [character] that demonstrate [skill/trait] in [context]";
    sequence: "Design a step-by-step [action type] sequence for [situation]";
    variation: "Generate cultural variations of [action] for [culture/setting]";
  };
  interactions: {
    combination: "How might [object A] and [object B] interact when [context]";
    usage: "Create interesting ways [character] could use [object] for [purpose]";
    discovery: "Generate discovery scenarios for [object] that reveal [information]";
  };
  sequences: {
    combat: "Create a combat sequence involving [participants] using [objects/actions]";
    ritual: "Design a ritual sequence for [purpose] involving [elements]";
    crafting: "Generate a crafting sequence to create [object] from [materials]";
  };
}
```

### Context Integration
- Reference existing characters and their abilities
- Use world building elements for object origins
- Maintain consistency with established story elements
- Consider cultural and technological contexts

## Data Management

### Auto-Detection Logic
```typescript
export const hasObjectsActionsData = (scenario: ScenarioData): boolean => {
  const oa = scenario.objectsAndActions;
  if (!oa) return false;
  
  return (
    (oa.objects && oa.objects.length > 0) ||
    (oa.actions && oa.actions.length > 0) ||
    (oa.interactions && oa.interactions.length > 0) ||
    (oa.sequences && oa.sequences.length > 0) ||
    (oa.generalNotes && oa.generalNotes.trim().length > 0)
  );
};
```

### Smart Organization
- Automatic categorization based on object/action properties
- Relationship mapping between objects, actions, and characters
- Usage frequency tracking and analysis
- Significance assessment and prioritization

## User Experience Features

### Visual Organization
- Grid-based object display with filtering
- Hierarchical category trees
- Relationship mapping visualizations
- Interactive sequence builders

### Advanced Search
- Multi-criteria filtering (type, significance, condition, etc.)
- Cross-reference searches (objects used by character, etc.)
- Tag-based organization and discovery
- Usage pattern analysis

### Tracking and Analytics
- Object location and ownership tracking
- Action frequency and proficiency analysis
- Interaction pattern recognition
- Sequence complexity assessment

### Export Capabilities
- Generate object inventories and catalogs
- Create action reference guides
- Export interaction matrices
- Produce sequence documentation

## Integration Points

### Character Integration
- Link objects to character inventories and signatures
- Connect actions to character skills and abilities
- Track character-object relationships
- Reference character development in action proficiency

### World Building Integration
- Connect objects to cultural and technological systems
- Reference locations in object placement
- Link actions to cultural practices and traditions
- Maintain technological consistency

### Plot Integration
- Track plot-critical objects and their status
- Connect actions to story beats and character goals
- Reference object significance in story development
- Use action sequences in dramatic moments

## Implementation Phases

### Phase 1: Core Structure
1. Create data types and object/action models
2. Implement basic CRUD operations
3. Set up component architecture
4. Add to tab configuration

### Phase 2: Basic UI
1. Create object and action management interfaces
2. Implement category and organization systems
3. Add basic search and filtering
4. Create simple tracking features

### Phase 3: Advanced Features
1. Implement interaction and sequence builders
2. Add visual organization tools
3. Create analytics and tracking dashboards
4. Build relationship mapping features

### Phase 4: AI Integration
1. Implement generation services
2. Add smart categorization and suggestions
3. Create contextual recommendations
4. Integrate with story analysis tools

## Future Enhancements

### Advanced Features
- **3D Object Visualization**: Interactive 3D models and object manipulation
- **Physics Simulation**: Realistic object behavior and interaction modeling
- **Crafting System**: Complex item creation and modification workflows
- **Action Animation**: Visual representation of action sequences
- **Object Evolution**: Track how objects change and develop over time

### AI Enhancements
- **Smart Object Placement**: AI suggestions for optimal object positioning in scenes
- **Action Optimization**: AI analysis of action effectiveness and alternatives
- **Consistency Checking**: Automatic validation of object and action logic
- **Cultural Adaptation**: AI suggestions for cultural variations and authenticity
- **Narrative Integration**: AI analysis of how objects and actions serve story purposes

This Objects & Actions tab will provide writers with comprehensive tools for managing the physical and behavioral elements that bring stories to life while maintaining the clean architecture and user experience standards of the application.
