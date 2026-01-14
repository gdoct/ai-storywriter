import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Card } from '@drdata/ai-styles';
import { getByGenre, getLatest, getMostPopular, getStaffPicks, getTopRated, getMarketStory, downloadStory, getAvailableGenres } from '../services/marketPlaceApi';
import { MarketStoryCard, MarketStory } from '../types/marketplace';
import StoryCard from '@members/components/Story/StoryCard';
import EnhancedStoryCard from '@members/components/Story/EnhancedStoryCard';
import EnhancedStoryReader from '@members/components/StoryReader/EnhancedStoryReader';
import Modal from '../components/common/Modal';
import { useAuth } from '../contexts/AuthContext';
import './MarketplaceBrowse.css';

const MarketplaceBrowse: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [stories, setStories] = useState<MarketStoryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Story reader modal state
  const [showReadingModal, setShowReadingModal] = useState(false);
  const [selectedStoryId, setSelectedStoryId] = useState<number | null>(null);
  const [selectedStory, setSelectedStory] = useState<MarketStory | null>(null);
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyError, setStoryError] = useState<string | null>(null);
  const [userRating, setUserRating] = useState<number | undefined>(undefined);
  
  // Genre switching state
  const [availableGenres, setAvailableGenres] = useState<Array<{name: string, count: number}>>([]);
  const [loadingGenres, setLoadingGenres] = useState(false);

  const section = searchParams.get('section');
  const staffPicks = searchParams.get('staff_picks') === 'true';
  const genre = section?.startsWith('genre/') ? section.replace('genre/', '') : null;
  
  const getTitle = () => {
    if (staffPicks) return 'Staff Picks';
    if (section === 'top-rated') return 'Top Rated Stories';
    if (section === 'most-popular') return 'Most Popular Stories';
    if (section === 'latest') return 'Latest Stories';
    if (genre) return `${genre} Stories`;
    return 'Browse Stories';
  };

  const loadStories = useCallback(async (_: number = 1, append: boolean = false) => {
    try {
      setLoading(true);
      let newStories: MarketStoryCard[] = [];
      
      if (staffPicks) {
        const response = await getStaffPicks(20); // Load more for browse page
        newStories = response;
      } else if (section === 'top-rated') {
        const response = await getTopRated(20);
        newStories = response;
      } else if (section === 'most-popular') {
        const response = await getMostPopular(20);
        newStories = response;
      } else if (section === 'latest') {
        const response = await getLatest(20);
        newStories = response;
      } else if (genre) {
        const response = await getByGenre(genre, 20);
        newStories = response;
      }

      if (append) {
        setStories(prev => [...prev, ...newStories]);
      } else {
        setStories(newStories);
      }
      
      // Check if there are more stories (simple check based on response length)
      setHasMore(newStories.length === 20);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stories');
    } finally {
      setLoading(false);
    }
  }, [section, staffPicks, genre]);

  useEffect(() => {
    const loadAvailableGenres = async () => {
      try {
        setLoadingGenres(true);
        const genres = await getAvailableGenres();
        setAvailableGenres(genres);
      } catch (error) {
        console.error('Failed to load available genres:', error);
      } finally {
        setLoadingGenres(false);
      }
    };

    loadStories(1, false);
    loadAvailableGenres();
  }, [loadStories]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadStories(nextPage, true);
  };

  const handleModerationAction = (_: number, __: string) => {
    // Refresh the stories after moderation action
    loadStories(1, false);
    setPage(1);
  };

  const handleStoryClick = async (storyId: number) => {
    setSelectedStoryId(storyId);
    setShowReadingModal(true);
    setStoryLoading(true);
    setStoryError(null);
    setSelectedStory(null);

    try {
      const story = await getMarketStory(storyId);
      setSelectedStory(story);
      setUserRating(story?.user_rating);
      
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
    
    // Refresh the stories list to update the displayed average rating
    loadStories(1, false);
    setPage(1);
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

  const handleGenreChange = (newGenre: string) => {
    if (newGenre) {
      navigate(`/marketplace/browse?section=genre/${encodeURIComponent(newGenre)}`);
    }
  };

  const handleBackToMarketplace = () => {
    navigate('/marketplace');
  };

  if (loading && stories.length === 0) {
    return (
      <div className="marketplace-browse">
        <div className="marketplace-container">
          <Card style={{ 
            textAlign: 'center', 
            padding: 'var(--spacing-3xl)',
            minHeight: '400px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div className="loading-spinner"></div>
            <p style={{
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-lg)',
              margin: 0,
              fontWeight: 'var(--font-weight-medium)'
            }}>
              Loading stories...
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="marketplace-browse">
        <div className="marketplace-container">
          <Card style={{ 
            textAlign: 'center', 
            padding: 'var(--spacing-3xl)',
            minHeight: '400px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <h2 style={{
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-md)',
              fontWeight: 'var(--font-weight-bold)',
              fontSize: 'var(--font-size-xl)'
            }}>
              Error Loading Stories
            </h2>
            <p style={{
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-lg)',
              margin: '0 0 var(--spacing-md) 0',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              {error}
            </p>
            <Button onClick={() => loadStories(1, false)} variant="primary">
              Try Again
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="marketplace-browse">
      <div className="marketplace-container">
        <Card style={{ marginBottom: 'var(--spacing-xl)' }}>
          <div className="browse-header-layout">
            {/* Left side - Back link and title */}
            <div className="browse-header-left">
              <Button 
                onClick={handleBackToMarketplace}
                variant="secondary"
                size="sm"
                style={{ 
                  marginBottom: 'var(--spacing-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-xs)'
                }}
              >
                ← Back to Marketplace
              </Button>
              
              <h1 style={{
                fontSize: 'var(--font-size-3xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text-primary)',
                margin: '0 0 var(--spacing-sm) 0',
                letterSpacing: '-0.02em'
              }}>
                {getTitle()}
              </h1>
              
              <p style={{
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-lg)',
                margin: 0,
                fontWeight: 'var(--font-weight-medium)'
              }}>
                Discover amazing stories from our community
              </p>
            </div>

            {/* Right side - Genre dropdown (only show for genre pages) */}
            {genre && (
              <div className="browse-header-right">
                <label style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-text-secondary)'
                }}>
                  Switch Genre:
                </label>
                <select
                  value={genre}
                  onChange={(e) => handleGenreChange(e.target.value)}
                  disabled={loadingGenres}
                  style={{
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    borderRadius: 'var(--radius-sm)',
                    border: '2px solid var(--color-border-primary)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    fontSize: 'var(--font-size-sm)',
                    minWidth: '180px',
                    cursor: loadingGenres ? 'wait' : 'pointer'
                  }}
                >
                  {availableGenres.map((g) => (
                    <option key={g.name} value={g.name}>
                      {g.name} ({g.count})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </Card>

        {stories.length === 0 ? (
          <Card style={{ 
            textAlign: 'center', 
            padding: 'var(--spacing-3xl)',
            minHeight: '400px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <h3 style={{
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-md)',
              fontWeight: 'var(--font-weight-bold)',
              fontSize: 'var(--font-size-xl)'
            }}>
              No Stories Found
            </h3>
            <p style={{
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-lg)',
              margin: 0,
              fontWeight: 'var(--font-weight-medium)'
            }}>
              There are no stories in this section yet.
            </p>
          </Card>
        ) : (
          <>
            <div className="stories-grid">
              {stories.map((story) => (
                hasRole('moderator') || hasRole('admin') ? (
                  <EnhancedStoryCard
                    key={story.id}
                    story={story}
                    onClick={handleStoryClick}
                    onModerationAction={handleModerationAction}
                    compact={false}
                  />
                ) : (
                  <StoryCard
                    key={story.id}
                    story={story}
                    onClick={handleStoryClick}
                    compact={false}
                  />
                )
              ))}
            </div>

            {hasMore && (
              <div className="load-more-section">
                <Button 
                  onClick={handleLoadMore} 
                  disabled={loading}
                  variant="primary"
                  size="l"
                >
                  {loading ? 'Loading...' : 'Load More Stories'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Story Reading Modal */}
      <Modal
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
      </Modal>
    </div>
  );
};

export default MarketplaceBrowse;