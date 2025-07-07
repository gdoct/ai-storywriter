import { Button } from '@drdata/ai-styles';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatRelativeTime, RecentStory } from '../../services/dashboardService';
import './Dashboard.css';

interface RecentGeneratedStoriesProps {
  recentStories: RecentStory[];
  handlePublishStory: (story: RecentStory) => void;
  handleReadStory: (story: RecentStory) => void;
}

const RecentGeneratedStories: React.FC<RecentGeneratedStoriesProps> = ({
  recentStories,
  handlePublishStory,
  handleReadStory,
}) => {
  const navigate = useNavigate();

  const handleViewMore = () => {
    navigate('/stories');
  };

  return (
    <div className="recent-section">
      {/* Header row - 20% height */}
      <div className="recent-section-header">
        <h3 className="recent-section-title">
          <span className="recent-section-icon">📚</span>
          Recent Generated Stories
        </h3>
        <Button variant="secondary" size="sm" onClick={handleViewMore}>
          View All
        </Button>
      </div>

      {/* Content row - 80% height */}
      <div className="recent-section-content">
        {recentStories.length === 0 ? (
          <div className="recent-section-empty">
            <div className="recent-section-empty-icon">📚</div>
            <h4 className="recent-section-empty-title">You haven't generated any stories yet</h4>
            <p className="recent-section-empty-description">
              Create your first scenario to get started!
            </p>
            <Button variant="primary" onClick={() => navigate('/app')}>
              Start Writing
            </Button>
          </div>
        ) : (
          <div>
            {recentStories.map((story) => (
              <div key={story.id} className="recent-item">
                <div className="recent-item-image">
                  <img
                    src={story.imageUrl || '/placeholder-image.png'}
                    alt={story.scenarioTitle || 'Story Image'}
                    className="recent-item-thumbnail"
                  />
                </div>
                <div className="recent-item-content">
                  <h4 className="recent-item-title">{story.scenarioTitle}</h4>
                  <p className="recent-item-meta">
                    📅 {formatRelativeTime(story.created)} • 
                    📝 {story.wordCount} words
                  </p>
                  <div style={{ 
                    marginTop: 'var(--spacing-sm)',
                    display: 'flex',
                    gap: 'var(--spacing-sm)'
                  }}>
                    {!story.isPublished && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handlePublishStory(story)}
                      >
                        Publish
                      </Button>
                    )}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleReadStory(story)}
                    >
                      Read
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

export default RecentGeneratedStories;
