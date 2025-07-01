import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, ItemList, Button } from '@drdata/docomo';
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
  const navigate = useNavigate();

  // Convert stories to ItemList format
  const storyItems = recentStories.map(story => ({
    key: story.id,
    content: (
      <DashboardCard
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
    )
  }));

  const handleViewMore = () => {
    navigate('/stories');
  };

  return (
    <Card>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 'var(--spacing-lg)',
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: 'var(--spacing-md)'
      }}>
        <h3 style={{ 
          fontSize: 'var(--font-size-lg)', 
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-text-primary)',
          margin: 0
        }}>
          Recent Generated Stories
        </h3>
        <Button variant="secondary" size="sm" onClick={handleViewMore}>
          View All
        </Button>
      </div>
      
      {recentStories.length === 0 ? (
        <div style={{ 
          textAlign: 'center',
          padding: 'var(--spacing-4xl)',
          color: 'var(--color-text-secondary)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-lg)' }}>📝</div>
          <h4 style={{ 
            fontSize: 'var(--font-size-lg)', 
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--spacing-sm)'
          }}>
            You haven't generated any stories yet
          </h4>
          <p style={{ 
            marginBottom: 'var(--spacing-xl)',
            fontSize: 'var(--font-size-md)'
          }}>
            Create your first scenario to get started!
          </p>
          <Button variant="primary" onClick={() => navigate('/app')}>
            Start Writing
          </Button>
        </div>
      ) : (
        <ItemList 
          items={storyItems}
          onViewMore={handleViewMore}
          viewMoreText="View All Stories"
        />
      )}
    </Card>
  );
};

export default RecentGeneratedStories;
