import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSceneHover } from '../context/SceneHoverContext';
import { DBStory, fetchDBStories, saveDBStory } from '../services/scenario';
import { generateStory } from '../services/storyGenerator';
import { Scenario } from '../types/ScenarioTypes';
import './ReadingPane.css';

interface ReadingPaneProps {
  content: string;
  onSubmit?: () => void;
  canSubmit?: boolean;
  isGeneratedStory?: boolean;
  currentScenario?: Scenario | null;
  onStoryGenerated?: (story: string | null) => void;
  onStoryVersionSelect?: (timestamp: string) => void;
  currentTimestamp?: string | null;
  scenes?: import('../types/ScenarioTypes').Scene[];
}

const ReadingPane: React.FC<ReadingPaneProps> = ({
  content,
  onSubmit,
  canSubmit = false,
  isGeneratedStory = false,
  currentScenario = null,
  onStoryGenerated,
  onStoryVersionSelect,
  currentTimestamp,
  scenes = []
}) => {
  const [fontSize, setFontSize] = useState<string>('16px');
  const [fontFamily, setFontFamily] = useState<string>('Georgia');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [displayContent, setDisplayContent] = useState<string>(content || '');
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [cancelGeneration, setCancelGeneration] = useState<(() => void) | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [loadingVersions, setLoadingVersions] = useState<boolean>(false);
  const [dbStories, setDbStories] = useState<DBStory[]>([]);
  const [selectedDbStoryId, setSelectedDbStoryId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Add state to track source of currently displayed content
  const [displaySource, setDisplaySource] = useState<'generated' | 'database' | 'none'>('none');

  // Track if content has been modified since loading from DB or generating
  const [isContentModified, setIsContentModified] = useState<boolean>(false);

  // Reference to the reading content container for scrolling
  const contentRef = useRef<HTMLDivElement>(null);
  const { hoveredSceneId } = useSceneHover();

  // Update displayContent when content prop changes
  useEffect(() => {
    if (content) {
      setDisplayContent(content);
      setDisplaySource('generated');
    }
  }, [content]);

  // Update when generatedContent changes during generation
  useEffect(() => {
    if (isGenerating && generatedContent) {
      setDisplayContent(generatedContent);
      setDisplaySource('generated');
    }
  }, [generatedContent, isGenerating]);

  // Function to determine if scrolled to bottom
  const isScrolledToBottom = () => {
    if (!contentRef.current) return true;

    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    // Consider "close to bottom" within 30px to make it less sensitive
    return scrollHeight - scrollTop - clientHeight < 30;
  };

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      if (!isGenerating) return;
      setAutoScroll(isScrolledToBottom());
    };

    const contentEl = contentRef.current;
    if (contentEl) {
      contentEl.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (contentEl) {
        contentEl.removeEventListener('scroll', handleScroll);
      }
    };
  }, [isGenerating]);

  // Auto-scroll to the bottom when generated content changes
  useEffect(() => {
    if (isGenerating && contentRef.current && autoScroll) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [displayContent, isGenerating, autoScroll]);

  
  // Fetch DB stories when scenario changes
  useEffect(() => {
    const fetchStories = async () => {
      if (!currentScenario) return;
      if (!currentScenario.id) return;
      
      // Ensure we have a valid ID (don't try to convert UUID strings to numbers)
      const scenarioId = currentScenario.id.toString();
      
      try {
        setLoadingVersions(true);
        console.log("Fetching stories for scenario ID:", scenarioId);
        const stories = await fetchDBStories(scenarioId);
        console.log("Fetched stories:", stories);
        setDbStories(stories);
        if (stories.length > 0) {
          setSelectedDbStoryId(stories[0].id);
        } else {
          setSelectedDbStoryId(null);
        }
      } catch (e) {
        console.error('Error fetching DB stories:', e);
        setDbStories([]);
        setSelectedDbStoryId(null);
      } finally {
        setLoadingVersions(false);
      }
    };
    fetchStories();
  }, [currentScenario]);

  // Update content when DB story selection changes
  useEffect(() => {
    if (!selectedDbStoryId) return;
    const story = dbStories.find(s => s.id === selectedDbStoryId);
    if (story && story.text) {
      setDisplayContent(story.text);
      setDisplaySource('database');
      
      // If story generation was in progress, stop it
      if (isGenerating) {
        setIsGenerating(false);
        if (cancelGeneration) {
          cancelGeneration();
          setCancelGeneration(null);
        }
      }
      
      // Notify parent component if needed
      if (onStoryGenerated) {
        onStoryGenerated(story.text);
      }
    }
  }, [selectedDbStoryId, dbStories, isGenerating, cancelGeneration, onStoryGenerated]);

  const fontOptions = [
    'Georgia',
    'Times New Roman',
    'Garamond',
    'Arial',
    'Verdana',
    'Helvetica',
    'Courier New'
  ];

  const sizeOptions = [
    '12px', '14px', '16px', '18px', '20px', '22px', '24px',
    '28px', '32px', '36px', '40px', '44px', '48px',
  ];

  const handleGenerateStory = async () => {
    if (!currentScenario) return;

    setIsGenerating(true);
    setSaveError(null);
    setDisplaySource('generated');
    resetDbStorySelection();
    
    try {
      // Reset content first to ensure smooth transition
      setGeneratedContent('');
      
      // Generate the story via the LM Studio API, updating content as it comes in
      const { result, cancelGeneration } = await generateStory(currentScenario, {
        onProgress: (text: string) => {
          setGeneratedContent(text);
        }
      });

      // Store the cancel function to enable cancellation
      setCancelGeneration(() => cancelGeneration);

      // Wait for the story generation to complete
      const fullStory = await result;

      // Once complete, update the display with the full story
      setDisplayContent(fullStory.completeText);

      // Pass the complete text to parent if needed
      if (onStoryGenerated) {
        onStoryGenerated(fullStory.completeText);
      }
    } catch (error) {
      console.error('Error generating story:', error);
      // Keep the last generated content visible in case of error
    } finally {
      setIsGenerating(false);
      setCancelGeneration(null);
    }

    // Call the original onSubmit for any parent component handling
    if (onSubmit) {
      onSubmit();
    }
  };

  const handleCancelGeneration = () => {
    if (cancelGeneration) {
      cancelGeneration();
      setIsGenerating(false);
      setCancelGeneration(null);
    }
  };

  const handleSaveStory = async () => {
    if (!currentScenario || !currentScenario.id) {
      setSaveError('No valid scenario selected');
      return;
    }
    if (!displayContent) {
      setSaveError('Cannot save an empty story');
      return;
    }

    setSaveError(null);
    try {
      setIsSaving(true);
      // Always use the ID as a string to avoid NaN issues
      const scenarioId = currentScenario.id.toString();
      console.log("Saving story for scenario ID:", scenarioId);
      
      await saveDBStory(scenarioId, displayContent);
      
      // Refresh DB stories after saving
      const stories = await fetchDBStories(scenarioId);
      console.log("Refreshed stories after save:", stories);
      setDbStories(stories);
      
      if (stories.length > 0) {
        setSelectedDbStoryId(stories[0].id);
        setDisplaySource('database'); // Update display source after saving
      }
      
      alert('Story saved successfully!');
    } catch (error) {
      console.error('Error saving story:', error);
      setSaveError('Failed to save story. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset DB story selection to show we're working with a new/unsaved story
  const resetDbStorySelection = () => {
    setSelectedDbStoryId(null);
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    try {
      // Check if the date is valid before formatting
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return date.toLocaleString();
    } catch (e) {
      console.warn("Date formatting error:", e);
      return dateString;
    }
  };

  // Function to handle manual edits to the content
  const handleContentChange = (newContent: string) => {
    setDisplayContent(newContent);
    setIsContentModified(true);
    
    // If content was from database, now it's modified
    if (displaySource === 'database') {
      setDisplaySource('generated');
    }
  };

  return (
    <div className="reading-pane">
      <div className="reading-controls">
        {onSubmit && (
          <>
            {!isGenerating ? (
              <button
                className="submit-btn reading-submit-btn"
                disabled={!canSubmit}
                onClick={handleGenerateStory}
              >
                Generate story
              </button>
            ) : (
              <button
                className="submit-btn cancel-btn"
                onClick={handleCancelGeneration}
              >
                Cancel generation
              </button>
            )}
          </>
        )}
        &nbsp;

        {currentScenario && (
          <>
            {/* Show save button only if content is generated and not from database */}
            {isGeneratedStory && displaySource === 'generated' && (
              <button
                className="submit-btn upload-btn"
                disabled={isSaving || !displayContent || isGenerating}
                onClick={handleSaveStory}
              >
                {isSaving ? 'Saving...' : 'Save Story'}
              </button>
            )}
            &nbsp;

            {/* Display error message if save fails */}
            {saveError && <span className="save-error">{saveError}</span>}
            &nbsp;
            
            {/* DB-backed story versions dropdown */}
            <div className="control-group saved-stories-dropdown">
              <label htmlFor="db-version-selector">Saved Stories:</label>
              {loadingVersions ? (
                <span className="loading-text">Loading stories...</span>
              ) : dbStories.length > 0 ? (
                <select
                  id="db-version-selector" 
                  className="story-selector"
                  value={selectedDbStoryId || ''}
                  onChange={e => {
                    const value = e.target.value;
                    if (value) {
                      console.log("Selected DB story ID:", value);
                      setSelectedDbStoryId(Number(value));
                    } else {
                      setSelectedDbStoryId(null);
                      // Reset to generated if we had content
                      if (displayContent) {
                        setDisplaySource('generated');
                      }
                    }
                  }}
                >
                  <option value="">Select a saved story...</option>
                  {dbStories.map(story => (
                    <option key={story.id} value={story.id}>
                      {formatDate(story.created_at)}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="no-versions">No saved stories</span>
              )}
            </div>
          </>
        )}

        <div className="control-group">
          <label htmlFor="font-selector">Font:</label>
          <select
            id="font-selector"
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
          >
            {fontOptions.map(font => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="size-selector">Size:</label>
          <select
            id="size-selector"
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
          >
            {sizeOptions.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      </div>

      <div
        ref={contentRef}
        className="reading-content"
        style={{
          fontSize: fontSize,
          fontFamily: fontFamily
        }}
      >
        {displayContent ? (
          <>
            {isGeneratedStory && displaySource === 'generated' && 
              <div className="generated-story-badge">Generated Story</div>}
            {displaySource === 'database' && 
              <div className="saved-story-badge">Saved Story</div>}
            <div className="markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ node, ...props }) => <p style={{ margin: '1em 0' }} {...props} />
                }}
              >
                {displayContent}
              </ReactMarkdown>
            </div>
          </>
        ) : (
          <p className="placeholder-text">Your story will appear here...</p>
        )}
      </div>
    </div>
  );
};

export default ReadingPane;
