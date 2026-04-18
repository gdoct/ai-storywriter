/**
 * RollingStoryModal - Interactive paragraph-by-paragraph story generation with choices
 */
import { Button, AiStoryReader, ChoiceOption, ParagraphData, InlineChoicePanel } from '@drdata/ai-styles';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes, FaBook, FaUsers, FaCog } from 'react-icons/fa';
import { FaPlay, FaLocationDot, FaCube, FaClockRotateLeft, FaStop } from 'react-icons/fa6';
import { Scenario } from '@shared/types/ScenarioTypes';
import {
  RollingStory,
  StoryBibleEntry,
  StoryEvent,
  StoryParagraph,
  Choice,
  createRollingStory,
  fetchRollingStoryDetail,
  streamGenerateParagraphs,
  deleteParagraphsFrom,
} from '@shared/services/rollingStoriesService';
import './RollingStoryModal.css';

export interface RollingStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: Scenario;
  existingStoryId?: number; // If provided, continue an existing story
}

export const RollingStoryModal: React.FC<RollingStoryModalProps> = ({
  isOpen,
  onClose,
  scenario,
  existingStoryId,
}) => {
  // Story state
  const [rollingStory, setRollingStory] = useState<RollingStory | null>(null);
  const [paragraphs, setParagraphs] = useState<StoryParagraph[]>([]);
  const [bible, setBible] = useState<StoryBibleEntry[]>([]);
  const [events, setEvents] = useState<StoryEvent[]>([]);
  const [choices, setChoices] = useState<Choice[]>([]);

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBiblePanel, setShowBiblePanel] = useState(false);
  const [showEventsPanel, setShowEventsPanel] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<ChoiceOption | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [userDirection, setUserDirection] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [paragraphWordCount, setParagraphWordCount] = useState(250);
  const [choiceCount, setChoiceCount] = useState(3);

  // Historical choice panels - maps paragraph ID to the choice panel shown after it
  const [historicalChoicePanels, setHistoricalChoicePanels] = useState<Map<number, InlineChoicePanel>>(new Map());

  // Abort controller for canceling generation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize or load story when modal opens
  useEffect(() => {
    if (isOpen) {
      initializeStory();
    }
  }, [isOpen, existingStoryId]);

  const initializeStory = async () => {
    setIsInitializing(true);
    setError(null);

    try {
      if (existingStoryId) {
        // Load existing story
        const storyDetail = await fetchRollingStoryDetail(existingStoryId);
        setRollingStory(storyDetail);
        setParagraphs(storyDetail.paragraphs);
        setBible(storyDetail.bible);
        setEvents(storyDetail.events);
        setChoices([]); // Choices are generated after each cycle
      } else {
        // Create new story
        const newStory = await createRollingStory(
          scenario.id!,
          scenario.title || 'Untitled Rolling Story'
        );
        setRollingStory(newStory);
        setParagraphs([]);
        setBible([]);
        setEvents([]);
        setChoices([]);
      }
    } catch (err) {
      console.error('Failed to initialize rolling story:', err);
      setError('Failed to initialize story. Please try again.');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleAbortGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  }, []);

  const handleGenerateParagraphs = useCallback(async (chosenAction?: Choice) => {
    if (!rollingStory) return;

    // Cancel any existing generation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsGenerating(true);
    setError(null);
    setStreamingText('');
    setChoices([]);
    setSelectedChoice(null);

    try {
      const request = {
        bible: bible,
        events: events,
        chosen_action: chosenAction?.label || null,
        chosen_action_description: chosenAction?.description,
        advances_arc: chosenAction?.advances_arc || false,
        storyline_influence: userDirection.trim() || undefined,
        paragraph_word_count: paragraphWordCount,
        choice_count: choiceCount,
      };

      // Clear user direction after sending
      setUserDirection('');

      let accumulatedText = '';

      for await (const event of streamGenerateParagraphs(rollingStory.id, request, signal)) {
        if (event.type === 'choice_made') {
          // User's choice was inserted as a paragraph - add it immediately
          if (event.paragraph) {
            setParagraphs((prev) => [...prev, event.paragraph!]);
          }
        } else if (event.type === 'status') {
          // Status updates - could show in UI
          console.log('Status:', event.message);
        } else if (event.type === 'token') {
          // Individual token streaming - append to accumulated text
          accumulatedText += event.content || '';
          setStreamingText(accumulatedText);
        } else if (event.type === 'paragraph_end') {
          // End of paragraph - add separator
          accumulatedText += event.content || '\n\n';
          setStreamingText(accumulatedText);
        } else if (event.type === 'content') {
          // Legacy: full paragraph content (fallback)
          accumulatedText += event.content || '';
          setStreamingText(accumulatedText);
        } else if (event.type === 'storyline') {
          // Running storyline update - could display in UI
          console.log('Storyline:', event.storyline);
        } else if (event.type === 'directive') {
          // Scenarist directive (v2 architecture) - could display in debug UI
          console.log('Scenarist directive:', event.directive);
        } else if (event.type === 'arc_advanced') {
          // Story arc advanced - could show notification
          console.log('Story arc advanced to step:', event.new_step);
        } else if (event.type === 'choices') {
          // Choices received
          setChoices(event.choices || []);
        } else if (event.type === 'complete') {
          // Generation complete
          if (event.paragraphs) {
            setParagraphs((prev) => [...prev, ...event.paragraphs!]);
          }
          if (event.bible_updates) {
            setBible((prev) => [...prev, ...event.bible_updates!]);
          }
          if (event.event_updates) {
            setEvents((prev) => [...prev, ...event.event_updates!]);
          }
          if (event.choices) {
            setChoices(event.choices);
          }
          setStreamingText('');
        } else if (event.type === 'error') {
          setError(event.error || 'Generation failed');
        }
      }
    } catch (err) {
      // Don't show error if aborted
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Generation aborted by user');
      } else {
        console.error('Failed to generate paragraphs:', err);
        setError('Failed to generate story. Please try again.');
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [rollingStory, bible, events, userDirection, paragraphWordCount, choiceCount]);

  // Handle choice selection (for inline choice panel)
  const handleChoiceSelect = useCallback((choice: ChoiceOption) => {
    setSelectedChoice(choice);
  }, []);

  // Handle confirming a choice and continuing the story
  const handleChoiceConfirm = useCallback((choice: ChoiceOption, direction?: string) => {
    if (!choice) return;

    // Get the last paragraph ID to attach historical choice panel to
    const lastParagraph = paragraphs[paragraphs.length - 1];
    if (lastParagraph) {
      // Store the historical choice panel
      setHistoricalChoicePanels(prev => {
        const newMap = new Map(prev);
        newMap.set(lastParagraph.id, {
          choices: choices.map(c => ({ label: c.label, description: c.description })),
          selectedChoice: choice,
          isActive: false,
          userDirection: direction,
        });
        return newMap;
      });
    }

    // Set user direction if provided
    if (direction) {
      setUserDirection(direction);
    }

    // Generate with the choice (convert to backend Choice type)
    const backendChoice: Choice = {
      label: choice.label,
      description: choice.description,
    };
    handleGenerateParagraphs(backendChoice);
  }, [paragraphs, choices, handleGenerateParagraphs]);

  // Handle user direction input changes
  const handleUserDirectionChange = useCallback((direction: string) => {
    setUserDirection(direction);
  }, []);

  const handleCopyParagraph = useCallback(async (paragraphIndex: number) => {
    const paragraph = paragraphs[paragraphIndex];
    if (paragraph) {
      try {
        await navigator.clipboard.writeText(paragraph.content);
        // Could add a toast notification here
      } catch (err) {
        console.error('Failed to copy paragraph:', err);
      }
    }
  }, [paragraphs]);

  const handleRegenerateParagraph = useCallback(async (paragraphIndex: number) => {
    if (!rollingStory || isGenerating) return;

    // Get the paragraph to regenerate from
    const paragraphToRegenerate = paragraphs[paragraphIndex];
    const sequenceThreshold = paragraphToRegenerate.sequence;

    try {
      // Call backend to delete paragraphs from this sequence onwards
      await deleteParagraphsFrom(rollingStory.id, sequenceThreshold);

      // Update local state to reflect the deletion
      const keptParagraphs = paragraphs.slice(0, paragraphIndex);
      setParagraphs(keptParagraphs);

      // Also update bible entries and events in local state
      setBible(prev => prev.filter(entry => entry.introduced_at < sequenceThreshold));
      setEvents(prev => prev.filter(event => event.paragraph_sequence < sequenceThreshold));

      // Clear choices since we're regenerating
      setChoices([]);
      setSelectedChoice(null);

      // Clear historical choice panels for deleted paragraphs
      const keptParagraphIds = new Set(keptParagraphs.map(p => p.id));
      setHistoricalChoicePanels(prev => {
        const newMap = new Map<number, InlineChoicePanel>();
        prev.forEach((panel, paragraphId) => {
          if (keptParagraphIds.has(paragraphId)) {
            newMap.set(paragraphId, panel);
          }
        });
        return newMap;
      });

      // Now generate new paragraphs starting from this point
      handleGenerateParagraphs();
    } catch (err) {
      console.error('Failed to regenerate paragraph:', err);
      setError('Failed to regenerate. Please try again.');
    }
  }, [rollingStory, isGenerating, paragraphs, handleGenerateParagraphs]);

  // Check if a paragraph is a choice paragraph
  const isChoiceParagraph = (content: string) => content.startsWith('[CHOICE:');

  // Format choice paragraph for display
  const formatChoiceText = (content: string) => {
    const match = content.match(/\[CHOICE:\s*(.+?)\]$/);
    return match ? `» ${match[1]}` : content;
  };

  // Combine paragraphs into display text
  const storyText = paragraphs.map((p) =>
    isChoiceParagraph(p.content) ? formatChoiceText(p.content) : p.content
  ).join('\n\n') + (streamingText ? '\n\n' + streamingText : '');

  // Get display text for the reader
  const getDisplayText = () => {
    if (isInitializing) {
      return 'Preparing your interactive story...';
    }
    if (paragraphs.length === 0 && !streamingText && !isGenerating) {
      return 'Ready to begin your interactive story adventure. Click "Begin Story" to start!';
    }
    return storyText || 'Generating...';
  };

  // Bible panel content
  const renderBiblePanel = () => {
    const characters = bible.filter((b) => b.category === 'character');
    const settings = bible.filter((b) => b.category === 'setting');
    const objects = bible.filter((b) => b.category === 'object');

    return (
      <div className="rolling-story__panel rolling-story__bible-panel">
        <div className="rolling-story__panel-header">
          <h3><FaBook /> Story Bible</h3>
          <button onClick={() => setShowBiblePanel(false)} className="rolling-story__panel-close">
            <FaTimes />
          </button>
        </div>
        <div className="rolling-story__panel-content">
          {characters.length > 0 && (
            <div className="rolling-story__bible-section">
              <h4><FaUsers /> Characters</h4>
              {characters.map((entry) => (
                <div key={entry.id} className="rolling-story__bible-entry">
                  <strong>{entry.name}</strong>
                  <p>{JSON.stringify(entry.details)}</p>
                </div>
              ))}
            </div>
          )}
          {settings.length > 0 && (
            <div className="rolling-story__bible-section">
              <h4><FaLocationDot /> Settings</h4>
              {settings.map((entry) => (
                <div key={entry.id} className="rolling-story__bible-entry">
                  <strong>{entry.name}</strong>
                  <p>{JSON.stringify(entry.details)}</p>
                </div>
              ))}
            </div>
          )}
          {objects.length > 0 && (
            <div className="rolling-story__bible-section">
              <h4><FaCube /> Objects</h4>
              {objects.map((entry) => (
                <div key={entry.id} className="rolling-story__bible-entry">
                  <strong>{entry.name}</strong>
                  <p>{JSON.stringify(entry.details)}</p>
                </div>
              ))}
            </div>
          )}
          {bible.length === 0 && (
            <p className="rolling-story__empty-panel">
              Story elements will appear here as your story develops.
            </p>
          )}
        </div>
      </div>
    );
  };

  // Settings panel content
  const renderSettingsPanel = () => (
    <div className="rolling-story__panel rolling-story__settings-panel">
      <div className="rolling-story__panel-header">
        <h3><FaCog /> Story Settings</h3>
        <button onClick={() => setShowSettings(false)} className="rolling-story__panel-close">
          <FaTimes />
        </button>
      </div>
      <div className="rolling-story__panel-content">
        <div className="rolling-story__setting">
          <label>Paragraph length (words)</label>
          <div className="rolling-story__setting-options">
            {[150, 250, 350, 450, 550].map((num) => (
              <button
                key={num}
                className={`rolling-story__setting-btn ${paragraphWordCount === num ? 'rolling-story__setting-btn--active' : ''}`}
                onClick={() => setParagraphWordCount(num)}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
        <div className="rolling-story__setting">
          <label>Number of choices</label>
          <div className="rolling-story__setting-options">
            {[2, 3, 4, 5].map((num) => (
              <button
                key={num}
                className={`rolling-story__setting-btn ${choiceCount === num ? 'rolling-story__setting-btn--active' : ''}`}
                onClick={() => setChoiceCount(num)}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Events panel content
  const renderEventsPanel = () => (
    <div className="rolling-story__panel rolling-story__events-panel">
      <div className="rolling-story__panel-header">
        <h3><FaClockRotateLeft /> Story Events</h3>
        <button onClick={() => setShowEventsPanel(false)} className="rolling-story__panel-close">
          <FaTimes />
        </button>
      </div>
      <div className="rolling-story__panel-content">
        {events.length > 0 ? (
          events.map((event) => (
            <div key={event.id} className={`rolling-story__event rolling-story__event--${event.event_type}`}>
              <span className="rolling-story__event-type">{event.event_type.replace('_', ' ')}</span>
              <p>{event.summary}</p>
              {event.resolved && <span className="rolling-story__event-resolved">Resolved</span>}
            </div>
          ))
        ) : (
          <p className="rolling-story__empty-panel">
            Story events will appear here as your story progresses.
          </p>
        )}
      </div>
    </div>
  );

  // Build paragraphs with historical choice panels (active choices handled separately via activeChoices prop)
  const buildParagraphsWithChoicePanels = useCallback((): ParagraphData[] => {
    return paragraphs.map((p) => {
      const paragraphData: ParagraphData = {
        id: p.id,
        content: isChoiceParagraph(p.content) ? formatChoiceText(p.content) : p.content,
        isChoice: isChoiceParagraph(p.content),
      };

      // Check if there's a historical choice panel after this paragraph
      const historicalPanel = historicalChoicePanels.get(p.id);
      if (historicalPanel) {
        paragraphData.choicePanel = historicalPanel;
      }

      return paragraphData;
    });
  }, [paragraphs, historicalChoicePanels, isChoiceParagraph, formatChoiceText]);

  if (!isOpen) return null;

  return createPortal(
    <div className="rolling-story__modal-backdrop">
      {/* Status Strip */}
      <div className="rolling-story__status-strip">
        {isInitializing && (
          <div className="rolling-story__status">
            <div className="rolling-story__generating-dots">
              <span></span><span></span><span></span>
            </div>
            <span>Preparing story...</span>
          </div>
        )}
        {isGenerating && (
          <div className="rolling-story__status">
            <div className="rolling-story__generating-dots">
              <span></span><span></span><span></span>
            </div>
            <span>Generating paragraphs...</span>
          </div>
        )}
        {!isInitializing && !isGenerating && paragraphs.length > 0 && (
          <div className="rolling-story__status rolling-story__status--complete">
            <span>📖 {paragraphs.length} paragraphs • Cycle {Math.ceil(paragraphs.length / 8)}</span>
          </div>
        )}
      </div>

      {/* Control overlay */}
      <div className="rolling-story__controls-overlay">
        <div className="rolling-story__controls">
          {/* Begin/Continue buttons */}
          {!isGenerating && paragraphs.length === 0 && !isInitializing && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleGenerateParagraphs()}
              icon={<FaPlay />}
            >
              Begin Story
            </Button>
          )}

          {/* Stop button during generation */}
          {isGenerating && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleAbortGeneration}
              icon={<FaStop />}
            >
              Stop
            </Button>
          )}

          {/* Panel toggles */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBiblePanel(!showBiblePanel)}
            icon={<FaBook />}
            className={showBiblePanel ? 'rolling-story__control--active' : ''}
          >
            Bible ({bible.length})
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEventsPanel(!showEventsPanel)}
            icon={<FaClockRotateLeft />}
            className={showEventsPanel ? 'rolling-story__control--active' : ''}
          >
            Events ({events.length})
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            icon={<FaCog />}
            className={showSettings ? 'rolling-story__control--active' : ''}
          >
            Settings
          </Button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="rolling-story__error">
          <span>{error}</span>
          <button onClick={() => setError(null)}><FaTimes /></button>
        </div>
      )}

      {/* Side panels */}
      {showBiblePanel && renderBiblePanel()}
      {showEventsPanel && renderEventsPanel()}
      {showSettings && renderSettingsPanel()}

      {/* Story reader */}
      <AiStoryReader
        text={getDisplayText()}
        title={rollingStory?.title || scenario.title || 'Rolling Story'}
        author="Interactive Story"
        readingTime={paragraphs.length > 0 ? Math.ceil(storyText.split(' ').length / 200) : 0}
        coverImage={scenario.imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=600&fit=crop'}
        characters={
          scenario.characters?.filter((char) => char.name).map((char) => ({
            id: char.id,
            name: char.name!,
            image: char.photoUrl || '',
            alias: char.alias,
            role: char.role,
            gender: char.gender,
            appearance: char.appearance,
            backstory: char.backstory,
            extraInfo: char.extraInfo,
          })) || []
        }
        isStreaming={isGenerating}
        enableTTS={paragraphs.length > 0 && !isGenerating}
        enableBookmark={paragraphs.length > 0 && !isGenerating}
        enableHighlight={paragraphs.length > 0 && !isGenerating}
        enableFullScreen={true}
        displayMode="scroll"
        onClose={onClose}
        // Paragraph-level control with inline choice panels
        paragraphs={buildParagraphsWithChoicePanels()}
        enableParagraphActions={paragraphs.length > 0 && !isGenerating}
        onParagraphCopy={(index) => handleCopyParagraph(index)}
        onParagraphRegenerate={(index) => handleRegenerateParagraph(index)}
        streamingContent={streamingText || undefined}
        // Inline choice panel - active choices shown at end of content
        activeChoices={!isGenerating && choices.length > 0 ? choices.map(c => ({ label: c.label, description: c.description })) : undefined}
        onChoiceSelect={handleChoiceSelect}
        onChoiceConfirm={handleChoiceConfirm}
        selectedChoice={selectedChoice}
        choiceUserDirection={userDirection}
        onUserDirectionChange={handleUserDirectionChange}
      />
    </div>,
    document.body
  );
};
