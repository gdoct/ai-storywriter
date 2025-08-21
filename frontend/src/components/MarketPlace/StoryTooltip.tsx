import React, { useEffect, useState } from 'react';
import { getMarketStory } from '../../services/marketPlaceApi';
import { MarketStory } from '../../types/marketplace';
import './StoryTooltip.css';

interface StoryTooltipProps {
  storyId: number | null;
  showTooltip: boolean;
  handleCloseTooltip: () => void;
}

const StoryTooltip: React.FC<StoryTooltipProps> = ({ storyId, showTooltip, handleCloseTooltip: _handleCloseTooltip }) => {
  const [story, setStory] = useState<MarketStory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (storyId && showTooltip) {
      setLoading(true);
      setError(null);
      
      getMarketStory(storyId)
        .then(setStory)
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to load story');
        })
        .finally(() => setLoading(false));
    }
  }, [storyId, showTooltip]);

  if (!showTooltip || !storyId) return null;

  return (
    <div className="story-tooltip">
      <div className="story-tooltip-content">
        {loading && (
          <div className="story-tooltip-loading">
            <div className="loading-spinner"></div>
            <p>Loading story details...</p>
          </div>
        )}

        {error && (
          <div className="story-tooltip-error">
            <p>Failed to load story details</p>
          </div>
        )}

        {story && !loading && (
          <>
            <div className="story-tooltip-header">
              <h4 className="story-tooltip-title">{story.title}</h4>
              <p className="story-tooltip-author">by {story.author}</p>
            </div>

            {story.ai_genres && story.ai_genres.length > 0 && (
              <div className="story-tooltip-genres">
                {story.ai_genres.slice(0, 3).map((genre, index) => (
                  <span key={index} className="genre-tag">{genre}</span>
                ))}
              </div>
            )}

            <div className="story-tooltip-summary">
              <p>{story.ai_summary || 'No summary available'}</p>
            </div>

            <div className="story-tooltip-stats">
              <div className="stat">
                <span className="stat-value">⭐ {story.average_rating > 0 ? story.average_rating.toFixed(1) : 'N/A'}</span>
                <span className="stat-label">Rating</span>
              </div>
              <div className="stat">
                <span className="stat-value">📥 {story.total_downloads}</span>
                <span className="stat-label">Downloads</span>
              </div>
              <div className="stat">
                <span className="stat-value">💰 {story.total_donated_credits}</span>
                <span className="stat-label">Credits</span>
              </div>
            </div>

            {story.is_staff_pick && (
              <div className="story-tooltip-badge">
                <span>✨ Staff Pick</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StoryTooltip;