import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import { NavigationBar } from './NavigationBar';
import { ReaderControls } from './ReaderControls';
import { AiStoryReaderProps, BookmarkData, DisplayMode, TextSelection, ThemeSettings } from './types';
import './AiStoryReader.css';

const DEFAULT_SETTINGS: ThemeSettings = {
  fontFamily: 'serif',
  fontSize: '18px',
  lineHeight: '1.6',
  textAlign: 'left',
  theme: 'light'
};

export const AiStoryReader: React.FC<AiStoryReaderProps> = ({
  text,
  title,
  author,
  readingTime,
  progress = 0,
  displayMode = 'scroll',
  isModal = false,
  enableTTS = false,
  enableBookmark = false,
  enableHighlight = false,
  enableRating = false,
  onProgressChange,
  onBookmark,
  onHighlight,
  onRating,
  onSettingsChange,
  onModeChange,
  ariaLabel,
  ariaDescribedBy,
}) => {
  const { theme } = useTheme();
  const contentRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<ThemeSettings>(DEFAULT_SETTINGS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSelection, setCurrentSelection] = useState<TextSelection | null>(null);

  // Handle text selection for highlighting
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || !enableHighlight) return;

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();

    if (selectedText && contentRef.current) {
      const start = range.startOffset;
      const end = range.endOffset;
      
      setCurrentSelection({ text: selectedText, start, end });
      onHighlight?.({ text: selectedText, start, end });
    }
  }, [enableHighlight, onHighlight]);

  // Handle bookmark creation
  const handleBookmark = useCallback(() => {
    if (!enableBookmark) return;

    const bookmark: BookmarkData = {
      position: progress,
      text: text.slice(0, 100) + '...',
      timestamp: Date.now(),
    };

    onBookmark?.(bookmark);
  }, [enableBookmark, onBookmark, progress, text]);

  // Handle TTS toggle
  const handleTTSToggle = useCallback(() => {
    setIsPlaying(!isPlaying);
    // TTS implementation to be added
  }, [isPlaying]);

  // Handle settings changes
  const handleSettingsChange = useCallback((newSettings: ThemeSettings) => {
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  }, [onSettingsChange]);

  // Update progress based on scroll position
  useEffect(() => {
    if (displayMode !== 'scroll' || !contentRef.current) return;

    const handleScroll = () => {
      const element = contentRef.current;
      if (!element) return;

      const progress = (element.scrollTop / (element.scrollHeight - element.clientHeight)) * 100;
      onProgressChange?.(Math.min(100, Math.max(0, progress)));
    };

    const element = contentRef.current;
    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, [displayMode, onProgressChange]);

  return (
    <div 
      className={`ai-story-reader ${theme} ${isModal ? 'modal' : ''} mode-${displayMode}`}
      role="document"
      aria-label={ariaLabel || title}
      aria-describedby={ariaDescribedBy}
    >
      <div className="ai-story-reader__header">
        {title && <h1 className="ai-story-reader__title">{title}</h1>}
        {author && <p className="ai-story-reader__author">By {author}</p>}
        {readingTime && (
          <p className="ai-story-reader__meta">
            Estimated reading time: {readingTime} minutes
          </p>
        )}
      </div>

      <ReaderControls
        displayMode={displayMode}
        settings={settings}
        onModeChange={onModeChange || (() => {})}
        onSettingsChange={handleSettingsChange}
      />

      <NavigationBar
        progress={progress}
        enableBookmark={enableBookmark}
        enableTTS={enableTTS}
        onProgressChange={onProgressChange || (() => {})}
        onBookmarkToggle={handleBookmark}
        onTTSToggle={handleTTSToggle}
        isPlaying={isPlaying}
      />

      <div 
        ref={contentRef}
        className="ai-story-reader__content"
        style={{
          fontFamily: settings.fontFamily,
          fontSize: settings.fontSize,
          lineHeight: settings.lineHeight,
          textAlign: settings.textAlign,
        }}
        onMouseUp={handleTextSelection}
        role="article"
      >
        {text}
      </div>

      {enableRating && (
        <div className="ai-story-reader__rating">
          {/* Rating component implementation */}
        </div>
      )}
    </div>
  );
};
