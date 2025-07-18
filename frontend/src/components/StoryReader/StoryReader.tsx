import { AiStoryReader } from '@drdata/ai-styles';
import React, { useState } from 'react';
import StarRating from '../Rating/StarRating';
import TTSPlayer from '../TTS/TTSPlayer';
import './StoryReader.css';

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

interface StoryReaderProps {
  content: string;
  isLoading?: boolean;
  title?: string;
  metadata?: {
    scenario: string;
    created: string;
    wordCount: number;
  };
  onDownload?: () => void;
  onEditScenario?: () => void;
  onDelete?: () => void;
  // Rating props for marketplace stories
  storyId?: number;
  averageRating?: number;
  ratingCount?: number;
  userRating?: number;
  onRatingChange?: (rating: number) => void;
  // Marketplace story props
  imageUri?: string;
  scenarioJson?: string;
}

const StoryReader: React.FC<StoryReaderProps> = ({
  content,
  isLoading = false,
  title,
  metadata,
  onDownload,
  onEditScenario,
  onDelete,
  storyId,
  averageRating = 0,
  ratingCount = 0,
  userRating,
  onRatingChange,
  imageUri,
  scenarioJson
}) => {
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

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: 'var(--spacing-5xl)',
        color: 'var(--color-text-secondary)'
      }}>
        <div style={{ 
          fontSize: 'var(--font-size-lg)',
          marginBottom: 'var(--spacing-md)'
        }}>
          Loading story content...
        </div>
      </div>
    );
  }

  return (
    <div className="story-reader-wrapper" style={{ 
      background: 'var(--color-surface-primary)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--spacing-lg)'
    }}>
      {/* Action Controls */}
      <div className="story-reader-header">
        <h2 className="story-reader-title">
          {title || 'Story Reader'}
        </h2>
        
        <div className="story-reader-actions">
          {/* Text-to-Speech Player - moved to header and made compact */}
          {content && (
            <div className="tts-player-compact">
              <TTSPlayer 
                text={content}
              />
            </div>
          )}
          {onEditScenario && (
            <button className="story-reader-button secondary" onClick={onEditScenario}>
              ✏️ Edit Scenario
            </button>
          )}
          {onDelete && (
            <button className="story-reader-button secondary" onClick={onDelete}>
              🗑️ Delete Story
            </button>
          )}
        </div>
      </div>

      {/* Story Metadata with inline Rating */}
      <div className="story-metadata">
        {metadata && (
          <>
            <div>
              <strong>Scenario:</strong> {metadata.scenario}
            </div>
            <div>
              <strong>Created:</strong> {metadata.created}
            </div>
            <div>
              <strong>Word Count:</strong> {metadata.wordCount} words
            </div>
          </>
        )}
        {/* Inline Rating Section for Marketplace Stories */}
        {storyId && (
          <div className="inline-rating">
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
      </div>

      {/* AI Story Reader */}
      {content ? (
        <div className="story-reader-main">
          <AiStoryReader
            text={content}
            font={fontFamily}
            fontSize={fontSize}
            onFontChange={setFontFamily}
            onFontSizeChange={setFontSize}
            availableFonts={fontOptions}
            availableFontSizes={sizeOptions}
          />
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center',
          padding: 'var(--spacing-4xl)',
          color: 'var(--color-text-secondary)'
        }}>
          <p>No story content available.</p>
        </div>
      )}
    </div>
  );
};

export default StoryReader;
