import React from 'react';
import './StoryPageCard.css';

interface StoryPageCardProps {
  story: {
    id: number;
    scenarioTitle: string;
    created: string;
    wordCount: number;
    preview: string;
    isPublished?: boolean;
    imageUrl?: string;
  };
  onView: () => void;
  onPublish: () => void;
  onSaveAs: () => void;
  onDelete: () => void;
  onContinue?: () => void;
}

export const StoryPageCard: React.FC<StoryPageCardProps> = ({
  story,
  onView,
  onPublish,
  onSaveAs,
  onDelete,
  onContinue
}) => {
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} months ago`;
  };

  return (
    <div className="story-page-card" onClick={onView}>
      <div className="story-page-card-image-container">
        <img
          src={story.imageUrl || '/placeholder-image.png'}
          alt={story.scenarioTitle || 'Story Image'}
          className="story-page-card-thumbnail"
        />
        <div className="story-page-card-title-overlay">
          <h3 className="story-page-card-title">
            {story.scenarioTitle}
            {story.isPublished && (
              <span className="published-badge">Published</span>
            )}
          </h3>
        </div>
      </div>
      <div className="story-page-card-content">
        <div className="story-page-card-meta">
          📅 {formatRelativeTime(story.created)} • 
          📝 {story.wordCount} words
        </div>
        
        <p className="story-page-card-excerpt">{story.preview}</p>
        
        <div className="story-page-card-actions">
          {!story.isPublished && (
            <button 
              className="btn btn-marketplace btn-small"
              onClick={(e) => {
                e.stopPropagation();
                onPublish();
              }}
              title="Publish to Marketplace"
            >
              <span className="btn-icon">🏪</span>
              Publish
            </button>
          )}
          {onContinue && (
            <button 
              className="btn btn-success btn-small"
              onClick={(e) => {
                e.stopPropagation();
                onContinue();
              }}
              title="Continue this story with a new chapter"
            >
              <span className="btn-icon">➡️</span>
              Continue
            </button>
          )}
          <button 
            className="btn btn-danger btn-small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <span className="btn-icon">🗑️</span>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoryPageCard;
