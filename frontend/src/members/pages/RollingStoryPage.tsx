/**
 * RollingStoryPage - Interactive paragraph-by-paragraph story generation with choices
 * Full-page version with tabbed interface for story forks
 */
import { Button, AiStoryReader, ChoiceOption, ParagraphData, InlineChoicePanel } from '@drdata/ai-styles';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FaTimes, FaBook, FaUsers, FaCog } from 'react-icons/fa';
import { FaArrowLeft, FaPlay, FaLocationDot, FaCube, FaClockRotateLeft, FaStop } from 'react-icons/fa6';
import { Scenario } from '@shared/types/ScenarioTypes';
import { fetchScenarioById } from '@shared/services/scenario';
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
import './RollingStoryPage.css';

// Interface for a story branch/tab
interface StoryBranch {
  id: string;
  name: string;
  rollingStory: RollingStory | null;
  paragraphs: StoryParagraph[];
  bible: StoryBibleEntry[];
  events: StoryEvent[];
  choices: Choice[];
  isGenerating: boolean;
  isInitializing: boolean;
  generationStatus: string; // Current status message from backend (e.g., "Parsing story arc...", "Writing paragraph...")
  streamingText: string;
  selectedChoice: ChoiceOption | null;
  userDirection: string;
  forkFromIndex?: number;
  parentBranchId?: string;
  historicalChoicePanels: Map<number, InlineChoicePanel>;
}

const RollingStoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { storyId } = useParams<{ storyId: string }>();
  const [searchParams] = useSearchParams();

  // Get scenarioId from URL query parameter (for new stories)
  const scenarioIdFromUrl = searchParams.get('scenarioId');

  // Scenario state
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [scenarioLoading, setScenarioLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Story branches (tabs)
  const [branches, setBranches] = useState<StoryBranch[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<string>('main');

  // UI state
  const [showBiblePanel, setShowBiblePanel] = useState(false);
  const [showEventsPanel, setShowEventsPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [paragraphWordCount, setParagraphWordCount] = useState(250);
  const [choiceCount, setChoiceCount] = useState(3);
  const [autoCountdown, setAutoCountdown] = useState<number | null>(null); // Countdown for auto-continue

  // Abort controller for canceling generation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Timer ref for auto-continue
  const autoTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track if we've already initialized a new story to prevent duplicates
  const hasInitializedRef = useRef(false);

  // Reset initialization flag when storyId changes
  useEffect(() => {
    hasInitializedRef.current = false;
  }, [storyId]);

  // Get active branch
  const activeBranch = branches.find(b => b.id === activeBranchId) || branches[0];

  // Create initial branch
  const createInitialBranch = useCallback((): StoryBranch => ({
    id: 'main',
    name: 'Main Story',
    rollingStory: null,
    paragraphs: [],
    bible: [],
    events: [],
    choices: [],
    isGenerating: false,
    isInitializing: false,
    generationStatus: '',
    streamingText: '',
    selectedChoice: null,
    userDirection: '',
    historicalChoicePanels: new Map(),
  }), []);

  // Load scenario first, then initialize story
  useEffect(() => {
    const loadScenarioAndStory = async () => {
      setScenarioLoading(true);
      console.log('RollingStoryPage: Loading scenario', { storyId, scenarioIdFromUrl });

      try {
        if (storyId === 'new' && scenarioIdFromUrl) {
          // New story - load scenario from URL query parameter
          console.log('RollingStoryPage: Fetching scenario by ID:', scenarioIdFromUrl);
          const scenarioData = await fetchScenarioById(scenarioIdFromUrl);
          setScenario(scenarioData);
          setBranches([createInitialBranch()]);
        } else if (storyId && storyId !== 'new') {
          // Existing story - load story first to get scenario ID
          const storyDetail = await fetchRollingStoryDetail(parseInt(storyId, 10));

          // Create initial branch with loaded story data
          const initialBranch: StoryBranch = {
            id: 'main',
            name: 'Main Story',
            rollingStory: storyDetail,
            paragraphs: storyDetail.paragraphs,
            bible: storyDetail.bible,
            events: storyDetail.events,
            choices: [],
            isGenerating: false,
            isInitializing: false,
            generationStatus: '',
            streamingText: '',
            selectedChoice: null,
            userDirection: '',
            historicalChoicePanels: new Map(),
          };
          setBranches([initialBranch]);

          // Load the scenario
          if (storyDetail.scenario_id) {
            const scenarioData = await fetchScenarioById(storyDetail.scenario_id.toString());
            setScenario(scenarioData);
          }
        }
      } catch (err) {
        console.error('Failed to load scenario:', err);
        setError('Failed to load scenario. Please try again.');
      } finally {
        setScenarioLoading(false);
      }
    };

    loadScenarioAndStory();
  }, [storyId, scenarioIdFromUrl, createInitialBranch]);

  // Initialize new story after scenario is loaded (only once)
  useEffect(() => {
    if (!scenarioLoading && scenario && storyId === 'new' && activeBranch && !activeBranch.rollingStory && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      initializeNewStory();
    }
  }, [scenarioLoading, scenario, storyId, activeBranch]);

  // Update a specific branch
  const updateBranch = useCallback((branchId: string, updates: Partial<StoryBranch>) => {
    setBranches(prev => prev.map(branch =>
      branch.id === branchId ? { ...branch, ...updates } : branch
    ));
  }, []);

  const initializeNewStory = async () => {
    if (!scenario?.id || !activeBranch) return;

    updateBranch(activeBranchId, { isInitializing: true });
    setError(null);

    try {
      const title = scenario.title || 'Untitled Rolling Story';
      const newStory = await createRollingStory(scenario.id, title);
      updateBranch(activeBranchId, {
        rollingStory: newStory,
        paragraphs: [],
        bible: [],
        events: [],
        choices: [],
        isInitializing: false,
      });
    } catch (err) {
      console.error('Failed to initialize rolling story:', err);
      setError('Failed to initialize story. Please try again.');
      updateBranch(activeBranchId, { isInitializing: false });
    }
  };

  const handleAbortGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      updateBranch(activeBranchId, { isGenerating: false });
    }
  }, [activeBranchId, updateBranch]);

  const handleGenerateParagraphs = useCallback(async (chosenAction?: Choice) => {
    if (!activeBranch?.rollingStory) return;

    // Cancel any existing generation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    updateBranch(activeBranchId, {
      isGenerating: true,
      generationStatus: 'Starting generation...',
      streamingText: '',
      choices: [],
      selectedChoice: null,
    });
    setError(null);

    try {
      const request = {
        bible: activeBranch.bible,
        events: activeBranch.events,
        chosen_action: chosenAction?.label || null,
        chosen_action_description: chosenAction?.description,
        advances_arc: chosenAction?.advances_arc || false,  // Pass the arc advancement flag
        storyline_influence: activeBranch.userDirection.trim() || undefined,
        paragraph_word_count: paragraphWordCount,
        choice_count: choiceCount,
      };

      // Clear user direction after sending
      updateBranch(activeBranchId, { userDirection: '' });

      let accumulatedText = '';
      let currentParagraphs = [...activeBranch.paragraphs];
      let currentBible = [...activeBranch.bible];
      let currentEvents = [...activeBranch.events];

      for await (const event of streamGenerateParagraphs(activeBranch.rollingStory.id, request, signal)) {
        if (event.type === 'choice_made') {
          if (event.paragraph) {
            currentParagraphs = [...currentParagraphs, event.paragraph];
            updateBranch(activeBranchId, { paragraphs: currentParagraphs });
          }
        } else if (event.type === 'token') {
          accumulatedText += event.content || '';
          updateBranch(activeBranchId, { streamingText: accumulatedText });
        } else if (event.type === 'paragraph_end') {
          accumulatedText += event.content || '\n\n';
          updateBranch(activeBranchId, { streamingText: accumulatedText });
        } else if (event.type === 'content') {
          accumulatedText += event.content || '';
          updateBranch(activeBranchId, { streamingText: accumulatedText });
        } else if (event.type === 'choices') {
          updateBranch(activeBranchId, { choices: event.choices || [] });
        } else if (event.type === 'complete') {
          if (event.paragraphs) {
            currentParagraphs = [...currentParagraphs, ...event.paragraphs];
          }
          if (event.bible_updates) {
            currentBible = [...currentBible, ...event.bible_updates];
          }
          if (event.event_updates) {
            currentEvents = [...currentEvents, ...event.event_updates];
          }
          updateBranch(activeBranchId, {
            paragraphs: currentParagraphs,
            bible: currentBible,
            events: currentEvents,
            choices: event.choices || [],
            streamingText: '',
          });
        } else if (event.type === 'status') {
          // Update the generation status message
          console.log('[RollingStory] Status update:', event.message);
          updateBranch(activeBranchId, { generationStatus: event.message || '' });
        } else if (event.type === 'error') {
          setError(event.error || 'Generation failed');
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Generation aborted by user');
      } else {
        console.error('Failed to generate paragraphs:', err);
        setError('Failed to generate story. Please try again.');
      }
    } finally {
      updateBranch(activeBranchId, { isGenerating: false, generationStatus: '' });
      abortControllerRef.current = null;
    }
  }, [activeBranch, activeBranchId, paragraphWordCount, choiceCount, updateBranch]);

  // Handle choice selection (for inline choice panel)
  const handleChoiceSelect = useCallback((choice: ChoiceOption) => {
    updateBranch(activeBranchId, { selectedChoice: choice });
  }, [activeBranchId, updateBranch]);

  // Handle confirming a choice and continuing the story
  const handleChoiceConfirm = useCallback((choice: ChoiceOption, direction?: string) => {
    if (!choice || !activeBranch) return;

    // Get the last paragraph ID to attach historical choice panel to
    const lastParagraph = activeBranch.paragraphs[activeBranch.paragraphs.length - 1];
    if (lastParagraph) {
      // Store the historical choice panel
      const newHistoricalPanels = new Map(activeBranch.historicalChoicePanels);
      newHistoricalPanels.set(lastParagraph.id, {
        choices: activeBranch.choices.map(c => ({ label: c.label, description: c.description })),
        selectedChoice: choice,
        isActive: false,
        userDirection: direction,
      });
      updateBranch(activeBranchId, { historicalChoicePanels: newHistoricalPanels });
    }

    // Set user direction if provided
    if (direction) {
      updateBranch(activeBranchId, { userDirection: direction });
    }

    // Find the full choice object from activeBranch.choices to get advances_arc
    const fullChoice = activeBranch.choices.find(c => c.label === choice.label);
    const backendChoice: Choice = {
      label: choice.label,
      description: choice.description,
      advances_arc: fullChoice?.advances_arc || false,
    };
    handleGenerateParagraphs(backendChoice);
  }, [activeBranch, activeBranchId, handleGenerateParagraphs, updateBranch]);

  const handleUserDirectionChange = useCallback((value: string) => {
    updateBranch(activeBranchId, { userDirection: value });
  }, [activeBranchId, updateBranch]);

  // Cancel auto-continue
  const cancelAutoContinue = useCallback(() => {
    if (autoTimerRef.current) {
      clearInterval(autoTimerRef.current);
      autoTimerRef.current = null;
    }
    setAutoCountdown(null);
  }, []);

  // Auto-continue effect for auto mode
  useEffect(() => {
    // Only trigger auto-continue when:
    // 1. In auto mode (choiceCount === 0)
    // 2. Branch has paragraphs
    // 3. Not currently generating
    // 4. Not initializing
    // 5. No countdown already running
    if (
      choiceCount === 0 &&
      activeBranch &&
      activeBranch.paragraphs.length > 0 &&
      !activeBranch.isGenerating &&
      !activeBranch.isInitializing &&
      autoCountdown === null
    ) {
      // Start 3 second countdown
      setAutoCountdown(3);

      autoTimerRef.current = setInterval(() => {
        setAutoCountdown(prev => {
          if (prev === null || prev <= 1) {
            // Time's up - trigger generation
            if (autoTimerRef.current) {
              clearInterval(autoTimerRef.current);
              autoTimerRef.current = null;
            }
            // Trigger generation (will be done via effect below)
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (autoTimerRef.current) {
        clearInterval(autoTimerRef.current);
        autoTimerRef.current = null;
      }
    };
  }, [choiceCount, activeBranch?.paragraphs.length, activeBranch?.isGenerating, activeBranch?.isInitializing]);

  // Trigger generation when countdown reaches 0
  useEffect(() => {
    if (autoCountdown === 0 && choiceCount === 0 && activeBranch && !activeBranch.isGenerating) {
      setAutoCountdown(null);
      handleGenerateParagraphs();
    }
  }, [autoCountdown, choiceCount, activeBranch?.isGenerating, handleGenerateParagraphs]);

  // Cancel auto-continue when switching out of auto mode
  useEffect(() => {
    if (choiceCount !== 0) {
      cancelAutoContinue();
    }
  }, [choiceCount, cancelAutoContinue]);

  const handleCopyParagraph = useCallback(async (paragraphIndex: number) => {
    const paragraph = activeBranch?.paragraphs[paragraphIndex];
    if (paragraph) {
      try {
        await navigator.clipboard.writeText(paragraph.content);
      } catch (err) {
        console.error('Failed to copy paragraph:', err);
      }
    }
  }, [activeBranch?.paragraphs]);

  const handleRegenerateParagraph = useCallback(async (paragraphIndex: number) => {
    if (!activeBranch?.rollingStory || activeBranch.isGenerating) return;

    const paragraphToRegenerate = activeBranch.paragraphs[paragraphIndex];
    const sequenceThreshold = paragraphToRegenerate.sequence;

    try {
      await deleteParagraphsFrom(activeBranch.rollingStory.id, sequenceThreshold);

      const keptParagraphs = activeBranch.paragraphs.slice(0, paragraphIndex);

      // Clear historical choice panels for deleted paragraphs
      const keptParagraphIds = new Set(keptParagraphs.map(p => p.id));
      const newHistoricalPanels = new Map<number, InlineChoicePanel>();
      activeBranch.historicalChoicePanels.forEach((panel, paragraphId) => {
        if (keptParagraphIds.has(paragraphId)) {
          newHistoricalPanels.set(paragraphId, panel);
        }
      });

      updateBranch(activeBranchId, {
        paragraphs: keptParagraphs,
        bible: activeBranch.bible.filter(entry => entry.introduced_at < sequenceThreshold),
        events: activeBranch.events.filter(event => event.paragraph_sequence < sequenceThreshold),
        choices: [],
        selectedChoice: null,
        historicalChoicePanels: newHistoricalPanels,
      });

      handleGenerateParagraphs();
    } catch (err) {
      console.error('Failed to regenerate paragraph:', err);
      setError('Failed to regenerate. Please try again.');
    }
  }, [activeBranch, activeBranchId, handleGenerateParagraphs, updateBranch]);

  // Fork the story from a specific paragraph
  const handleForkParagraph = useCallback((paragraphIndex: number) => {
    if (!activeBranch) return;

    // Create paragraphs up to and including the fork point
    const forkedParagraphs = activeBranch.paragraphs.slice(0, paragraphIndex + 1);
    const sequenceThreshold = forkedParagraphs[forkedParagraphs.length - 1]?.sequence || 0;

    // Copy historical panels for kept paragraphs
    const forkedParagraphIds = new Set(forkedParagraphs.map(p => p.id));
    const forkedHistoricalPanels = new Map<number, InlineChoicePanel>();
    activeBranch.historicalChoicePanels.forEach((panel, paragraphId) => {
      if (forkedParagraphIds.has(paragraphId)) {
        forkedHistoricalPanels.set(paragraphId, panel);
      }
    });

    // Create a new branch
    const newBranchId = `fork-${Date.now()}`;
    const branchNumber = branches.filter(b => b.id !== 'main').length + 1;
    const newBranch: StoryBranch = {
      id: newBranchId,
      name: `Fork ${branchNumber}`,
      rollingStory: activeBranch.rollingStory,
      paragraphs: forkedParagraphs,
      bible: activeBranch.bible.filter(entry => entry.introduced_at <= sequenceThreshold),
      events: activeBranch.events.filter(event => event.paragraph_sequence <= sequenceThreshold),
      choices: [],
      isGenerating: false,
      isInitializing: false,
      generationStatus: '',
      streamingText: '',
      selectedChoice: null,
      userDirection: '',
      forkFromIndex: paragraphIndex,
      parentBranchId: activeBranchId,
      historicalChoicePanels: forkedHistoricalPanels,
    };

    setBranches(prev => [...prev, newBranch]);
    setActiveBranchId(newBranchId);
  }, [activeBranch, activeBranchId, branches]);

  const handleCloseBranch = useCallback((branchId: string) => {
    if (branchId === 'main') return;

    setBranches(prev => prev.filter(b => b.id !== branchId));
    if (activeBranchId === branchId) {
      setActiveBranchId('main');
    }
  }, [activeBranchId]);

  const handleBack = () => {
    if (scenario?.id) {
      navigate(`/scenarios`);
    } else {
      navigate('/rolling-stories');
    }
  };

  const handleClose = () => {
    navigate('/rolling-stories');
  };

  // Check if a paragraph is a choice paragraph
  const isChoiceParagraph = (content: string) => content.startsWith('[CHOICE:');

  // Format choice paragraph for display
  const formatChoiceText = (content: string) => {
    const match = content.match(/\[CHOICE:\s*(.+?)\]$/);
    return match ? `» ${match[1]}` : content;
  };

  // Combine paragraphs into display text for active branch
  const storyText = activeBranch ?
    activeBranch.paragraphs.map((p) =>
      isChoiceParagraph(p.content) ? formatChoiceText(p.content) : p.content
    ).join('\n\n') + (activeBranch.streamingText ? '\n\n' + activeBranch.streamingText : '')
    : '';

  // Get display text for the reader
  const getDisplayText = () => {
    if (scenarioLoading || activeBranch?.isInitializing) {
      return 'Preparing your interactive story...';
    }
    if (!activeBranch || (activeBranch.paragraphs.length === 0 && !activeBranch.streamingText && !activeBranch.isGenerating)) {
      return 'Ready to begin your interactive story adventure. Click "Begin Story" to start!';
    }
    return storyText || 'Generating...';
  };

  // Bible panel content
  const renderBiblePanel = () => {
    if (!activeBranch) return null;
    const characters = activeBranch.bible.filter((b) => b.category === 'character');
    const settings = activeBranch.bible.filter((b) => b.category === 'setting');
    const objects = activeBranch.bible.filter((b) => b.category === 'object');

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
          {activeBranch.bible.length === 0 && (
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
            <button
              className={`rolling-story__setting-btn ${choiceCount === 0 ? 'rolling-story__setting-btn--active' : ''}`}
              onClick={() => setChoiceCount(0)}
              title="Auto mode - story continues without choices"
            >
              Auto
            </button>
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
  const renderEventsPanel = () => {
    if (!activeBranch) return null;
    return (
      <div className="rolling-story__panel rolling-story__events-panel">
        <div className="rolling-story__panel-header">
          <h3><FaClockRotateLeft /> Story Events</h3>
          <button onClick={() => setShowEventsPanel(false)} className="rolling-story__panel-close">
            <FaTimes />
          </button>
        </div>
        <div className="rolling-story__panel-content">
          {activeBranch.events.length > 0 ? (
            activeBranch.events.map((event) => (
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
  };

  // Build paragraphs with historical choice panels for AiStoryReader
  const buildParagraphsWithChoicePanels = useCallback((): ParagraphData[] => {
    if (!activeBranch) return [];

    return activeBranch.paragraphs.map((p) => {
      const paragraphData: ParagraphData = {
        id: p.id,
        content: isChoiceParagraph(p.content) ? formatChoiceText(p.content) : p.content,
        isChoice: isChoiceParagraph(p.content),
      };

      // Check if there's a historical choice panel after this paragraph
      const historicalPanel = activeBranch.historicalChoicePanels.get(p.id);
      if (historicalPanel) {
        paragraphData.choicePanel = historicalPanel;
      }

      return paragraphData;
    });
  }, [activeBranch, isChoiceParagraph, formatChoiceText]);

  // Render tabs for story branches
  const renderTabs = () => (
    <div className="rolling-story__tabs">
      {branches.map((branch) => (
        <div
          key={branch.id}
          className={`rolling-story__tab ${branch.id === activeBranchId ? 'rolling-story__tab--active' : ''}`}
          onClick={() => setActiveBranchId(branch.id)}
        >
          <span className="rolling-story__tab-name">{branch.name}</span>
          {branch.id !== 'main' && (
            <button
              className="rolling-story__tab-close"
              onClick={(e) => {
                e.stopPropagation();
                handleCloseBranch(branch.id);
              }}
              title="Close branch"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );

  if (scenarioLoading) {
    return (
      <div className="rolling-story__page rolling-story__page--loading">
        <div className="rolling-story__loading">
          <div className="rolling-story__generating-dots">
            <span></span><span></span><span></span>
          </div>
          <span>Loading story...</span>
        </div>
      </div>
    );
  }

  // Handle case where no scenario could be loaded
  if (!scenario && !scenarioLoading) {
    return (
      <div className="rolling-story__page rolling-story__page--loading">
        <div className="rolling-story__loading">
          <div className="rolling-story__back-button-container" style={{ position: 'static', marginBottom: '20px' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              icon={<FaArrowLeft />}
            >
              Back to Scenarios
            </Button>
          </div>
          <p style={{ color: 'var(--color-text-secondary, #e5e7eb)' }}>
            {error || 'No scenario found. Please select a scenario first.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rolling-story__page">
      {/* Back Button */}
      <div className="rolling-story__back-button-container">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          icon={<FaArrowLeft />}
          className="rolling-story__back-button"
        >
          Back to Scenarios
        </Button>
      </div>

      {/* Tabs - only show when there are multiple branches */}
      {branches.length > 1 && renderTabs()}

      {/* Control overlay */}
      <div className="rolling-story__controls-overlay">
        <div className="rolling-story__controls">
          {/* Begin/Continue buttons */}
          {activeBranch && !activeBranch.isGenerating && activeBranch.paragraphs.length === 0 && !activeBranch.isInitializing && (
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
          {activeBranch?.isGenerating && (
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
            Bible ({activeBranch?.bible.length || 0})
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEventsPanel(!showEventsPanel)}
            icon={<FaClockRotateLeft />}
            className={showEventsPanel ? 'rolling-story__control--active' : ''}
          >
            Events ({activeBranch?.events.length || 0})
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
      {activeBranch && (
        <AiStoryReader
          text={getDisplayText()}
          title={activeBranch.rollingStory?.title || scenario?.title || 'Rolling Story'}
          author="Interactive Story"
          readingTime={activeBranch.paragraphs.length > 0 ? Math.ceil(storyText.split(' ').length / 200) : 0}
          coverImage={scenario?.imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=600&fit=crop'}
          characters={
            scenario?.characters?.filter((char) => char.name).map((char) => ({
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
          isStreaming={activeBranch.isGenerating}
          enableTTS={activeBranch.paragraphs.length > 0 && !activeBranch.isGenerating}
          enableBookmark={activeBranch.paragraphs.length > 0 && !activeBranch.isGenerating}
          enableHighlight={activeBranch.paragraphs.length > 0 && !activeBranch.isGenerating}
          enableFullScreen={true}
          displayMode="scroll"
          onClose={handleClose}
          // Paragraph-level control with historical choice panels
          paragraphs={buildParagraphsWithChoicePanels()}
          enableParagraphActions={activeBranch.paragraphs.length > 0 && !activeBranch.isGenerating}
          onParagraphCopy={(index) => handleCopyParagraph(index)}
          onParagraphRegenerate={(index) => handleRegenerateParagraph(index)}
          onParagraphFork={(index) => handleForkParagraph(index)}
          streamingContent={activeBranch.streamingText || undefined}
          // Inline choice panel - active choices shown at end of content
          activeChoices={!activeBranch.isGenerating && activeBranch.choices.length > 0 ? activeBranch.choices.map(c => ({ label: c.label, description: c.description })) : undefined}
          onChoiceSelect={handleChoiceSelect}
          onChoiceConfirm={handleChoiceConfirm}
          selectedChoice={activeBranch.selectedChoice}
          choiceUserDirection={activeBranch.userDirection}
          onUserDirectionChange={handleUserDirectionChange}
        />
      )}

      {/* Status Strip at bottom - show when generating, initializing, or in auto mode */}
      {(activeBranch?.isInitializing || activeBranch?.isGenerating || (choiceCount === 0 && activeBranch?.paragraphs.length > 0 && !activeBranch?.isGenerating)) && (
        <div className="rolling-story__status-strip rolling-story__status-strip--bottom">
          {activeBranch?.isInitializing && (
            <div className="rolling-story__status">
              <div className="rolling-story__generating-dots">
                <span></span><span></span><span></span>
              </div>
              <span>Preparing story...</span>
            </div>
          )}
          {activeBranch?.isGenerating && (
            <div className="rolling-story__status">
              <div className="rolling-story__generating-dots">
                <span></span><span></span><span></span>
              </div>
              <span>{activeBranch.generationStatus || 'Generating...'}</span>
            </div>
          )}
          {/* Auto mode: Show countdown or pause button when not generating */}
          {choiceCount === 0 && activeBranch?.paragraphs.length > 0 && !activeBranch?.isGenerating && !activeBranch?.isInitializing && (
            <div className="rolling-story__auto-mode">
              <span className="rolling-story__auto-label">Auto Mode</span>
              {autoCountdown !== null && autoCountdown > 0 ? (
                <Button
                  variant="secondary"
                  size="m"
                  onClick={cancelAutoContinue}
                  title="Click to pause auto-continue"
                >
                  <FaStop /> Pause ({autoCountdown}s)
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="m"
                  onClick={() => {
                    setAutoCountdown(3); // Restart countdown
                  }}
                  title="Click to resume auto-continue"
                >
                  <FaPlay /> Continue
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RollingStoryPage;
