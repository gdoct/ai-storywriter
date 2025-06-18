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
  };
  onView: () => void;
  onPublish: () => void;
  onSaveAs: () => void;
  onDelete: () => void;
}

export const StoryPageCard: React.FC<StoryPageCardProps> = ({
  story,
  onView,
  onPublish,
  onSaveAs,
  onDelete
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
    <div className="story-page-card">
      <div className="story-page-card-content">
        <div className="story-page-card-header">
          <h3 className="story-page-card-title">
            {story.scenarioTitle}
            {story.isPublished && (
              <span className="published-badge">Published</span>
            )}
          </h3>
          <div className="story-page-card-meta">
            <span className="story-page-card-date">
              {formatRelativeTime(story.created)}
            </span>
            <span className="story-page-card-words">{story.wordCount} words</span>
          </div>
        </div>
        <p className="story-page-card-excerpt">{story.preview}</p>
      </div>
      <div className="story-page-card-actions">
        <button 
          className="btn btn-primary btn-small"
          onClick={onView}
        >
          <span className="btn-icon">👁️</span>
          View
        </button>
        {!story.isPublished && (
          <button 
            className="btn btn-marketplace btn-small"
            onClick={onPublish}
            title="Publish to Marketplace"
          >
            <span className="btn-icon">🏪</span>
            Publish
          </button>
        )}
        <button 
          className="btn btn-secondary btn-small"
          onClick={onSaveAs}
        >
          <span className="btn-icon">💾</span>
          Save As
        </button>
        <button 
          className="btn btn-danger btn-small"
          onClick={onDelete}
        >
          <span className="btn-icon">🗑️</span>
          Delete
        </button>
      </div>
    </div>
  );
};

export default StoryPageCard;
