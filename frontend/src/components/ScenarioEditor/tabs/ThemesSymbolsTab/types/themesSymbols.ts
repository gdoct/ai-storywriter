// Themes & Symbols Tab Types
// This file contains all the TypeScript interfaces for the Themes & Symbols functionality

export interface ThemesAndSymbols {
  themes: Theme[];
  symbols: Symbol[];
  motifs: Motif[];
  metaphors: Metaphor[];
  archetypes: Archetype[];
  literaryDevices: LiteraryDevice[];
  generalNotes: string;
}

export interface Theme {
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

export interface Symbol {
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

export interface Motif {
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

export interface Metaphor {
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

export interface Archetype {
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

export interface LiteraryDevice {
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

// Supporting interfaces
export interface ThemeExpression {
  location: string; // Chapter, scene reference
  method: 'dialogue' | 'action' | 'description' | 'metaphor' | 'symbol' | 'conflict';
  content: string;
  subtlety: 'explicit' | 'implicit' | 'symbolic';
  effectiveness: number; // 1-5 rating
}

export interface SymbolAppearance {
  location: string;
  context: string;
  significance: string;
  transformation?: string; // How it changes
}

export interface MotifVariation {
  instance: string;
  variation: string;
  significance: string;
  context: string;
}

export interface ArchetypeMapping {
  characterId: string;
  characterName: string;
  adherence: number; // How closely they match (1-5)
  deviations: string[];
}

export interface DeviceExample {
  location: string;
  example: string;
  analysis: string;
  effectiveness: number;
}

// Sub-tab types for the UI
export type ThemesSymbolsSubTab = 'themes' | 'symbols' | 'motifs' | 'metaphors' | 'archetypes' | 'devices';
