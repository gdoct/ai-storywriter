import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertModal } from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useModals } from '../hooks/useModals';
import { donateCredits, downloadStory, getMarketStory, rateStory } from '../services/marketPlaceApi';
import { MarketStory } from '../types/marketplace';
import './StoryDetail.css';

const StoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { alertState, hideAlert, customAlert } = useModals();
  const { refreshCredits } = useAuth();
  const [story, setStory] = useState<MarketStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRating, setUserRating] = useState<number>(0);
  const [isRating, setIsRating] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donationAmount, setDonationAmount] = useState<number>(10);
  const [isDonating, setIsDonating] = useState(false);

  useEffect(() => {
    if (id) {
      loadStory(parseInt(id));
    }
  }, [id]);

  const loadStory = async (storyId: number) => {
    try {
      setLoading(true);
      setError(null);
      const storyData = await getMarketStory(storyId);
      setStory(storyData);
      setUserRating(storyData?.user_rating || 0);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load story');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!story) return;
    
    try {
      await downloadStory(story.id);
      
      // Create and download text file
      const blob = new Blob([`${story.title}\nBy: ${story.author}\n\n${story.content}`], {
        type: 'text/plain'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Update download count in UI
      setStory(prev => prev ? { ...prev, total_downloads: prev.total_downloads + 1 } : null);
    } catch (error) {
      customAlert('Failed to download story', 'Error');
    }
  };

  const handleRateStory = async (rating: number) => {
    if (!story || isRating) return;
    
    try {
      setIsRating(true);
      const response = await rateStory(story.id, rating);
      setUserRating(rating);
      setStory(prev => prev ? {
        ...prev,
        average_rating: response.average_rating,
        rating_count: response.rating_count,
        user_rating: rating
      } : null);
    } catch (error) {
      customAlert(error instanceof Error ? error.message : 'Failed to rate story', 'Error');
    } finally {
      setIsRating(false);
    }
  };

  const handleDonate = async () => {
    if (!story || isDonating || donationAmount <= 0) return;
    
    try {
      setIsDonating(true);
      const response = await donateCredits(story.id, donationAmount);
      customAlert(response.message, 'Success');
      setShowDonateModal(false);
      setStory(prev => prev ? {
        ...prev,
        total_donated_credits: prev.total_donated_credits + donationAmount
      } : null);
      
      // Refresh credits to update badges
      await refreshCredits();
    } catch (error) {
      customAlert(error instanceof Error ? error.message : 'Failed to donate credits', 'Error');
    } finally {
      setIsDonating(false);
    }
  };

  const renderStars = (rating: number, interactive: boolean = false, onRate?: (rating: number) => void) => {
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`star ${i <= rating ? 'filled' : 'empty'} ${interactive ? 'interactive' : ''}`}
          onClick={interactive && onRate ? () => onRate(i) : undefined}
        >
          ★
        </span>
      );
    }
    
    return <div className="stars">{stars}</div>;
  };

  if (loading) {
    return (
      <div className="story-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading story...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="story-detail-error">
        <h2>Error Loading Story</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/marketplace')} className="back-button">
          Back to Marketplace
        </button>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="story-detail-error">
        <h2>Story Not Found</h2>
        <p>The story you're looking for doesn't exist.</p>
        <button onClick={() => navigate('/marketplace')} className="back-button">
          Back to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="story-detail">
      <div className="story-detail-header">
        <button onClick={() => navigate('/marketplace')} className="back-button">
          ← Back to Marketplace
        </button>
      </div>

      <div className="story-detail-content">
        <div className="story-meta">
          <h1 className="story-title">{story.title}</h1>
          <p className="story-author">By: {story.author}</p>
          
          <div className="story-genres">
            {story.ai_genres && story.ai_genres.map((genre, index) => (
              <span key={index} className="genre-tag">{genre}</span>
            ))}
          </div>

          <div className="story-stats">
            <div className="rating-section">
              <div className="average-rating">
                {renderStars(story.average_rating)}
                <span className="rating-text">
                  {story.average_rating > 0 ? story.average_rating.toFixed(1) : 'No ratings'} 
                  ({story.rating_count} ratings)
                </span>
              </div>
            </div>
            
            <div className="additional-stats">
              <span>📥 {story.total_downloads} downloads</span>
              <span>💰 {story.total_donated_credits} credits donated</span>
              <span>📅 Published: {new Date(story.published_at).toLocaleDateString()}</span>
            </div>
          </div>

          {story.ai_summary && (
            <div className="story-summary">
              <h3>Summary</h3>
              <p>{story.ai_summary}</p>
            </div>
          )}

          <div className="story-actions">
            <button onClick={handleDownload} className="download-button">
              📥 Download Story (TXT)
            </button>
            
            <div className="rating-section">
              <span>Rate this story:</span>
              {renderStars(userRating, true, handleRateStory)}
              {isRating && <span className="rating-loading">Rating...</span>}
            </div>
            
            <button 
              onClick={() => setShowDonateModal(true)} 
              className="donate-button"
              disabled={story.author_id === localStorage.getItem('user_id')}
            >
              💰 Donate Credits
            </button>
          </div>
        </div>

        <div className="story-content">
          <h3>Story</h3>
          <div className="story-text">
            {story.content?.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Donation Modal */}
      {showDonateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Donate Credits to {story.author}</h3>
              <button 
                onClick={() => setShowDonateModal(false)} 
                className="close-button"
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <p>Show your appreciation for this story by donating credits to the author.</p>
              
              <div className="donation-input">
                <label htmlFor="donation-amount">Credits to donate:</label>
                <input
                  id="donation-amount"
                  type="number"
                  min="1"
                  max="1000"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div className="modal-actions">
                <button 
                  onClick={() => setShowDonateModal(false)} 
                  className="cancel-button"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDonate} 
                  className="confirm-button"
                  disabled={isDonating || donationAmount <= 0}
                >
                  {isDonating ? 'Donating...' : `Donate ${donationAmount} Credits`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Modal Components */}
      <AlertModal
        isOpen={alertState.isOpen}
        onClose={hideAlert}
        message={alertState.message}
        title={alertState.title}
      />
    </div>
  );
};

export default StoryDetail;
