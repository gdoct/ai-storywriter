import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { downloadStory, getMarketStory, rateStory } from '../../services/marketPlaceApi';
import { MarketStory } from '../../types/marketplace';
import Modal from '../common/Modal';
import './StoryModal.css';

interface StoryModalProps {
  storyId: number | null;
  show: boolean;
  onClose: () => void;
}

const StoryModal: React.FC<StoryModalProps> = ({ storyId, show, onClose }) => {
  const [story, setStory] = useState<MarketStory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRating, setIsRating] = useState(false);
  const { authenticated } = useAuth();

  const fetchStory = useCallback(async () => {
    if (!storyId) return;
    
    setLoading(true);
    setError(null);
    try {
      const storyData = await getMarketStory(storyId);
      if (storyData) {
        setStory(storyData);
        setRating(storyData.user_rating || 0);
      } else {
        setError('Story not found');
      }
    } catch (error) {
      setError('Failed to load story details');
      console.error('Error fetching story:', error);
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    if (show && storyId) {
      fetchStory();
    }
  }, [show, storyId, fetchStory]);

  const handleDownload = async () => {
    if (!story || !authenticated) return;
    
    setIsDownloading(true);
    try {
      await downloadStory(story.id);
      // Refresh story data to get updated download count
      await fetchStory();
    } catch (error) {
      console.error('Error downloading story:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRating = async (newRating: number) => {
    if (!story || !authenticated || isRating) return;
    
    setIsRating(true);
    try {
      await rateStory(story.id, newRating);
      setRating(newRating);
      // Refresh story data to get updated rating
      await fetchStory();
    } catch (error) {
      console.error('Error rating story:', error);
    } finally {
      setIsRating(false);
    }
  };

  const renderStars = (currentRating: number, interactive: boolean = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`star ${i <= currentRating ? 'filled' : 'empty'} ${interactive ? 'interactive' : ''}`}
          onClick={interactive ? () => handleRating(i) : undefined}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!show) return null;

  const modalFooter = story && authenticated ? (
    <div className="story-modal-footer">
      <button
        className="download-button"
        onClick={handleDownload}
        disabled={isDownloading}
      >
        {isDownloading ? 'Downloading...' : `📥 Download Story`}
      </button>
    </div>
  ) : null;

  return (
    <Modal
      show={show}
      onClose={onClose}
      title={story?.title || 'Story Details'}
      footer={modalFooter}
    >
      <div className="story-modal-content">
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading story details...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <p className="error-message">{error}</p>
            <button onClick={fetchStory} className="retry-button">
              Try Again
            </button>
          </div>
        )}

        {story && !loading && (
          <>
            <div className="story-header">
              <div className="author-info">
                <p className="author">by <strong>{story.author}</strong></p>
                <p className="published-date">Published {formatDate(story.published_at)}</p>
              </div>
              {story.is_staff_pick && (
                <div className="staff-pick-badge">
                  <span>✨ Staff Pick</span>
                </div>
              )}
            </div>

            <div className="story-genres">
              {story.ai_genres.map((genre, index) => (
                <span key={index} className="genre-tag">{genre}</span>
              ))}
            </div>

            <div className="story-summary">
              <h3>Synopsis</h3>
              <p>{story.ai_summary}</p>
            </div>

            <div className="story-stats">
              <div className="rating-section">
                <div className="average-rating">
                  <div className="stars">
                    {renderStars(story.average_rating)}
                  </div>
                  <span className="rating-text">
                    {story.average_rating > 0 ? story.average_rating.toFixed(1) : 'No ratings'}
                    {story.rating_count > 0 && ` (${story.rating_count} ${story.rating_count === 1 ? 'rating' : 'ratings'})`}
                  </span>
                </div>

                {authenticated && (
                  <div className="user-rating">
                    <p>Your rating:</p>
                    <div className="stars interactive">
                      {renderStars(rating, true)}
                    </div>
                  </div>
                )}
              </div>

              <div className="download-stats">
                <span className="downloads">
                  📥 {story.total_downloads} downloads
                </span>
                {story.total_donated_credits > 0 && (
                  <span className="donations">
                    💎 {story.total_donated_credits} credits donated
                  </span>
                )}
              </div>
            </div>

            {!authenticated && (
              <div className="auth-prompt">
                <p>Please log in to download and rate this story.</p>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default StoryModal;
