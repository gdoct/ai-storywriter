import React, { useEffect, useImperativeHandle, useState } from 'react';
import { useModals } from '../../hooks/useModals';
import { deleteDBStory, fetchDBStories, saveDBStory } from '../../services/scenario';
import ActionButton from '../common/ActionButton';
import { AlertModal, ConfirmModal } from '../Modal';
import './ReadingPane.css';
import SavedStoriesDropdown from './SavedStoriesDropdown';

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
  fontFamily: string;
  fontSize: string;
  setFontFamily: (font: string) => void;
  setFontSize: (size: string) => void;
  openTabs?: { dbStoryId: number | null; scenarioId: string }[]; // New prop for open tabs
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
    onGenerateStory,
    onCancelGeneration,
    isGenerating,
    canSubmit,
    onSubmit,
    displaySource,
    isStoryDropdownDisabled = false,
    fontFamily,
    fontSize,
    setFontFamily,
    setFontSize,
    openTabs = [], // Default to empty array
  } = props;

  const { alertState, confirmState, hideAlert, hideConfirm, customAlert, customConfirm } = useModals();
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
        // Don't automatically select any story - let user choose explicitly
        setSelectedDbStoryId(null);
      } catch (e) {
        setDbStories([]);
        setSelectedDbStoryId(null);
      } finally {
        setLoadingVersions(false);
      }
    };
    fetchStories();
  }, [currentScenario]);

  // Removed automatic story selection useEffect - stories should only be loaded when explicitly selected by user

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
      // Don't automatically select any story after saving - let user choose explicitly
      setHasUnsavedChanges(false);
      alert('Story saved successfully!');
    } catch (error) {
      setSaveError('Failed to save story. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStorySelection = (storyId: number | null) => {
    setSelectedDbStoryId(storyId);
    if (storyId && onStorySelectedFromDb) {
      const story = dbStories.find(s => s.id === storyId);
      if (story) {
        onStorySelectedFromDb(story.text, story.id, story.created_at);
      }
    } else if (!storyId && onStorySelectedFromDb) {
      // User cleared selection
      onStorySelectedFromDb(null);
    }
  };

  const handleDeleteStory = async (storyId: number) => {
    const confirmed = await customConfirm(
      'Are you sure you want to delete this story?',
      {
        title: 'Confirm Delete',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        variant: 'danger'
      }
    );

    if (!confirmed) return;

    try {
      await deleteDBStory(storyId);
      if (currentScenario && currentScenario.id) {
        const stories = await fetchDBStories(currentScenario.id.toString());
        setDbStories(stories);
        // Don't automatically select any story after deletion - let user choose explicitly
        setSelectedDbStoryId(null);
        if (onStorySelectedFromDb) onStorySelectedFromDb(null);
      }
    } catch (e) {
      customAlert('Failed to delete story.', 'Error');
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
            <SavedStoriesDropdown
              dbStories={dbStories}
              selectedDbStoryId={selectedDbStoryId}
              loadingVersions={loadingVersions}
              isStoryDropdownDisabled={isStoryDropdownDisabled}
              onStorySelect={handleStorySelection}
              onDeleteStory={handleDeleteStory}
              formatDate={formatDate}
              openTabs={openTabs}
              currentScenarioId={currentScenario?.id}
            />
          </>
        )}

        {/* Custom Modal Components */}
        <AlertModal
          isOpen={alertState.isOpen}
          onClose={hideAlert}
          message={alertState.message}
          title={alertState.title}
        />
        
        <ConfirmModal
          isOpen={confirmState.isOpen}
          onClose={hideConfirm}
          onConfirm={confirmState.onConfirm || (() => {})}
          message={confirmState.message}
          title={confirmState.title}
          confirmText={confirmState.confirmText}
          cancelText={confirmState.cancelText}
          variant={confirmState.variant}
        />
      </div>
    </div>
  );
});

export default ReadingPaneHeader;
