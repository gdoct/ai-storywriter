// Import types for other tabs
import { MultipleChapters } from './chapters';

// Fill-in story interface for FillInTab
export interface FillIn {
    beginning?: string;
    ending?: string;
}

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

// Location interface for LocationsTab
export interface Location {
    id: string; // should be a GUID
    name?: string;
    visualDescription?: string; // Physical appearance and atmosphere
    background?: string; // History, significance, and context
    extraInfo?: string; // Additional details
    imageId?: string; // ID of the associated image from location_images table
    imageUrl?: string; // URL/path to the image file
    image_data?: string; // Base64 encoded image data (when available)
    image_mime_type?: string; // MIME type of the image (when available)
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

// Timeline event interface for TimelineTab
export interface TimelineEvent {
    id: string; // Unique identifier (UUID)
    title: string;
    description: string;
    date: string;
    location?: string; // Location name where the event takes place
    charactersInvolved: string[]; // Array of character names
    includeInStory: boolean; // Whether to render in story or use as backstory
    position: { x: number; y: number }; // Position in the flowchart (freely movable)
    connections: {
        inputs: string[]; // IDs of events connected to this event's top connection point
        outputs: string[]; // IDs of events connected from this event's bottom connection point
    };
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
    locations?: Location[];
    scenes? : Scene[];
    notes?: string;
    backstory?: string;
    multipleChapters?: MultipleChapters;
    fillIn?: FillIn;
    timeline?: TimelineEvent[];
    
    // Image fields
    imageId?: string; // ID of the associated image from scenario_images table
    imageUrl?: string; // URL/path to the image file
    
    // Optional tabs functionality
    visibleTabs?: string[]; // Track which tabs are visible for this scenario
};

/* 
export type Scenario = {
    title?: string;
    synopsis?: string;
    backstory?: string;
    writingStyle?: {
        genre?: string;
    };  
    storyarc?: string;
    characters?: [{ 
        name?: string; 
        alias?: string; 
        role?: string; 
        gender?: string; 
        appearance?: string; 
        backstory?: string; 
    }];
}


*/