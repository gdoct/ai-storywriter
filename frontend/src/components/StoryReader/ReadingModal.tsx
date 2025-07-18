import React, { MouseEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { Button, Card } from '@drdata/ai-styles';
import { AiStoryReader } from '@drdata/ai-styles';
import StarRating from '../Rating/StarRating';
import TTSPlayer from '../TTS/TTSPlayer';
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
  publishedAt,
  wordCount,
  imageUri,
  scenarioJson,
  storyId,
  averageRating = 0,
  ratingCount = 0,
  userRating,
  onRatingChange,
  onDownload,
  children
}) => {
  const modalContentRef = useRef<HTMLDivElement>(null);
  const [fontFamily, setFontFamily] = useState<string>('Georgia');
  const [fontSize, setFontSize] = useState<string>('24px');

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

  // Parse scenario data
  let scenarioData: ScenarioData = {};
  if (scenarioJson) {
    try {
      scenarioData = JSON.parse(scenarioJson);
    } catch (error) {
      console.error('Error parsing scenario JSON:', error);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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
            {/* Hero Section with Image */}
            {(imageUri || scenarioData.imageUrl) && (
              <div 
                className="story-hero"
                style={{
                  backgroundImage: `url(${imageUri || scenarioData.imageUrl})`,
                }}
              >
                <div className="story-hero-overlay">
                  <div className="story-hero-content">
                    <h1 className="story-hero-title">{title}</h1>
                    {author && (
                      <p className="story-hero-author">by {author}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Story Info Panel */}
            <Card className="story-info-panel">
              <div className="story-info-layout">
                {/* Left side - Story details */}
                <div className="story-info-left">
                  {!imageUri && !scenarioData.imageUrl && (
                    <div className="story-title-section">
                      <h1 style={{
                        fontSize: 'var(--font-size-2xl)',
                        fontWeight: 'var(--font-weight-bold)',
                        color: 'var(--color-text-primary)',
                        margin: '0 0 var(--spacing-xs) 0'
                      }}>
                        {title}
                      </h1>
                      {author && (
                        <p style={{
                          fontSize: 'var(--font-size-lg)',
                          color: 'var(--color-text-secondary)',
                          margin: '0 0 var(--spacing-md) 0'
                        }}>
                          by {author}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="story-metadata">
                    {publishedAt && (
                      <div className="metadata-item">
                        <strong>Published:</strong> {formatDate(publishedAt)}
                      </div>
                    )}
                    {wordCount && (
                      <div className="metadata-item">
                        <strong>Word Count:</strong> {wordCount.toLocaleString()} words
                      </div>
                    )}
                    {scenarioData.setting && (
                      <div className="metadata-item">
                        <strong>Setting:</strong> {scenarioData.setting}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side - Controls */}
                <div className="story-info-right">
                  {/* TTS Player */}
                  {content && (
                    <div className="tts-player-compact">
                      <TTSPlayer text={content} />
                    </div>
                  )}

                  {/* Rating */}
                  {storyId && (
                    <div className="rating-compact">
                      <StarRating
                        storyId={storyId}
                        currentRating={userRating}
                        averageRating={averageRating}
                        ratingCount={ratingCount}
                        onRatingChange={onRatingChange}
                        compact={true}
                      />
                    </div>
                  )}

                  {/* Download Button */}
                  {onDownload && (
                    <Button onClick={onDownload} variant="secondary" size="sm">
                      📥 Download
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Characters Section */}
            {scenarioData.characters && scenarioData.characters.length > 0 && (
              <Card className="characters-section">
                <h3 style={{
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text-primary)',
                  margin: '0 0 var(--spacing-md) 0'
                }}>
                  Characters
                </h3>
                <div className="characters-grid">
                  {scenarioData.characters.map((character, index) => (
                    <div key={index} className="character-card">
                      {character.imageUrl && (
                        <img 
                          src={character.imageUrl} 
                          alt={character.name}
                          className="character-image"
                        />
                      )}
                      <div className="character-info">
                        <h4 className="character-name">{character.name}</h4>
                        <p className="character-description">{character.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Story Content */}
            {content && (
              <Card className="story-content-section">
                <AiStoryReader
                  text={content}
                  font={fontFamily}
                  fontSize={fontSize}
                  onFontChange={setFontFamily}
                  onFontSizeChange={setFontSize}
                  availableFonts={fontOptions}
                  availableFontSizes={sizeOptions}
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
