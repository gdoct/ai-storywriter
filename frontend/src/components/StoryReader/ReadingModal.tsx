import React, { MouseEvent, ReactNode, useEffect, useRef } from 'react';
import { Card } from '@drdata/ai-styles';
import { AiStoryReader } from '@drdata/ai-styles';
import './ReadingModal.css';

interface Character {
  name: string;
  description: string;
  imageUrl?: string;
}

interface ScenarioData {
  title?: string;
  description?: string;
  imageUrl?: string;
  characters?: Character[];
  setting?: string;
  genre?: string;
}

interface ReadingModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  content: string;
  author?: string;
  publishedAt?: string;
  wordCount?: number;
  imageUri?: string;
  scenarioJson?: string;
  storyId?: number;
  averageRating?: number;
  ratingCount?: number;
  userRating?: number;
  onRatingChange?: (rating: number) => void;
  onDownload?: () => void;
  children?: ReactNode;
}

const ReadingModal: React.FC<ReadingModalProps> = ({ 
  show, 
  onClose, 
  title, 
  content,
  author,
  publishedAt: _publishedAt,
  wordCount,
  imageUri: _imageUri,
  scenarioJson,
  storyId: _storyId,
  averageRating: _averageRating = 0,
  ratingCount: _ratingCount = 0,
  userRating: _userRating,
  onRatingChange: _onRatingChange,
  onDownload,
  children
}) => {
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Parse scenario data
  let scenarioData: ScenarioData = {};
  if (scenarioJson) {
    try {
      scenarioData = JSON.parse(scenarioJson);
    } catch (error) {
      console.error('Error parsing scenario JSON:', error);
    }
  }

  // const formatDate = (dateString: string) => {
  //   return new Date(dateString).toLocaleDateString('en-US', {
  //     year: 'numeric',
  //     month: 'long',
  //     day: 'numeric'
  //   });
  // };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (show) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [show, onClose]);

  // Handle clicking outside the modal content
  const handleOverlayClick = (e: MouseEvent) => {
    if (modalContentRef.current && !modalContentRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!show) return null;

  return (
    <div className="reading-modal-overlay" onClick={handleOverlayClick}>
      <div className="reading-modal-content" ref={modalContentRef}>
        <div className="reading-modal-header">
          <h2 className="reading-modal-title">{title}</h2>
          <button 
            className="reading-modal-close" 
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className="reading-modal-body">
          <div className="enhanced-story-reader">

            {/* Story Content */}
            {content && (
              <Card className="story-content-section">
                <AiStoryReader
                  text={content}
                  title={title}
                  author={author}
                  readingTime={wordCount ? Math.ceil(wordCount / 200) : undefined}
                  coverImage={_imageUri || scenarioData.imageUrl}
                  characters={scenarioData.characters?.map((char, index) => ({
                    id: index.toString(),
                    name: char.name,
                    image: char.imageUrl || '/default-avatar.png'
                  }))}
                  enableTTS={true}
                  enableBookmark={true}
                  enableHighlight={true}
                  enableFullScreen={true}
                  displayMode="scroll"
                  onDownload={onDownload}
                  onClose={onClose}
                />
              </Card>
            )}

            {/* Fallback for custom children */}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadingModal;
