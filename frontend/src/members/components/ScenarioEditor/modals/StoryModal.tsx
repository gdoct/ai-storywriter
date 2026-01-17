import { Button, AiStoryReader } from '@drdata/ai-styles';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaRedo, FaSave, FaTimes } from 'react-icons/fa';
import { FaArrowRight, FaDice } from 'react-icons/fa6';
import { Scenario } from '@shared/types/ScenarioTypes';
import { getShowThinkingSetting } from '@shared/services/settings';
import { GenerationSettingsModal, GenerationSettings } from './GenerationSettingsModal';
import { RollingStoryModal } from './RollingStoryModal';
import './StoryModal.css';

export interface StoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: string | null;
  thinking?: string | null;
  onRegenerate: (maxTokens?: number) => void;
  onSaveStory?: () => void;
  onCancelGeneration?: () => void;
  onContinueStory?: () => void;
  isGenerating: boolean;
  isStorySaved?: boolean;
  isContinuing?: boolean;
  title?: string;
  scenario?: Scenario;
  coverImage?: string;
}

export const StoryModal: React.FC<StoryModalProps> = ({
  isOpen,
  onClose,
  story,
  thinking,
  onRegenerate,
  onSaveStory,
  onCancelGeneration,
  onContinueStory,
  isGenerating,
  isStorySaved = false,
  isContinuing = false,
  title = 'Generated Story',
  scenario,
  coverImage,
}) => {
  const [hasStartedGeneration, setHasStartedGeneration] = useState(false);
  const [displayStory, setDisplayStory] = useState<string>('');
  const [showThinking, setShowThinking] = useState(false);
  const [showGenerationSettings, setShowGenerationSettings] = useState(false);
  const [isRegenerateMode, setIsRegenerateMode] = useState(false);
  const [showRollingStoryModal, setShowRollingStoryModal] = useState(false);

  // Load thinking setting
  useEffect(() => {
    const loadThinkingSetting = async () => {
      try {
        const thinkingSetting = await getShowThinkingSetting();
        console.log('StoryModal loaded thinking setting:', thinkingSetting); // Debug log
        setShowThinking(thinkingSetting);
      } catch (error) {
        console.error('Failed to load thinking setting:', error);
      }
    };
    loadThinkingSetting();
  }, []);

  // Debug thinking prop changes
  useEffect(() => {
    console.log('StoryModal thinking prop changed:', thinking); // Debug log
  }, [thinking]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setHasStartedGeneration(!!story); // If there's already a story, consider it generated
      setDisplayStory(story || '');
    }
  }, [isOpen, story]);

  // Update display story when story changes
  useEffect(() => {
    setDisplayStory(story || '');
  }, [story]);

  // Track when generation completes or is cancelled
  useEffect(() => {
    if (isGenerating) {
      setHasStartedGeneration(true);
    }
  }, [isGenerating]);

  // Reset auto-scroll when generation starts
  useEffect(() => {
    if (isGenerating) {
      // Auto scroll functionality now handled by AiStoryReader
    }
  }, [isGenerating]);

  const handleDownloadStory = () => {
    if (story) {
      const blob = new Blob([story], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'story'}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Open settings modal for generate
  const handleOpenGenerateSettings = () => {
    setIsRegenerateMode(false);
    setShowGenerationSettings(true);
  };

  // Open settings modal for regenerate
  const handleOpenRegenerateSettings = () => {
    setIsRegenerateMode(true);
    setShowGenerationSettings(true);
  };

  // Handle generation from settings modal
  const handleGenerateFromSettings = (settings: GenerationSettings) => {
    setShowGenerationSettings(false);
    onRegenerate(settings.maxTokens);
  };

  // Prepare story content for AiStoryReader
  const storyDisplayText = isGenerating && !displayStory 
    ? 'Generating your story...' 
    : displayStory || (!hasStartedGeneration 
      ? 'Ready to generate your story. Click "Generate Story" to begin.' 
      : 'Story generation was cancelled or completed. You can regenerate or close the modal.');

  if (!isOpen) return null;

  return createPortal(
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw', 
      height: '100vh',
      zIndex: 1000,
      backgroundColor: '#000'
    }}>
      {/* Status Strip */}
      <div className="story-modal__status-strip">
        {isGenerating && (
          <div className="story-modal__generating-status">
            <div className="story-modal__generating-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span>Generating story...</span>
          </div>
        )}
        {story && !isGenerating && (
          <div className="story-modal__completed-status">
            <span>Story generated successfully • {Math.ceil(story.split(' ').length)} words</span>
          </div>
        )}
      </div>

      {/* Generation Controls Overlay */}
      <div className="story-modal__generation-overlay">
        <div className="story-modal__generation-controls">
          {/* Show Generate buttons only if no story and not generating */}
          {!story && !isGenerating && !hasStartedGeneration && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenGenerateSettings}
                data-test-id="generateStoryButton"
                className='scenario-editor__generate-story-button'
                icon={<FaRedo />}
              >
                Generate Full Story
              </Button>
              {scenario?.id && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowRollingStoryModal(true)}
                  data-test-id="rollingStoryButton"
                  icon={<FaDice />}
                >
                  Interactive Story
                </Button>
              )}
            </>
          )}
          
          {/* Show Cancel button during generation */}
          {isGenerating && (
            <Button
              variant="secondary"
              data-test-id="cancelGenerationButton"
              size="sm"
              onClick={onCancelGeneration}
              icon={<FaTimes />}
            >
              Cancel Generation
            </Button>
          )}
          
          {/* Show Regenerate button when story exists and not generating */}
          {(story || hasStartedGeneration) && !isGenerating && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenRegenerateSettings}
                icon={<FaRedo />}
              >
                Regenerate
              </Button>
              {scenario?.id && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowRollingStoryModal(true)}
                  data-test-id="rollingStoryFromExistingButton"
                  icon={<FaDice />}
                >
                  Interactive Story
                </Button>
              )}
            </>
          )}
          
          {/* Save button - only show when we have content and not generating */}
          {story && !isGenerating && !isContinuing && (
            <Button
              variant="primary"
              size="sm"
              data-test-id="saveStoryButton"
              onClick={onSaveStory}
              disabled={isStorySaved}
              icon={<FaSave />}
            >
              {isStorySaved ? 'Saved' : 'Save story'}
            </Button>
          )}

          {/* Continue button - only show when story is saved and not generating */}
          {story && !isGenerating && isStorySaved && onContinueStory && (
            <Button
              variant="secondary"
              size="sm"
              data-test-id="continueStoryButton"
              onClick={onContinueStory}
              disabled={isContinuing}
              icon={<FaArrowRight />}
            >
              {isContinuing ? 'Creating...' : 'Continue Story'}
            </Button>
          )}
        </div>
      </div>

      {/* Continue Story Loading Overlay */}
      {isContinuing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1002
        }}>
          <div style={{
            backgroundColor: 'var(--color-surface, #1a1a2e)',
            borderRadius: '12px',
            padding: '32px 48px',
            textAlign: 'center',
            maxWidth: '400px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            <div className="story-modal__generating-dots" style={{ margin: '0 auto 16px', justifyContent: 'center' }}>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <h3 style={{ color: 'var(--color-text-primary, #fff)', marginBottom: '8px' }}>
              Creating Continuation...
            </h3>
            <p style={{ color: 'var(--color-text-secondary, #aaa)', margin: 0 }}>
              Summarizing the story and generating the next chapter opening. This may take a moment.
            </p>
          </div>
        </div>
      )}

      {/* Thinking Display */}
      {showThinking && thinking && (
        <div style={{
          position: 'fixed',
          top: '120px',
          right: '20px',
          width: '350px',
          maxHeight: '400px',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '16px',
          borderRadius: '8px',
          zIndex: 1001,
          overflow: 'auto',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '12px',
            color: '#9ca3af',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🤔 AI Thinking...
          </div>
          <div style={{
            fontSize: '13px',
            lineHeight: '1.4',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            color: '#e5e7eb'
          }}>
            {thinking}
          </div>
        </div>
      )}

      {/* AiStoryReader as full viewport component */}
      <AiStoryReader
        text={storyDisplayText}
        title={title}
        author="AI Generated"
        readingTime={story ? Math.ceil(story.split(' ').length / 200) : 0}
        coverImage={
          coverImage ||
          scenario?.imageUrl ||
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=600&fit=crop'
        }
        characters={
          scenario?.characters?.filter(char => char.name).map(char => ({
            id: char.id,
            name: char.name!,
            image: char.photoUrl ||
                   (char.photo_data ? `data:${char.photo_mime_type || 'image/jpeg'};base64,${char.photo_data}` : '') ||
                   'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            alias: char.alias,
            role: char.role,
            gender: char.gender,
            appearance: char.appearance,
            backstory: char.backstory,
            extraInfo: char.extraInfo
          })) || []
        }
        isStreaming={isGenerating}
        enableTTS={!!story && !isGenerating}
        enableBookmark={!!story && !isGenerating}
        enableHighlight={!!story && !isGenerating}
        enableFullScreen={true}
        displayMode="scroll"
        onBookmark={(bookmark) => console.log('Bookmark:', bookmark)}
        onHighlight={(selection) => console.log('Highlight:', selection)}
        onSettingsChange={(settings) => console.log('Settings:', settings)}
        onModeChange={(mode) => console.log('Mode changed:', mode)}
        onDownload={story ? handleDownloadStory : undefined}
        onClose={onClose}
      />

      {/* Generation Settings Modal */}
      <GenerationSettingsModal
        isOpen={showGenerationSettings}
        onClose={() => setShowGenerationSettings(false)}
        onGenerate={handleGenerateFromSettings}
        isRegenerating={isRegenerateMode}
      />

      {/* Rolling Story Modal */}
      {scenario && (
        <RollingStoryModal
          isOpen={showRollingStoryModal}
          onClose={() => setShowRollingStoryModal(false)}
          scenario={scenario}
        />
      )}
    </div>,
    document.body
  );
};