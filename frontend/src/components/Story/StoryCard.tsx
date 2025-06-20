import React from 'react';
import { MarketStoryCard } from '../../types/marketplace';
import './StoryCard.css';

interface StoryCardProps {
  story: MarketStoryCard;
  onClick: (storyId: number) => void;
  compact?: boolean;
}

const StoryCard: React.FC<StoryCardProps> = ({ story, onClick, compact = false }) => {
  const renderStars = (rating: number, count: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="star full">★</span>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<span key={i} className="star half">★</span>);
      } else {
        stars.push(<span key={i} className="star empty">☆</span>);
      }
    }
    
    return (
      <div className="rating">
        <div className="stars">{stars}</div>
        <span className="rating-text">
          {rating > 0 ? rating.toFixed(1) : 'No ratings'} 
          {count > 0 && ` (${count})`}
        </span>
      </div>
    );
  };

  const truncateSummary = (summary: string, length: number = 150) => {
    if (!summary) return 'No summary available';
    if (summary.length <= length) return summary;
    return summary.substring(0, length) + '...';
  };

  const getTooltipText = () => {
    const synopsis = story.ai_summary || 'No synopsis available';
    // Truncate very long synopses for better tooltip readability
    if (synopsis.length > 300) {
      return synopsis.substring(0, 300) + '...';
    }
    return synopsis;
  };

  return (
    <div 
      className={`story-card ${compact ? 'compact' : ''} ${story.is_staff_pick ? 'staff-pick' : ''}`}
      onClick={() => onClick(story.id)}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && onClick(story.id)}
      title={getTooltipText()}
      data-tooltip={getTooltipText()}
    >
      {story.is_staff_pick && (
        <div className="staff-pick-badge">
          <span>✨ Staff Pick</span>
        </div>
      )}
      
      <div className="story-card-content">
        <div className="story-header">
          <h3 className="story-title">{story.title}</h3>
          <p className="story-author">by {story.author}</p>
        </div>
        
        <div className="story-genres">
          {story.ai_genres && story.ai_genres.map((genre, index) => (
            <span key={index} className="genre-tag">{genre}</span>
          ))}
        </div>
        
        {!compact && (
          <div className="story-summary">
            <p>{truncateSummary(story.ai_summary)}</p>
          </div>
        )}
        
        <div className="story-stats">
          {renderStars(story.average_rating, story.rating_count)}
          
          <div className="additional-stats">
            <span className="downloads">
              📥 {story.total_downloads} downloads
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryCard;
