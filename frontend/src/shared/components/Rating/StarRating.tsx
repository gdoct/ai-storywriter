import React, { useState } from 'react';
import './StarRating.css';

interface StarRatingProps {
  storyId: number;
  currentRating?: number;
  averageRating: number;
  ratingCount: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  compact?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({
  storyId,
  currentRating,
  averageRating,
  ratingCount,
  onRatingChange,
  readonly = false,
  compact = false
}) => {
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarClick = async (rating: number) => {
    if (readonly || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/marketplace/market-stories/${storyId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ rating })
      });

      if (response.ok) {
        await response.json();
        // Call the callback with the new rating and updated average/count
        onRatingChange?.(rating);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoveredRating || currentRating || 0;

  return (
    <div className="star-rating">
      <div className="rating-display">
        <div className="stars-container">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              className={`star ${star <= displayRating ? 'filled' : ''} ${readonly ? 'readonly' : ''}`}
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => !readonly && setHoveredRating(star)}
              onMouseLeave={() => !readonly && setHoveredRating(0)}
              disabled={readonly || isSubmitting}
              title={readonly ? `${averageRating}/5 stars` : `Rate ${star} star${star > 1 ? 's' : ''}`}
            >
              ★
            </button>
          ))}
        </div>
        
        <div className="rating-info">
          <span className="average-rating">
            {averageRating > 0 ? averageRating.toFixed(1) : 'No ratings'}
          </span>
          {ratingCount > 0 && (
            <span className="rating-count">
              ({ratingCount} rating{ratingCount !== 1 ? 's' : ''})
            </span>
          )}
        </div>
      </div>
      
      {!readonly && !compact && (
        <div className="user-rating-info">
          {currentRating ? (
            <span className="current-rating">Your rating: {currentRating}/5</span>
          ) : (
            <span className="no-rating">Click to rate this story</span>
          )}
        </div>
      )}
    </div>
  );
};

export default StarRating;