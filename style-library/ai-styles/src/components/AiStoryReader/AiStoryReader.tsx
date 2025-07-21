import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import { IconButton } from '../IconButton/IconButton';
import type { AiStoryReaderProps, BookmarkData, TextSelection, ThemeSettings, CharacterData } from './types';
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
  coverImage,
  characters,
  enableTTS = false,
  enableBookmark = false,
  enableHighlight = false,
  enableRating = false,
  enableFullScreen = true,
  onProgressChange,
  onBookmark,
  onHighlight,
  onRating: _onRating,
  onSettingsChange,
  onModeChange,
  onDownload,
  onClose,
  ariaLabel,
  ariaDescribedBy,
}) => {
  const { theme } = useTheme();
  const contentRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<number | undefined>(undefined);
  
  const [settings, setSettings] = useState<ThemeSettings>(DEFAULT_SETTINGS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [_currentSelection, setCurrentSelection] = useState<TextSelection | null>(null);
  
  // UI State
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [heroCollapsed, setHeroCollapsed] = useState(false);
  const [topPanelVisible, setTopPanelVisible] = useState(false);
  const [bottomPanelVisible, setBottomPanelVisible] = useState(false);
  const [edgeTriggersVisible, setEdgeTriggersVisible] = useState(false);

  // Auto-hide functionality
  const resetHideTimer = useCallback(() => {
    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = window.setTimeout(() => {
      if (!isFullScreen) {
        setTopPanelVisible(false);
        setBottomPanelVisible(false);
      }
    }, 3000);
  }, [isFullScreen]);

  const showTopPanel = useCallback(() => {
    setTopPanelVisible(true);
    resetHideTimer();
  }, [resetHideTimer]);

  const showBottomPanel = useCallback(() => {
    setBottomPanelVisible(true);
    resetHideTimer();
  }, [resetHideTimer]);

  const hideAllPanels = useCallback(() => {
    setTopPanelVisible(false);
    setBottomPanelVisible(false);
    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current);
    }
  }, []);

  // Full-screen functionality
  const enterFullScreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullScreen(true);
      setEdgeTriggersVisible(true);
      hideAllPanels();
    } catch (error) {
      console.warn('Could not enter fullscreen:', error);
    }
  }, [hideAllPanels]);

  const exitFullScreen = useCallback(async () => {
    try {
      await document.exitFullscreen();
      setIsFullScreen(false);
      setEdgeTriggersVisible(false);
    } catch (error) {
      console.warn('Could not exit fullscreen:', error);
    }
  }, []);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullScreen(isCurrentlyFullscreen);
      setEdgeTriggersVisible(isCurrentlyFullscreen);
      if (!isCurrentlyFullscreen) {
        hideAllPanels();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [hideAllPanels]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullScreen) {
        exitFullScreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, exitFullScreen]);

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

  const renderCharacterAvatars = (characters: CharacterData[]) => (
    <div className="hero-section__characters">
      {characters.map((character) => (
        <div key={character.id} className="character-avatar" title={character.name}>
          <img src={character.image} alt={character.name} />
          <div className="character-tooltip">
            <div className="character-tooltip__content">
              <div className="character-tooltip__header">
                <img src={character.image} alt={character.name} />
                <div>
                  <h3 className="character-tooltip__name">{character.name}</h3>
                  {character.alias && (
                    <p className="character-tooltip__alias">"{character.alias}"</p>
                  )}
                </div>
              </div>
              
              {(character.role || character.gender) && (
                <div className="character-tooltip__basics">
                  {character.role && (
                    <span className="character-tooltip__tag role">
                      {character.role}
                    </span>
                  )}
                  {character.gender && (
                    <span className="character-tooltip__tag gender">
                      {character.gender}
                    </span>
                  )}
                </div>
              )}
              
              {character.appearance && (
                <div className="character-tooltip__section">
                  <h4>Appearance</h4>
                  <p>{character.appearance}</p>
                </div>
              )}
              
              {character.backstory && (
                <div className="character-tooltip__section">
                  <h4>Background</h4>
                  <p>{character.backstory}</p>
                </div>
              )}
              
              {character.extraInfo && (
                <div className="character-tooltip__section">
                  <h4>Additional Info</h4>
                  <p>{character.extraInfo}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderHeroSection = () => (
    <div className={`hero-section ${heroCollapsed ? 'collapsed' : 'expanded'}`}>
      {!heroCollapsed && coverImage && (
        <div 
          className="hero-section__background"
          style={{ backgroundImage: `url(${coverImage})` }}
        >
          <div className="hero-section__overlay">
            <div className="hero-section__content">
              {title && <h1 className="hero-section__title">{title}</h1>}
              {author && <p className="hero-section__author">By {author}</p>}
              {readingTime && (
                <p className="hero-section__meta">
                  📖 {readingTime} minute read
                </p>
              )}
              {characters && characters.length > 0 && renderCharacterAvatars(characters)}
            </div>
            <div className="hero-section__actions">
              <IconButton
                icon="⚙️"
                onClick={showTopPanel}
                title="Show reading controls (font, theme, etc.)"
                className="hero-action-btn"
              />
              {onDownload && (
                <IconButton
                  icon="📥"
                  onClick={onDownload}
                  title="Download story"
                  className="hero-action-btn"
                />
              )}
              {enableFullScreen && (
                <IconButton
                  icon={isFullScreen ? "🔲" : "⛶"}
                  onClick={isFullScreen ? exitFullScreen : enterFullScreen}
                  title={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
                  className="hero-action-btn"
                />
              )}
              {onClose && (
                <IconButton
                  icon="✕"
                  onClick={onClose}
                  title="Close reader"
                  className="hero-action-btn"
                />
              )}
            </div>
          </div>
        </div>
      )}
      
      {(heroCollapsed || !coverImage) && (
        <div className="hero-section__compact">
          <div className="hero-section__compact-content">
            {title && <h1 className="hero-section__title-compact">{title}</h1>}
            {characters && characters.length > 0 && renderCharacterAvatars(characters)}
          </div>
          <div className="hero-section__actions">
            <IconButton
              icon="⚙️"
              onClick={showTopPanel}
              title="Show reading controls (font, theme, etc.)"
              size="sm"
              className="hero-action-btn-compact reading-controls-btn"
            />
            {onDownload && (
              <IconButton
                icon="📥"
                onClick={onDownload}
                title="Download story"
                size="sm"
                className="hero-action-btn-compact"
              />
            )}
            {enableFullScreen && (
              <IconButton
                icon={isFullScreen ? "🔲" : "⛶"}
                onClick={isFullScreen ? exitFullScreen : enterFullScreen}
                title={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
                size="sm"
                className="hero-action-btn-compact"
              />
            )}
            {onClose && (
              <IconButton
                icon="✕"
                onClick={onClose}
                title="Close reader"
                size="sm"
                className="hero-action-btn-compact"
              />
            )}
          </div>
        </div>
      )}
      
      <button 
        className="hero-section__toggle"
        onClick={() => setHeroCollapsed(!heroCollapsed)}
        title={heroCollapsed ? "Expand header" : "Collapse header"}
      >
        {heroCollapsed ? "▼" : "▲"}
      </button>
    </div>
  );

  const renderTopPanel = () => (
    <div className={`slide-panel slide-panel--top ${topPanelVisible ? 'visible' : ''}`}>
      <div className="slide-panel__content">
        <div className="control-group">
          <label htmlFor="display-mode">View:</label>
          <select
            id="display-mode"
            value={displayMode}
            onChange={(e) => onModeChange?.(e.target.value as any)}
          >
            <option value="scroll">Continuous</option>
            <option value="paginated">Pages</option>
            <option value="preview">Preview</option>
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="theme">Theme:</label>
          <select
            id="theme"
            value={settings.theme}
            onChange={(e) => handleSettingsChange({ ...settings, theme: e.target.value as any })}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="sepia">Sepia</option>
            <option value="high-contrast">High Contrast</option>
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="font-family">Font:</label>
          <select
            id="font-family"
            value={settings.fontFamily}
            onChange={(e) => handleSettingsChange({ ...settings, fontFamily: e.target.value })}
          >
            <option value="serif">Serif</option>
            <option value="sans-serif">Sans Serif</option>
            <option value="monospace">Monospace</option>
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="font-size">Size:</label>
          <select
            id="font-size"
            value={settings.fontSize}
            onChange={(e) => handleSettingsChange({ ...settings, fontSize: e.target.value })}
          >
            <option value="16px">Small</option>
            <option value="18px">Medium</option>
            <option value="20px">Large</option>
            <option value="24px">Extra Large</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderBottomPanel = () => (
    <div className={`slide-panel slide-panel--bottom ${bottomPanelVisible ? 'visible' : ''}`}>
      <div className="slide-panel__content">
        <div className="progress-section">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => onProgressChange?.(Number(e.target.value))}
            aria-label="Reading progress"
            className="progress-bar"
          />
          <span className="progress-text">{Math.round(progress)}%</span>
        </div>

        <div className="navigation-controls">
          {enableBookmark && (
            <IconButton
              icon="🔖"
              onClick={handleBookmark}
              title="Bookmark"
              size="sm"
            />
          )}

          {enableTTS && (
            <IconButton
              icon={isPlaying ? "⏸️" : "▶️"}
              onClick={handleTTSToggle}
              title={isPlaying ? 'Pause text-to-speech' : 'Start text-to-speech'}
              size="sm"
            />
          )}
        </div>
      </div>
    </div>
  );

  const renderEdgeTriggers = () => (
    edgeTriggersVisible && (
      <>
        <div 
          className="edge-trigger edge-trigger--top"
          onMouseEnter={showTopPanel}
          onMouseLeave={hideAllPanels}
        />
        <div 
          className="edge-trigger edge-trigger--bottom"
          onMouseEnter={showBottomPanel}
          onMouseLeave={hideAllPanels}
        />
      </>
    )
  );

  return (
    <div 
      className={`ai-story-reader ${theme} ${isModal ? 'modal' : ''} ${isFullScreen ? 'fullscreen' : ''} mode-${displayMode}`}
      role="document"
      aria-label={ariaLabel || title}
      aria-describedby={ariaDescribedBy}
    >
      {/* Hero Section */}
      {!isFullScreen && renderHeroSection()}

      {/* Slide-in Control Panels */}
      {renderTopPanel()}
      {renderBottomPanel()}

      {/* Edge Triggers for Full-screen */}
      {renderEdgeTriggers()}

      {/* Content Area - Takes up 85-90% of space */}
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
        onMouseMove={() => !isFullScreen && resetHideTimer()}
        onClick={() => !isFullScreen && (showTopPanel(), showBottomPanel())}
        role="article"
      >
        {text}
      </div>

      {/* Non-fullscreen UI triggers */}
      {!isFullScreen && (
        <div className="ui-triggers">
          <button 
            className="ui-trigger ui-trigger--top"
            onMouseEnter={showTopPanel}
            onClick={showTopPanel}
            title="Show reading controls"
          />
          <button 
            className="ui-trigger ui-trigger--bottom"
            onMouseEnter={showBottomPanel}
            onClick={showBottomPanel}
            title="Show navigation controls"
          />
        </div>
      )}

      {enableRating && !isFullScreen && (
        <div className="ai-story-reader__rating">
          {/* Rating component implementation */}
        </div>
      )}
    </div>
  );
};