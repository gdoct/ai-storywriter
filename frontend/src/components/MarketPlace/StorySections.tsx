import React, { useState } from 'react';
import { downloadStory, getMarketStory } from '../../services/marketPlaceApi';
import { MarketStory, MarketStoryCard } from '../../types/marketplace';
import EnhancedStoryCard from '../Story/EnhancedStoryCard';
import StoryCard from '../Story/StoryCard';
import ReadingModal from '../StoryReader/ReadingModal';
import EnhancedStoryReader from '../StoryReader/EnhancedStoryReader';
import './StorySections.css';
import StoryTooltip from './StoryTooltip';

interface StorySectionsProps {
  sections: Record<string, {
    title: string;
    stories: MarketStoryCard[];
    loading: boolean;
    error: string | null;
  }>;
  hasRole: (role: string) => boolean;
  handleModerationAction: (storyId: number, action: string) => void;
  loadSections: () => void;
  onViewMore?: (sectionKey: string) => void;
}

const StorySections: React.FC<StorySectionsProps> = ({ sections, hasRole, handleModerationAction, loadSections, onViewMore }) => {
  const [showReadingModal, setShowReadingModal] = useState(false);
  const [selectedStoryId, setSelectedStoryId] = useState<number | null>(null);
  const [selectedStory, setSelectedStory] = useState<MarketStory | null>(null);
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyError, setStoryError] = useState<string | null>(null);
  const [userRating, setUserRating] = useState<number | undefined>(undefined);
  const [tooltipData, setTooltipData] = useState<{
    storyId: number | null;
    visible: boolean;
    x: number;
    y: number;
  }>({
    storyId: null,
    visible: false,
    x: 0,
    y: 0
  });

  const handleStoryClick = async (storyId: number) => {
    setSelectedStoryId(storyId);
    setShowReadingModal(true);
    setStoryLoading(true);
    setStoryError(null);
    setSelectedStory(null);

    try {
      const story = await getMarketStory(storyId);
      setSelectedStory(story);
      setUserRating(story.user_rating);
      
      // Track reading as a download
      try {
        await downloadStory(storyId);
      } catch (downloadError) {
        console.log('Failed to track story read as download:', downloadError);
        // Don't show error to user, this is just tracking
      }
    } catch (error) {
      setStoryError(error instanceof Error ? error.message : 'Failed to load story');
    } finally {
      setStoryLoading(false);
    }
  };

  const handleCloseReadingModal = () => {
    setShowReadingModal(false);
    setSelectedStoryId(null);
    setSelectedStory(null);
    setStoryError(null);
    setUserRating(undefined);
  };

  const handleRatingChange = async (newRating: number) => {
    setUserRating(newRating);
    
    // Update the selected story's rating data
    if (selectedStory) {
      try {
        const updatedStory = await getMarketStory(selectedStory.id);
        setSelectedStory(updatedStory);
      } catch (error) {
        console.error('Failed to refresh story rating data:', error);
      }
    }
    
    // Optionally refresh sections to update the displayed average rating
    loadSections();
  };

  const handleMouseEnter = (event: React.MouseEvent, storyId: number) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    // Calculate optimal position
    let x = rect.right + 10; // Default: to the right
    let y = rect.top;
    
    // Check if tooltip would go off-screen to the right
    if (x + 320 > viewport.width) {
      x = rect.left - 330; // Move to the left
    }
    
    // Check if tooltip would go off-screen at the bottom
    if (y + 300 > viewport.height) {
      y = Math.max(10, viewport.height - 310); // Adjust to stay on screen
    }
    
    setTooltipData({
      storyId,
      visible: true,
      x: Math.max(10, x), // Ensure it doesn't go off-screen to the left
      y: Math.max(10, y)  // Ensure it doesn't go off-screen at the top
    });
  };

  const handleMouseLeave = () => {
    setTooltipData({
      storyId: null,
      visible: false,
      x: 0,
      y: 0
    });
  };

  const handleDownloadStory = async () => {
    if (selectedStory) {
      try {
        // Track the download via API
        await downloadStory(selectedStory.id);
        
        // Download the file
        const element = document.createElement('a');
        const file = new Blob([selectedStory.content || 'No content available'], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `${selectedStory.title}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        URL.revokeObjectURL(element.href);
      } catch (error) {
        console.error('Error downloading story:', error);
        // Still allow the download even if API call fails
        const element = document.createElement('a');
        const file = new Blob([selectedStory.content || 'No content available'], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `${selectedStory.title}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        URL.revokeObjectURL(element.href);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getWordCount = (content: string) => {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const renderStoryCard = (story: MarketStoryCard) => {
    if (hasRole('moderator') || hasRole('admin')) {
      return (
        <div
          key={story.id}
          onMouseEnter={(e) => handleMouseEnter(e, story.id)}
          onMouseLeave={handleMouseLeave}
        >
          <EnhancedStoryCard
            story={story}
            onClick={() => handleStoryClick(story.id)}
            onModerationAction={handleModerationAction}
            compact
          />
        </div>
      );
    } else {
      return (
        <div
          key={story.id}
          onMouseEnter={(e) => handleMouseEnter(e, story.id)}
          onMouseLeave={handleMouseLeave}
        >
          <StoryCard
            story={story}
            onClick={() => handleStoryClick(story.id)}
            compact
          />
        </div>
      );
    }
  };

  const renderSection = (sectionKey: string) => {
    const section = sections[sectionKey];

    if (section.loading) {
      return (
        <div className="section-loading">
          <div className="loading-spinner"></div>
          <span>Loading {section.title.toLowerCase()}...</span>
        </div>
      );
    }

    if (section.error) {
      return (
        <div className="section-error">
          <p>Failed to load {section.title.toLowerCase()}</p>
          <button onClick={loadSections} className="retry-button">Retry</button>
        </div>
      );
    }

    if (section.stories.length === 0) {
      return (
        <div className="section-empty">
          <p>No stories available in {section.title.toLowerCase()}</p>
        </div>
      );
    }

    return (
      <div className="stories-carousel">
        {section.stories.map(story => renderStoryCard(story))}
      </div>
    );
  };

  return (
    <div className="marketplace-content">
      {Object.keys(sections).map(sectionKey => (
        <section key={sectionKey} className="marketplace-section">
          <div className="section-header">
            <h2>{sections[sectionKey].title}</h2>
            <button
              className="view-more-button"
              onClick={() => onViewMore ? onViewMore(sectionKey) : console.log(`View more for ${sectionKey}`)}
            >
              View More
            </button>
          </div>
          {renderSection(sectionKey)}
        </section>
      ))}

      <ReadingModal
        show={showReadingModal}
        onClose={handleCloseReadingModal}
        title={selectedStory?.title || 'Story Details'}
      >
        {storyLoading && (
          <div className="section-loading">
            <div className="loading-spinner"></div>
            <p>Loading story content...</p>
          </div>
        )}

        {storyError && (
          <div className="section-error">
            <p>Error: {storyError}</p>
            <button 
              className="retry-button"
              onClick={() => selectedStoryId && handleStoryClick(selectedStoryId)}
            >
              Try Again
            </button>
          </div>
        )}

        {selectedStory && !storyLoading && !storyError && (
          <EnhancedStoryReader
            content={selectedStory.content || 'No content available for this story.'}
            isLoading={false}
            title={selectedStory.title}
            author={selectedStory.author}
            publishedAt={selectedStory.published_at}
            wordCount={getWordCount(selectedStory.content || '')}
            imageUri={selectedStory.image_uri}
            scenarioJson={selectedStory.scenario_json}
            storyId={selectedStory.id}
            averageRating={selectedStory.average_rating}
            ratingCount={selectedStory.rating_count}
            userRating={userRating}
            onRatingChange={handleRatingChange}
            onDownload={handleDownloadStory}
          />
        )}
      </ReadingModal>

      {/* Floating Tooltip */}
      {tooltipData.visible && tooltipData.storyId && (
        <div
          style={{
            position: 'fixed',
            left: tooltipData.x,
            top: tooltipData.y,
            zIndex: 1000,
            pointerEvents: 'none'
          }}
        >
          <StoryTooltip
            storyId={tooltipData.storyId}
            showTooltip={tooltipData.visible}
            handleCloseTooltip={handleMouseLeave}
          />
        </div>
      )}
    </div>
  );
};

export default StorySections;
