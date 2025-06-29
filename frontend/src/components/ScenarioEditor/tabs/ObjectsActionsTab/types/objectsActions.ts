// Objects & Actions Tab Types
// This file contains all the TypeScript interfaces for the Objects & Actions functionality

export interface ObjectsAndActions {
  objects: StoryObject[];
  actions: StoryAction[];
  objectCategories: ObjectCategory[];
  actionCategories: ActionCategory[];
  interactions: ObjectInteraction[];
  sequences: ActionSequence[];
  generalNotes: string;
}

export interface StoryObject {
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

export interface StoryAction {
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

export interface ObjectCategory {
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

export interface ActionCategory {
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

export interface ObjectInteraction {
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

export interface ActionSequence {
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

// Supporting interfaces
export interface PhysicalProperties {
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

export interface ObjectOrigin {
  creator?: string;
  creationMethod: string;
  creationDate?: string;
  creationLocation?: string;
  materials: string[];
  purpose: string;
  inspiration?: string;
  backstory: string;
}

export interface ObjectHistory {
  event: string;
  date: string;
  location: string;
  participants: string[];
  significance: string;
  changes: string[];
  context: string;
}

export interface Ownership {
  ownerId: string;
  ownerName: string;
  ownerType: 'character' | 'organization' | 'location' | 'entity';
  acquisitionMethod: 'inherited' | 'purchased' | 'found' | 'gifted' | 'stolen' | 'created' | 'other';
  acquisitionDate?: string;
  acquisitionStory?: string;
  currentStatus: 'current' | 'past' | 'disputed' | 'unknown';
  relationship: string; // How they relate to the object
}

export interface ObjectLocation {
  currentLocation: string;
  locationType: 'carried' | 'stored' | 'displayed' | 'hidden' | 'lost' | 'destroyed' | 'unknown';
  accessibility: 'public' | 'restricted' | 'private' | 'secret' | 'impossible';
  security: 'none' | 'basic' | 'moderate' | 'high' | 'extreme';
  conditions: string[];
  history: LocationHistory[];
}

export interface ObjectSymbolism {
  meaning: string;
  culturalSignificance: string;
  personalSignificance?: string;
  evolution: string;
  interpretation: string[];
}

export interface ObjectRole {
  plotRole: 'macguffin' | 'weapon' | 'key' | 'evidence' | 'catalyst' | 'obstacle' | 'reward' | 'none';
  characterRole: 'signature-item' | 'memento' | 'tool' | 'burden' | 'goal' | 'none';
  themeRole: string;
  importance: 'essential' | 'important' | 'useful' | 'decorative';
}

export interface ObjectAppearance {
  location: string; // Where in story
  context: string;
  purpose: string;
  description: string;
  changes?: string;
  significance: string;
}

export interface ActionPurpose {
  immediate: string;
  longTerm?: string;
  hidden?: string;
  character: string; // What it reveals about character
  plot: string; // How it advances plot
  theme?: string; // Thematic significance
}

export interface ActionDuration {
  timeframe: 'instant' | 'seconds' | 'minutes' | 'hours' | 'days' | 'longer';
  specific?: string;
  variable: boolean;
  factors?: string[]; // What affects duration
}

export interface ActionRequirements {
  skills: string[];
  tools: string[]; // Object IDs
  conditions: string[];
  knowledge: string[];
  physical: string[];
  mental: string[];
  resources?: string[];
}

export interface ActionConsequences {
  immediate: string[];
  shortTerm: string[];
  longTerm: string[];
  unintended: string[];
  risks: string[];
  benefits: string[];
}

export interface ActionVariation {
  name: string;
  description: string;
  differences: string[];
  requirements: string[];
  outcomes: string[];
  context: string;
}

export interface ActionContext {
  situation: string;
  appropriateness: string;
  effectiveness: string;
  alternatives: string[];
  considerations: string[];
}

export interface CharacterActionAssociation {
  characterId: string;
  characterName: string;
  proficiency: 'novice' | 'competent' | 'skilled' | 'expert' | 'master';
  frequency: 'never' | 'rarely' | 'sometimes' | 'often' | 'always';
  style: string; // How they perform it
  motivation: string; // Why they do it
  history: string; // Their experience with it
}

export interface CulturalAction {
  culturalSignificance: string;
  traditions: string[];
  taboos: string[];
  variations: string[];
  ritualAspects?: string;
  socialImplications: string[];
}

export interface ActionSymbolism {
  meaning: string;
  interpretation: string[];
  context: string;
  evolution?: string;
}

export interface CategoryAttribute {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'list';
  required: boolean;
  defaultValue?: any;
  options?: string[];
  description: string;
}

export interface InteractionParticipant {
  id: string;
  type: 'character' | 'group' | 'entity';
  role: string;
  involvement: 'primary' | 'secondary' | 'observer' | 'affected';
}

export interface InteractionOutcome {
  type: 'creation' | 'destruction' | 'transformation' | 'discovery' | 'transfer' | 'change';
  description: string;
  objects: string[]; // Affected object IDs
  probability: 'certain' | 'likely' | 'possible' | 'unlikely';
  conditions?: string[];
}

export interface SequenceStep {
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

export interface SequenceOutcome {
  type: 'success' | 'failure' | 'partial' | 'unexpected';
  description: string;
  consequences: string[];
  probability: string;
  conditions: string[];
}

export interface SequenceVariation {
  name: string;
  description: string;
  changes: string[];
  context: string;
  outcomes: string[];
}

export interface LocationHistory {
  location: string;
  period: string;
  reason: string;
  circumstances: string;
}

// Sub-tab types for the UI
export type ObjectsActionsSubTab = 'objects' | 'actions' | 'categories' | 'interactions' | 'sequences';
