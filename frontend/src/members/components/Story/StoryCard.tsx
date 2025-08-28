import { Card } from '@drdata/ai-styles';
import React from 'react';
import { MarketStoryCard } from '../../../shared/types/marketplace';
import './StoryCard.css';

interface StoryCardProps {
  story: MarketStoryCard;
  onClick: (storyId: number) => void;
  compact?: boolean;
}

const StoryCard: React.FC<StoryCardProps> = ({ story, onClick, compact = false }) => {
  const [imageError, setImageError] = React.useState(false);
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

  const hasValidImage = story.image_uri && !imageError;

  return (
    <div
      className="story-card-container"
      onClick={() => onClick(story.id)}
      onKeyDown={(e) => e.key === 'Enter' && onClick(story.id)}
      tabIndex={0}
      style={{
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      <Card
        style={{
          position: 'relative',
          backgroundImage: hasValidImage ? `url(${story.image_uri})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          minHeight: compact ? '280px' : '320px',
          maxHeight: compact ? '280px' : '320px',
          width: compact ? '220px' : '280px',
          border: story.is_staff_pick ? '2px solid var(--color-primary)' : undefined,
        }}
      >
      {/* Hidden image for error detection */}
      {story.image_uri && (
        <img 
          src={story.image_uri} 
          alt=""
          style={{ display: 'none' }}
          onError={() => setImageError(true)}
          onLoad={() => setImageError(false)}
        />
      )}
      {story.is_staff_pick && (
        <div style={{
          position: 'absolute',
          top: 'var(--spacing-sm)',
          right: 'var(--spacing-sm)',
          background: 'var(--color-primary)',
          color: 'var(--color-primary-contrast)',
          padding: 'var(--spacing-xs) var(--spacing-sm)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 'var(--font-size-xs)',
          fontWeight: 'var(--font-weight-semibold)',
          zIndex: 3
        }}>
          ✨ Staff Pick
        </div>
      )}

      {/* Dark overlay for better text readability */}
      {hasValidImage && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          zIndex: 1
        }} />
      )}

      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.6), rgba(0,0,0,0.2))',
        padding: 'var(--spacing-lg)',
        color: 'white',
        zIndex: 2
      }}>
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <h3 style={{
            fontSize: compact ? 'var(--font-size-md)' : 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-bold)',
            margin: 0,
            marginBottom: 'var(--spacing-xs)',
            color: 'white'
          }}>
            {story.title}
          </h3>
          <p style={{
            fontSize: 'var(--font-size-sm)',
            margin: 0,
            opacity: 0.9
          }}>
            by {story.author}
          </p>
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--spacing-xs)',
          marginBottom: 'var(--spacing-md)'
        }}>
          {story.ai_genres && story.ai_genres.slice(0, 2).map((genre, index) => (
            <span 
              key={index} 
              style={{
                background: 'rgba(255,255,255,0.25)',
                backdropFilter: 'blur(8px)',
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--font-size-xs)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              {genre}
            </span>
          ))}
        </div>

        {!compact && (
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <p style={{
              fontSize: 'var(--font-size-sm)',
              margin: 0,
              opacity: 0.9,
              lineHeight: 1.4
            }}>
              {truncateSummary(story.ai_summary)}
            </p>
          </div>
        )}

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ color: 'white' }}>
            {renderStars(story.average_rating, story.rating_count)}
          </div>
          
          <div style={{
            fontSize: 'var(--font-size-xs)',
            opacity: 0.8
          }}>
            📥 {story.total_downloads} downloads
          </div>
        </div>
      </div>
      </Card>
    </div>
  );
};

export default StoryCard;
