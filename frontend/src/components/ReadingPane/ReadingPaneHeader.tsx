import React, { useEffect, useState, useImperativeHandle } from 'react';
import { fetchDBStories, saveDBStory } from '../../services/scenario';
import ActionButton from '../common/ActionButton';
import './ReadingPane.css';

interface ReadingPaneHeaderProps {
  currentScenario: any;
  displayContent: string;
  onStorySelectedFromDb?: (storyText: string | null, storyId?: number | null, storyCreatedAt?: string) => void;
  onFontChange?: (fontFamily: string, fontSize: string) => void;
  onGenerateStory: () => void;
  onCancelGeneration: () => void;
  isGenerating: boolean;
  canSubmit?: boolean;
  onSubmit?: () => void;
  isGeneratedStory?: boolean;
  displaySource: 'generated' | 'database' | 'none';
  isStoryDropdownDisabled?: boolean;
}

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

const ReadingPaneHeader = React.forwardRef<any, ReadingPaneHeaderProps>((props, ref) => {
  const {
    currentScenario,
    displayContent,
    onStorySelectedFromDb,
    onFontChange,
    onGenerateStory,
    onCancelGeneration,
    isGenerating,
    canSubmit,
    onSubmit,
    isGeneratedStory,
    displaySource,
    isStoryDropdownDisabled = false,
  } = props;

  const [fontFamily, setFontFamily] = useState<string>('Georgia');
  const [fontSize, setFontSize] = useState<string>('16px');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadingVersions, setLoadingVersions] = useState<boolean>(false);
  const [dbStories, setDbStories] = useState<any[]>([]);
  const [selectedDbStoryId, setSelectedDbStoryId] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  useImperativeHandle(ref, () => ({
    resetDbStoryDropdown: () => setSelectedDbStoryId(null)
  }));

  useEffect(() => {
    const fetchStories = async () => {
      if (!currentScenario || !currentScenario.id) return;
      const scenarioId = currentScenario.id.toString();
      try {
        setLoadingVersions(true);
        const stories = await fetchDBStories(scenarioId);
        setDbStories(stories);
        if (isGenerating) {
          setSelectedDbStoryId(null);
        } else if (stories.length > 0) {
          setSelectedDbStoryId(stories[0].id);
        } else {
          setSelectedDbStoryId(null);
        }
      } catch (e) {
        setDbStories([]);
        setSelectedDbStoryId(null);
      } finally {
        setLoadingVersions(false);
      }
    };
    fetchStories();
  }, [currentScenario, isGenerating]);

  useEffect(() => {
    if (!selectedDbStoryId) return;
    const story = dbStories.find(s => s.id === selectedDbStoryId);
    if (story && onStorySelectedFromDb) {
      onStorySelectedFromDb(story.text, story.id, story.created_at);
    }
  }, [selectedDbStoryId, dbStories, onStorySelectedFromDb]);

  useEffect(() => {
    if (onFontChange) onFontChange(fontFamily, fontSize);
  }, [fontFamily, fontSize, onFontChange]);

  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [displayContent]);

  useEffect(() => {
    if (isGenerating) {
      setSelectedDbStoryId(null);
    }
  }, [isGenerating]);

  useEffect(() => {
    if (displaySource === 'generated') {
      setSelectedDbStoryId(null);
    }
  }, [displaySource]);

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleString();
    } catch {
      return dateString;
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
      const scenarioId = currentScenario.id.toString();
      await saveDBStory(scenarioId, displayContent);
      const stories = await fetchDBStories(scenarioId);
      setDbStories(stories);
      if (stories.length > 0) {
        setSelectedDbStoryId(stories[0].id);
      }
      setHasUnsavedChanges(false);
      alert('Story saved successfully!');
    } catch (error) {
      setSaveError('Failed to save story. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="reading-pane-header">
      <div className="reading-controls">
        {onSubmit && (
          !isGenerating ? (
            <ActionButton
              label='✨ Generate story'
              variant="success"
              disabled={!canSubmit}
              onClick={onGenerateStory}
            />
          ) : (
            <ActionButton
              label='✨ Cancel generation'
              variant="danger"
              onClick={onCancelGeneration}
            />
          )
        )}
        &nbsp;
        <div className="control-group">
          <label htmlFor="font-selector">Font:</label>
          <select
            id="font-selector"
            value={fontFamily}
            onChange={e => setFontFamily(e.target.value)}
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
            onChange={e => setFontSize(e.target.value)}
          >
            {sizeOptions.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="reading-controls">
        {currentScenario && (
          <>
            {displaySource === 'generated' && (
              <button
                className="submit-btn upload-btn"
                disabled={isSaving || !displayContent || isGenerating || !hasUnsavedChanges}
                onClick={handleSaveStory}
              >
                {isSaving ? (
                  <>
                    <span role="img" aria-label="Saving" style={{ marginRight: 6 }}>💾</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span role="img" aria-label="Save" style={{ marginRight: 6 }}>💾</span>
                    Save Story
                  </>
                )}
              </button>
            )}
            &nbsp;
            {saveError && <span className="save-error">{saveError}</span>}
            &nbsp;
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
                      setSelectedDbStoryId(Number(value));
                    } else {
                      setSelectedDbStoryId(null);
                      if (onStorySelectedFromDb) onStorySelectedFromDb(null);
                    }
                  }}
                  disabled={isStoryDropdownDisabled}
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
      </div>
    </div>
  );
});

export default ReadingPaneHeader;
