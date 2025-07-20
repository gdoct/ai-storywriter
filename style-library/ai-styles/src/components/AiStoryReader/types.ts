export type DisplayMode = 'scroll' | 'paginated' | 'preview';

export interface TextSelection {
  text: string;
  start: number;
  end: number;
}

export interface BookmarkData {
  position: number;
  text: string;
  timestamp: number;
}

export interface ThemeSettings {
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  textAlign: 'left' | 'justify' | 'center';
  theme: 'light' | 'dark' | 'sepia' | 'high-contrast';
}

export interface CharacterData {
  id: string;
  name: string;
  image: string;
}

export interface AiStoryReaderProps {
  // Core content props
  text: string;
  title?: string;
  author?: string;
  readingTime?: number;
  progress?: number;

  // Visual content props
  coverImage?: string;
  characters?: CharacterData[];

  // Display settings
  displayMode?: DisplayMode;
  isModal?: boolean;
  theme?: ThemeSettings;
  
  // Feature flags
  enableTTS?: boolean;
  enableBookmark?: boolean;
  enableHighlight?: boolean;
  enableRating?: boolean;
  enableFullScreen?: boolean;
  
  // Event handlers
  onProgressChange?: (progress: number) => void;
  onBookmark?: (bookmark: BookmarkData) => void;
  onHighlight?: (selection: TextSelection) => void;
  onRating?: (rating: number) => void;
  onSettingsChange?: (settings: ThemeSettings) => void;
  onModeChange?: (mode: DisplayMode) => void;
  onDownload?: () => void;
  onClose?: () => void;
  
  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
}
