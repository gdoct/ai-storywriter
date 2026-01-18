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
  // Extended character information for tooltips
  alias?: string;
  role?: string;
  gender?: string;
  appearance?: string;
  backstory?: string;
  extraInfo?: string;
}

export interface ChoiceOption {
  label: string;
  description: string;
}

export interface InlineChoicePanel {
  choices: ChoiceOption[];
  selectedChoice?: ChoiceOption | null;  // The choice that was selected (for historical panels)
  isActive?: boolean;  // True if this is the current active choice panel
  userDirection?: string;  // Optional user direction text that was submitted
}

export interface ParagraphData {
  id: string | number;
  content: string;
  isChoice?: boolean;  // For choice paragraphs (e.g., "[CHOICE: ...]")
  choicePanel?: InlineChoicePanel;  // Inline choice panel to show after this paragraph
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

  // Streaming/auto-scroll props
  /** When true, auto-scrolls to bottom as new content arrives */
  isStreaming?: boolean;

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

  // Paragraph-level control (for interactive paragraph actions)
  paragraphs?: ParagraphData[];  // Structured paragraph data (alternative to text)
  enableParagraphActions?: boolean;  // Show hover actions on paragraphs
  onParagraphCopy?: (index: number, paragraph: ParagraphData) => void;
  onParagraphRegenerate?: (index: number, paragraph: ParagraphData) => void;
  onParagraphFork?: (index: number, paragraph: ParagraphData) => void;  // Fork story from this paragraph
  streamingContent?: string;  // Content being streamed for new paragraph

  // Inline choice panel - active choices shown at end of content
  activeChoices?: ChoiceOption[];  // Current choices to display (renders panel at end of content)
  onChoiceSelect?: (choice: ChoiceOption) => void;  // When user clicks a choice
  onChoiceConfirm?: (choice: ChoiceOption, userDirection?: string) => void;  // When user confirms their choice
  selectedChoice?: ChoiceOption | null;  // Currently selected (but not confirmed) choice
  choiceUserDirection?: string;  // Current value of user direction input
  onUserDirectionChange?: (direction: string) => void;  // When user types in direction input
}
