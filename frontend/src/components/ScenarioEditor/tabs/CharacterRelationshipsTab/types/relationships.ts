// Character Relationships Tab Types
// This file contains all the TypeScript interfaces for the Character Relationships functionality

export interface CharacterRelationships {
  relationships: Relationship[];
  relationshipTypes: RelationshipType[];
  dynamics: RelationshipDynamic[];
  conflicts: RelationshipConflict[];
  histories: RelationshipHistory[];
  groups: CharacterGroup[];
  generalNotes: string;
}

export interface Relationship {
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

export interface RelationshipType {
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

export interface RelationshipDynamic {
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

export interface RelationshipConflict {
  id: string;
  relationshipId: string;
  title: string;
  type: 'values' | 'goals' | 'methods' | 'misunderstanding' | 'external' | 'internal' | 'historical';
  description: string;
  rootCause: string;
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

export interface RelationshipHistory {
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

export interface CharacterGroup {
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

export interface RelationshipOrigin {
  when: string;
  where: string;
  how: string;
  circumstances: string;
  firstImpressions: FirstImpression[];
  immediateImpact: string;
  witnesses: string[];
}

export interface RelationshipArc {
  stage: string;
  description: string;
  keyEvents: string[];
  emotions: string[];
  growth: string;
  setbacks: string;
  timeframe: string;
  storyConnection: string;
}

export interface PowerDynamic {
  type: 'equal' | 'dominant_submissive' | 'shifting' | 'complex';
  description: string;
  sources: string[]; // What gives power
  manifestations: string[];
  changes: string; // How it evolves
}

export interface CommunicationStyle {
  frequency: 'constant' | 'regular' | 'occasional' | 'rare' | 'crisis_only';
  methods: string[]; // How they communicate
  barriers: string[]; // What hinders communication
  patterns: string[]; // Recurring communication patterns
  effectiveness: number; // 1-10 rating
}

export interface DynamicFactor {
  factor: string;
  influence: number; // -5 to +5
  description: string;
  stability: 'constant' | 'variable' | 'seasonal' | 'event_driven';
}

export interface ConflictPosition {
  characterId: string;
  position: string;
  reasoning: string;
  emotions: string[];
  stakes: string;
  flexibility: number; // 1-10, willingness to compromise
}

export interface ConflictEscalation {
  stage: string;
  description: string;
  triggers: string[];
  actions: string[];
  consequences: string[];
  pointOfNoReturn?: boolean;
}

export interface ConflictResolution {
  type: 'compromise' | 'victory' | 'defeat' | 'transformation' | 'external' | 'unresolved';
  description: string;
  outcome: string;
  growth: string[];
  costs: string[];
  newEquilibrium: string;
}

export interface GroupMember {
  characterId: string;
  role: string;
  status: 'core' | 'peripheral' | 'new' | 'leaving' | 'expelled' | 'honorary';
  influence: number; // 1-10
  loyalty: number; // 1-10
  joinDate: string;
  contributions: string[];
  conflicts: string[];
}

export interface GroupHierarchy {
  level: number;
  title: string;
  characterId: string;
  responsibilities: string[];
  authority: string[];
  accountableTo?: string; // Character ID
}

export interface FirstImpression {
  characterId: string;
  impression: string;
  accuracy: 'accurate' | 'partially_accurate' | 'misleading' | 'completely_wrong';
  evolution: string; // How it changed over time
}
