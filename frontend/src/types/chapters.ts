
// frontend/src/types/chapters.ts

export interface ChapterVersion {
  id: string;
  versionNumber: number;
  content: string;
  wordCount: number;
  status: 'generating' | 'complete' | 'archived';
  generationPrompt: string;
  aiModel: string;
  qualityScore?: number;
}

export interface ChapterSynopsis {
  shortSummary: string;
  detailedSummary: string;
  keyEvents: string[];
  characterDevelopments: string[];
}

export interface Chapter {
  id: string;
  title: string;
  number: number;
  description: string;
  status: 'planned' | 'drafted' | 'finalized';
  wordCountTarget: number;
  generatedVersions: ChapterVersion[];
  selectedVersionId: string | null;
  customContent: string;
  synopsis: ChapterSynopsis;
  outline: any; // to be defined later
  objectives: any; // to be defined later
  plotPoints: any; // to be defined later
  characterArcs: any; // to be defined later
  linkedEvents: string[];
  linkedCharacters: string[];
  linkedLocations: string[];
  linkedThemes: string[];
}

export interface MultipleChapters {
  chapters: Chapter[];
  chapterStructure: string; // e.g., 'three-act'
  globalSettings: {
    namingConvention: string;
    defaultWordCount: number;
  };
  crossReferences: any[]; // to be defined later
}
