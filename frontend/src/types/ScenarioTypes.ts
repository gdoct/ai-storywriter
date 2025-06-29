// Import types for other tabs
import { CharacterRelationships } from '../components/ScenarioEditor/tabs/CharacterRelationshipsTab/types/relationships';
import { ObjectsAndActions } from '../components/ScenarioEditor/tabs/ObjectsActionsTab/types/objectsActions';
import { ThemesAndSymbols } from '../components/ScenarioEditor/tabs/ThemesSymbolsTab/types/themesSymbols';
import { MultipleChapters } from './chapters';

// Style settings interface based on StoryStyleTab
export interface StyleSettings {
    style?: string;
    genre?: string;
    tone?: string;
    communicationStyle?: string;
    theme?: string;
    other?: string;
    language?: string; 
}

export interface StoryChapter {
  chapterNumber: number;
  content: string;
  isComplete: boolean;
  title?: string; // Optional if you want to extract chapter titles
  sceneId?: string; // <-- add this for scene-chapter mapping
}

export interface GeneratedStory {
  completeText: string; // The full story as a single string
  chapters: StoryChapter[];
}

// Character interface based on CharactersTab
export interface Character {
    id: string; // should be a GUID
    name?: string;
    alias?: string;
    role?: string; 
    gender?: string;
    appearance?: string;
    backstory?: string;
    extraInfo?: string;
    photoId?: string; // ID of the associated photo from character_photos table
    photoUrl?: string; // URL/path to the photo file
    photo_data?: string; // Base64 encoded photo data (when available)
    photo_mime_type?: string; // MIME type of the photo (when available)
}

export interface Scene {
    id: string; // Unique identifier for the scene
    title?: string;
    description?: string;
    characters?: string[]; // Array of character names
    location?: string;
    time?: string; // e.g., "Morning", "Evening"
    notes?: string;
    order?: number; // To maintain the order of scenes
}

export type Scenario = {
    id: string; // should be a GUID
    userId: string; // should be username
    title?: string;
    synopsis?: string;
    createdAt: Date;
    updatedAt?: Date;
    
    // Tab content fields
    writingStyle?: StyleSettings;
    storyarc?: string;
    characters?: Character[];
    scenes? : Scene[];
    notes?: string;
    backstory?: string;
    worldBuilding?: WorldBuilding;
    timeline?: Timeline;
    objectsAndActions?: ObjectsAndActions;
    themesAndSymbols?: ThemesAndSymbols;
    characterRelationships?: CharacterRelationships;
    multipleChapters?: MultipleChapters;
    
    // Image fields
    imageId?: string; // ID of the associated image from scenario_images table
    imageUrl?: string; // URL/path to the image file
    
    // Optional tabs functionality
    visibleTabs?: string[]; // Track which tabs are visible for this scenario
};

// World Building interfaces
export interface Location {
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
  photoId?: string;
  photoUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Culture {
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
  photoId?: string;
  photoUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MagicSystem {
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

export interface Technology {
  id: string;
  name: string;
  description: string;
  functionality: string;
  availability: string;
  creators?: string;
  impact?: string;
  limitations?: string;
  evolution?: string;
  photoId?: string;
  photoUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Religion {
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
  photoId?: string;
  photoUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
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
  photoId?: string;
  photoUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WorldBuilding {
  locations: Location[];
  cultures: Culture[];
  magicSystems: MagicSystem[];
  technologies: Technology[];
  religions: Religion[];
  organizations: Organization[];
  generalNotes: string;
}

// Timeline interfaces
export interface EventDate {
  era?: string;
  year: number;
  month?: number;
  day?: number;
  hour?: number;
  displayFormat: string; // How to display this date
  isApproximate: boolean;
  calendar?: string; // Calendar system ID
}

export interface EventDuration {
  years?: number;
  months?: number;
  days?: number;
  hours?: number;
  description?: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  type: 'historical' | 'plot' | 'character' | 'world' | 'planned' | 'other';
  importance: 'critical' | 'major' | 'minor' | 'background';
  date: EventDate;
  duration?: EventDuration;
  location?: string;
  participants: string[];
  consequences: string;
  causes: string;
  relatedEvents: string[]; // IDs of related events
  storyRelevance: string;
  tags: string[];
  photoUrl?: string;
  isCompleted: boolean; // For planned events
  createdAt: string;
  updatedAt: string;
}

export interface Era {
  id: string;
  name: string;
  description: string;
  startDate: EventDate;
  endDate?: EventDate;
  characteristics: string;
  keyEvents: string[]; // Event IDs
  technology: string;
  culture: string;
  politics: string;
  conflicts: string;
  photoUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SpecialDay {
  name: string;
  month: number;
  day: number;
  description: string;
  significance: string;
}

export interface Calendar {
  id: string;
  name: string;
  description: string;
  type: 'standard' | 'lunar' | 'seasonal' | 'magical' | 'technological' | 'custom';
  yearLength: number; // days
  monthsPerYear: number;
  daysPerMonth: number[];
  monthNames: string[];
  specialDays: SpecialDay[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Timeline {
  events: TimelineEvent[];
  eras: Era[];
  calendars: Calendar[];
  generalNotes: string;
}