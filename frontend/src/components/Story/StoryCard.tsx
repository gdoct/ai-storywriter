import React from 'react';
import { Card } from '@drdata/docomo';
import { MarketStoryCard } from '../../types/marketplace';

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

  return (
    <div
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
          backgroundImage: story.image_uri ? `url(${story.image_uri})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          minHeight: compact ? '200px' : '300px',
          border: story.is_staff_pick ? '2px solid var(--color-primary)' : undefined,
        }}
      >
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
          zIndex: 2
        }}>
          ✨ Staff Pick
        </div>
      )}

      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.4), transparent)',
        padding: 'var(--spacing-lg)',
        color: 'white'
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
                background: 'rgba(255,255,255,0.2)',
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--font-size-xs)',
                color: 'white'
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
