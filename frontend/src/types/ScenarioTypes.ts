// Style settings interface based on StoryStyleTab
export interface StyleSettings {
    style?: string;
    genre?: string;
    tone?: string;
    language?: string;
    theme?: string;
    other?: string;
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
    
    // Image fields
    imageId?: string; // ID of the associated image from scenario_images table
    imageUrl?: string; // URL/path to the image file
};