import React, { useState } from 'react';
import { AiStoryReader } from '@drdata/ai-styles';
import { downloadStory, getMarketStory } from '../../services/marketPlaceApi';
import { MarketStory, MarketStoryCard } from '../../types/marketplace';
import { createPortal } from 'react-dom';
import EnhancedStoryCard from '../../../members/components/Story/EnhancedStoryCard';
import StoryCard from '../../../members/components/Story/StoryCard';
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
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [selectedStoryId, setSelectedStoryId] = useState<number | null>(null);
  const [selectedStory, setSelectedStory] = useState<MarketStory | null>(null);
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyError, setStoryError] = useState<string | null>(null);
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
    setShowStoryModal(true);
    setStoryLoading(true);
    setStoryError(null);
    setSelectedStory(null);

    try {
      const story = await getMarketStory(storyId);
      setSelectedStory(story);
      
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

  const handleCloseStoryModal = () => {
    setShowStoryModal(false);
    setSelectedStoryId(null);
    setSelectedStory(null);
    setStoryError(null);
  };

  const handleRatingChange = async (newRating: number) => {
    console.log('Rating changed to:', newRating);
    
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

      {showStoryModal && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 1000,
          backgroundColor: '#000'
        }}>
          {storyLoading && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
              textAlign: 'center',
              zIndex: 1002
            }}>
              <div className="loading-spinner" style={{ marginBottom: '1rem' }}></div>
              <p>Loading story content...</p>
            </div>
          )}

          {storyError && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
              textAlign: 'center',
              zIndex: 1002
            }}>
              <p>Error: {storyError}</p>
              <button 
                className="retry-button"
                onClick={() => selectedStoryId && handleStoryClick(selectedStoryId)}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
            </div>
          )}

          {selectedStory && !storyLoading && !storyError && (
            <AiStoryReader
              text={selectedStory.content || 'No content available for this story.'}
              title={selectedStory.title}
              author={selectedStory.author}
              readingTime={Math.ceil(getWordCount(selectedStory.content || '') / 200)}
              coverImage={selectedStory.image_uri || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=600&fit=crop'}
              characters={
                (() => {
                  try {
                    if (!selectedStory.scenario_json) return [];
                    const scenario = JSON.parse(selectedStory.scenario_json);
                    return scenario.characters?.filter((char: any) => char.name).map((char: any) => ({
                      id: char.id,
                      name: char.name,
                      image: char.photoUrl || 
                             (char.photo_data ? `data:${char.photo_mime_type || 'image/jpeg'};base64,${char.photo_data}` : '') ||
                             'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
                      alias: char.alias,
                      role: char.role,
                      gender: char.gender,
                      appearance: char.appearance,
                      backstory: char.backstory,
                      extraInfo: char.extraInfo
                    })) || [];
                  } catch (error) {
                    console.warn('Failed to parse scenario JSON:', error);
                    return [];
                  }
                })()
              }
              enableTTS={true}
              enableBookmark={true}
              enableHighlight={true}
              enableFullScreen={true}
              enableRating={true}
              displayMode="scroll"
              onProgressChange={(progress) => console.log('Progress:', progress)}
              onBookmark={(bookmark) => console.log('Bookmark:', bookmark)}
              onHighlight={(selection) => console.log('Highlight:', selection)}
              onRating={handleRatingChange}
              onSettingsChange={(settings) => console.log('Settings:', settings)}
              onModeChange={(mode) => console.log('Mode changed:', mode)}
              onDownload={() => selectedStory && handleDownloadStory()}
              onClose={handleCloseStoryModal}
            />
          )}
        </div>,
        document.body
      )}

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
