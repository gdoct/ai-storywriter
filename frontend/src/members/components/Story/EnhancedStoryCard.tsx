/**
 * Enhanced Story Card with Moderation Controls
 * Includes additional controls for moderators and admins
 */
import React, { useState } from 'react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { useModals } from '../../../shared/hooks/useModals';
import http from '../../../shared/services/http';
import { MarketStoryCard } from '../../../shared/types/marketplace';
import { ConfirmModal } from '../../../shared/components/Modal';
import { ModeratorOnly } from '../../../shared/components/PermissionGate';
import './EnhancedStoryCard.css';

interface EnhancedStoryCardProps {
  story: MarketStoryCard;
  onClick: (storyId: number) => void;
  compact?: boolean;
  onModerationAction?: (storyId: number, action: string) => void;
}

export const EnhancedStoryCard: React.FC<EnhancedStoryCardProps> = ({ 
  story, 
  onClick, 
  compact = false,
  onModerationAction 
}) => {
  const { userProfile, hasPermission } = useAuth();
  const { confirmState, hideConfirm, customConfirm } = useModals();
  const [showModerationMenu, setShowModerationMenu] = useState(false);
  const [moderationLoading, setModerationLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

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

  const handleModerationAction = async (action: string) => {
    const confirmed = await customConfirm(
      `Are you sure you want to ${action} this story?`,
      {
        title: 'Confirm Moderation Action',
        confirmText: action.charAt(0).toUpperCase() + action.slice(1),
        cancelText: 'Cancel',
        variant: 'danger'
      }
    );

    if (!confirmed) {
      return;
    }

    setModerationLoading(true);
    try {
      let endpoint = '';
      let method = 'POST';
      
      switch (action) {
        case 'remove':
          endpoint = `/api/moderate/stories/${story.id}`;
          method = 'DELETE';
          break;
        case 'flag':
          endpoint = `/api/moderate/stories/${story.id}/flag`;
          break;
        case 'suspend_author':
          endpoint = `/api/moderate/users/${story.author_id}/suspend`;
          break;
        case 'toggle_staff_pick':
          endpoint = `/api/moderate/stories/${story.id}/staff-pick`;
          break;
        default:
          throw new Error('Unknown moderation action');
      }

      const requestData = action === 'toggle_staff_pick' 
        ? { is_staff_pick: !story.is_staff_pick }
        : {
            reason: `Moderated by ${userProfile?.username}`,
            moderator_notes: `Action: ${action}`
          };

      const response = await http.request({
        method,
        url: endpoint,
        data: requestData
      });

      if (response.status === 200) {
        alert(`Story ${action} successful`);
        onModerationAction?.(story.id, action);
        setShowModerationMenu(false);
      }
    } catch (error) {
      console.error('Moderation action failed:', error);
      alert('Moderation action failed. Please try again.');
    } finally {
      setModerationLoading(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger story view if clicking on moderation controls
    if ((e.target as Element).closest('.moderation-controls')) {
      return;
    }
    onClick(story.id);
  };

  const getTooltipText = () => {
    const synopsis = story.ai_summary || 'No synopsis available';
    // Truncate very long synopses for better tooltip readability
    if (synopsis.length > 300) {
      return synopsis.substring(0, 300) + '...';
    }
    return synopsis;
  };

  const hasValidImage = story.image_uri && !imageError;

  return (
    <div 
      className={`story-card enhanced ${compact ? 'compact' : ''} ${story.is_staff_pick ? 'staff-pick' : ''} ${hasValidImage ? 'has-image' : ''}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && !showModerationMenu && onClick(story.id)}
      title={getTooltipText()}
      data-tooltip={getTooltipText()}
      style={{
        backgroundImage: hasValidImage ? `url(${story.image_uri})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
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
        <div className="staff-pick-badge">
          <span>✨ Staff Pick</span>
        </div>
      )}

      {/* Moderation Controls */}
      <ModeratorOnly>
        <div className="moderation-controls">
          <button
            className="moderation-menu-toggle"
            onClick={(e) => {
              e.stopPropagation();
              setShowModerationMenu(!showModerationMenu);
            }}
            disabled={moderationLoading}
            aria-label="Moderation options"
          >
            ⚙️
          </button>
          
          {showModerationMenu && (
            <div className="moderation-menu">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleModerationAction('flag');
                }}
                className="moderation-action flag"
                disabled={moderationLoading}
              >
                🚩 Flag Story
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleModerationAction('remove');
                }}
                className="moderation-action remove"
                disabled={moderationLoading}
              >
                🗑️ Remove Story
              </button>
              
              {hasPermission('suspend_users') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleModerationAction('suspend_author');
                  }}
                  className="moderation-action suspend"
                  disabled={moderationLoading}
                >
                  🔒 Suspend Author
                </button>
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleModerationAction('toggle_staff_pick');
                }}
                className="moderation-action staff-pick"
                disabled={moderationLoading}
              >
                {story.is_staff_pick ? '⭐ Remove Staff Pick' : '✨ Make Staff Pick'}
              </button>
            </div>
          )}
        </div>
      </ModeratorOnly>
      
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

        {/* Custom Modal Components */}
        <ConfirmModal
          isOpen={confirmState.isOpen}
          onClose={hideConfirm}
          onConfirm={confirmState.onConfirm || (() => {})}
          message={confirmState.message}
          title={confirmState.title}
          confirmText={confirmState.confirmText}
          cancelText={confirmState.cancelText}
          variant={confirmState.variant}
        />
      </div>
    </div>
  );
};

export default EnhancedStoryCard;
