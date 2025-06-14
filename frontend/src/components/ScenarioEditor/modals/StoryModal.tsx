import React, { useEffect, useRef, useState } from 'react';
import { FaCopy, FaDownload, FaRedo, FaSave, FaTimes } from 'react-icons/fa';
import { Button } from '../common/Button';
import './StoryModal.css';

export interface StoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: string | null;
  onRegenerate: () => void;
  onSaveStory?: () => void;
  onCancelGeneration?: () => void;
  isGenerating: boolean;
  isStorySaved?: boolean;
  title?: string;
}

export const StoryModal: React.FC<StoryModalProps> = ({
  isOpen,
  onClose,
  story,
  onRegenerate,
  onSaveStory,
  onCancelGeneration,
  isGenerating,
  isStorySaved = false,
  title = 'Generated Story',
}) => {
  const [textSize, setTextSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [autoScroll, setAutoScroll] = useState(true);
  const [hasStartedGeneration, setHasStartedGeneration] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setHasStartedGeneration(!!story); // If there's already a story, consider it generated
    }
  }, [isOpen, story]);

  // Track when generation completes or is cancelled
  useEffect(() => {
    if (isGenerating) {
      setHasStartedGeneration(true);
    }
  }, [isGenerating]);

  // Auto-scroll to bottom when story changes during generation
  useEffect(() => {
    if (autoScroll && isGenerating && contentRef.current && story) {
      requestAnimationFrame(() => {
        if (contentRef.current && autoScroll) {
          contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
      });
    }
  }, [story, isGenerating, autoScroll]);

  // Reset auto-scroll when generation starts
  useEffect(() => {
    if (isGenerating) {
      setAutoScroll(true);
    }
  }, [isGenerating]);

  // Handle user scroll - disable auto-scroll if user scrolls up, enable if at bottom
  const handleScroll = () => {
    // Only manage auto-scroll during generation
    if (!isGenerating) return;
    
    const element = contentRef.current;
    if (!element) return;
    
    const { scrollTop, scrollHeight, clientHeight } = element;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 10; // 10px threshold
    
    setAutoScroll(isAtBottom);
  };

  const getTextSizeClass = () => {
    switch (textSize) {
      case 'small': return 'story-modal__text--small';
      case 'large': return 'story-modal__text--large';
      default: return 'story-modal__text--medium';
    }
  };
  const handleCopyStory = async () => {
    if (story) {
      try {
        await navigator.clipboard.writeText(story);
        // You could add a toast notification here
        console.log('Story copied to clipboard');
      } catch (err) {
        console.error('Failed to copy story:', err);
      }
    }
  };

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

  if (!isOpen) return null;

  return (
    <div className="story-modal-overlay" onClick={onClose}>
      <div className="story-modal" onClick={(e) => e.stopPropagation()}>
        <div className="story-modal__header">
          <h2 className="story-modal__title">{title}</h2>
          <div className="story-modal__actions">
            {/* Show Generate button only if no story and not generating */}
            {!story && !isGenerating && !hasStartedGeneration && (
              <Button
                variant="primary"
                size="sm"
                onClick={onRegenerate}
                icon={<FaRedo />}
              >
                Generate Story
              </Button>
            )}
            
            {/* Show Cancel button during generation */}
            {isGenerating && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onCancelGeneration}
                icon={<FaTimes />}
              >
                Cancel Generation
              </Button>
            )}
            
            {/* Show Regenerate button when story exists and not generating */}
            {(story || hasStartedGeneration) && !isGenerating && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRegenerate}
                icon={<FaRedo />}
              >
                Regenerate
              </Button>
            )}
            
            {/* Save, Copy, Download buttons - only show when we have content and not generating */}
            {story && !isGenerating && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onSaveStory}
                  disabled={isStorySaved}
                  icon={<FaSave />}
                >
                  {isStorySaved ? 'Saved' : 'Save story'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyStory}
                  icon={<FaCopy />}
                >
                  Copy
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownloadStory}
                  icon={<FaDownload />}
                >
                  Download
                </Button>
              </>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              icon={<FaTimes />}
            >
              Close
            </Button>
          </div>
        </div>
        <div className="story-modal__content">
          {/* Text Size Controls */}
          <div className="story-modal__text-controls">
            <button
              className={`story-modal__text-size-btn ${textSize === 'small' ? 'story-modal__text-size-btn--active' : ''}`}
              onClick={() => setTextSize('small')}
              title="Small text (16px)"
            >
              <span style={{ fontSize: '8px' }}>A</span>
            </button>
            <button
              className={`story-modal__text-size-btn ${textSize === 'medium' ? 'story-modal__text-size-btn--active' : ''}`}
              onClick={() => setTextSize('medium')}
              title="Medium text (22px)"
            >
              <span style={{ fontSize: '14px' }}>A</span>
            </button>
            <button
              className={`story-modal__text-size-btn ${textSize === 'large' ? 'story-modal__text-size-btn--active' : ''}`}
              onClick={() => setTextSize('large')}
              title="Large text (28px)"
            >
              <span style={{ fontSize: '20px' }}>A</span>
            </button>
          </div>

          <div 
            className="story-modal__scroll-container"
            ref={contentRef}
            onScroll={handleScroll}
          >
            {story ? (
              <div className={`story-modal__text ${getTextSizeClass()}`}>
                {story.split('\n').map((paragraph, index) => (
                  <p key={index} className="story-modal__paragraph">
                    {paragraph}
                  </p>
                ))}
                {isGenerating && (
                  <div className="story-modal__generating-indicator">
                    <div className="story-modal__generating-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span>Generating...</span>
                  </div>
                )}
              </div>
            ) : isGenerating ? (
              <div className="story-modal__loading">
                <div className="story-modal__spinner" />
                <p>Generating your story...</p>
              </div>
            ) : !hasStartedGeneration ? (
              <div className="story-modal__empty">
                <p>Ready to generate your story. Click "Generate Story" to begin.</p>
              </div>
            ) : (
              <div className="story-modal__empty">
                <p>Story generation was cancelled or completed. You can regenerate or close the modal.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
