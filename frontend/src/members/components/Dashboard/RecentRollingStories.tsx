import { Button } from '@drdata/ai-styles';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RollingStory } from '@shared/services/rollingStoriesService';
import { formatRelativeTime } from '@shared/services/dashboardService';
import './Dashboard.css';

interface RecentRollingStoriesProps {
  recentRollingStories: RollingStory[];
  handleContinueStory: (story: RollingStory) => void;
}

const getStatusLabel = (status: RollingStory['status']) => {
  switch (status) {
    case 'draft':
      return '📋 Draft';
    case 'in_progress':
      return '✍️ In Progress';
    case 'completed':
      return '✅ Completed';
    case 'abandoned':
      return '🚫 Abandoned';
    default:
      return status;
  }
};

const RecentRollingStories: React.FC<RecentRollingStoriesProps> = ({
  recentRollingStories,
  handleContinueStory,
}) => {
  const navigate = useNavigate();

  const handleViewAll = () => {
    navigate('/rolling-stories');
  };

  return (
    <div className="recent-section">
      {/* Header row - 20% height */}
      <div className="recent-section-header">
        <h3 className="recent-section-title">
          <span className="recent-section-icon">🎲</span>
          Rolling Stories
        </h3>
        <Button variant="secondary" size="sm" onClick={handleViewAll}>
          View All
        </Button>
      </div>

      {/* Content row - 80% height */}
      <div className="recent-section-content">
        {recentRollingStories.length === 0 ? (
          <div className="recent-section-empty">
            <div className="recent-section-empty-icon">🎲</div>
            <h4 className="recent-section-empty-title">No rolling stories yet</h4>
            <p className="recent-section-empty-description">
              Start an interactive story where you make choices that shape the narrative!
            </p>
            <Button variant="primary" onClick={() => navigate('/scenarios')}>
              Browse Scenarios
            </Button>
          </div>
        ) : (
          <div>
            {recentRollingStories.map((story) => (
              <div
                key={story.id}
                className="recent-item"
                onClick={() => handleContinueStory(story)}
              >
                <div className="recent-item-content" style={{ paddingLeft: 'var(--spacing-sm)' }}>
                  <h4 className="recent-item-title">{story.title || 'Untitled Story'}</h4>
                  <p className="recent-item-meta">
                    {getStatusLabel(story.status)} •
                    📅 {formatRelativeTime(story.updated_at)} •
                    📝 {story.paragraph_count || 0} paragraphs
                  </p>
                  <div style={{
                    marginTop: 'var(--spacing-sm)',
                    display: 'flex',
                    gap: 'var(--spacing-sm)'
                  }}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation();
                        handleContinueStory(story);
                      }}
                    >
                      {story.status === 'completed' ? 'Read' : 'Continue'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentRollingStories;
