import React from 'react';
import { Link } from 'react-router-dom';
import { formatRelativeTime, RecentStory } from '../../services/dashboardService';
import DashboardCard from './DashboardCard';

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
  return (
    <div className="recent-stories-section">
      <div className="section-header">
        <h3>Recent Generated Stories</h3>
        <Link to="/stories" className="btn btn-secondary btn-small">View All</Link>
      </div>
      <div className="stories-list">
        {recentStories.map(story => (
          <DashboardCard
            key={story.id}
            title={story.scenarioTitle}
            metadata={[
              { icon: "📅", text: formatRelativeTime(story.created) },
              { icon: "📝", text: `${story.wordCount} words` }
            ]}
            actions={[
              ...(story.isPublished ? [] : [{
                label: "Publish",
                onClick: () => handlePublishStory(story),
                variant: "secondary" as const
              }]),
              {
                label: "Read",
                onClick: () => handleReadStory(story),
                variant: "primary" as const
              },
            ]}
          />
        ))}
        {recentStories.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h4>You haven't generated any stories yet</h4>
            <p>Create your first scenario to get started!</p>
            <Link to="/app" className="btn btn-primary">Start Writing</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentGeneratedStories;
