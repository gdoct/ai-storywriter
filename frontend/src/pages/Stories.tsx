import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertModal, ConfirmModal } from '../components/Modal';
import PublishStoryModal from '../components/Story/PublishStoryModal';
import StoryPageCard from '../components/Story/StoryPageCard';
import { AiStoryReader } from '@drdata/ai-styles';
import { useModals } from '../hooks/useModals';
import { fetchRecentStories, formatRelativeTime, RecentStory } from '../services/dashboardService';
import { deleteDBStory, fetchSingleDBStory, fetchScenarioById } from '../services/scenario';
import { Scenario } from '../types/ScenarioTypes';
import './Stories.css';

// Extended story interface for character data
interface StoryWithScenario extends RecentStory {
  scenario?: Scenario;
}

const Stories: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { alertState, confirmState, hideAlert, hideConfirm, customAlert, customConfirm } = useModals();
  const [stories, setStories] = useState<RecentStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStories, setTotalStories] = useState(0);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  
  // Modal state for displaying story content
  const [selectedStory, setSelectedStory] = useState<StoryWithScenario | null>(null);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [storyContent, setStoryContent] = useState<string>('');
  const [loadingStoryContent, setLoadingStoryContent] = useState(false);
  
  // Publish modal state
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [storyToPublish, setStoryToPublish] = useState<RecentStory | null>(null);
  
  const storiesPerPage = 12;

  // Load stories for current page
  useEffect(() => {
    const loadStories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const offset = (currentPage - 1) * storiesPerPage;
        const response = await fetchRecentStories(storiesPerPage, offset);
        
        setStories(response.stories);
        setTotalStories(response.pagination.total);
        setTotalPages(Math.ceil(response.pagination.total / storiesPerPage));
      } catch (err) {
        console.error('Error loading stories:', err);
        setError('Failed to load stories. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    loadStories();
  }, [currentPage]);

  // Handle opening story from dashboard navigation
  useEffect(() => {
    if (location.state?.openStoryId && stories.length > 0) {
      const storyToOpen = stories.find(story => story.id === location.state.openStoryId);
      if (storyToOpen) {
        handleViewStory(storyToOpen);
        // Clear the state so it doesn't trigger again
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [stories, location.state, navigate, location.pathname]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleViewStory = async (story: RecentStory) => {
    setSelectedStory(story);
    setShowStoryModal(true);
    setLoadingStoryContent(true);
    
    try {
      // Fetch both the story content and scenario data to get characters
      const [fullStory, scenario] = await Promise.all([
        fetchSingleDBStory(story.id),
        fetchScenarioById(story.scenarioId)
      ]);
      
      if (fullStory && fullStory.text) {
        setStoryContent(fullStory.text);
      } else {
        setStoryContent('Story content not found.');
      }
      
      // Store scenario for character data
      if (scenario) {
        setSelectedStory(prev => prev ? { ...prev, scenario } : null);
      }
    } catch (err) {
      console.error('Error fetching story content:', err);
      setStoryContent('Error loading story content.');
    } finally {
      setLoadingStoryContent(false);
    }
  };

  const handleDownloadStory = (story: RecentStory) => {
    if (!storyContent) return;
    
    const blob = new Blob([storyContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${story.scenarioTitle || 'Story'}_${formatRelativeTime(story.created).replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeleteStory = async (storyId: number, storyTitle: string) => {
    const confirmed = await customConfirm(
      `Are you sure you want to delete this story? This action cannot be undone.`,
      {
        title: 'Confirm Delete',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        variant: 'danger'
      }
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteDBStory(storyId);
      
      // Reload the current page data
      const offset = (currentPage - 1) * storiesPerPage;
      const response = await fetchRecentStories(storiesPerPage, offset);
      setStories(response.stories);
      setTotalStories(response.pagination.total);
      setTotalPages(Math.ceil(response.pagination.total / storiesPerPage));
      
      // If current page is empty and not the first page, go to previous page
      if (response.stories.length === 0 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      
      // Close modal if the deleted story is currently being viewed
      if (selectedStory && selectedStory.id === storyId) {
        setShowStoryModal(false);
        setSelectedStory(null);
      }
    } catch (err) {
      console.error('Error deleting story:', err);
      customAlert('Failed to delete story. Please try again.', 'Error');
    }
  };

  const handleEditScenario = (scenarioId: string) => {
    // Navigate to the scenario editor with the specific scenario ID
    navigate(`/app?scenario=${scenarioId}`);
  };

  const handleContinueStory = async (story: RecentStory) => {
    // Navigate to scenario editor with continue story mode
    navigate(`/app?continueStory=${story.id}&scenario=${story.scenarioId}`);
  };

  const handlePublishStory = (story: RecentStory) => {
    setStoryToPublish(story);
    setShowPublishModal(true);
  };

  const handlePublishSuccess = () => {
    customAlert('Story published successfully! It will appear in the marketplace once AI processing is complete.', 'Success');
    setShowPublishModal(false);
    setStoryToPublish(null);
  };

  const handleClosePublishModal = () => {
    setShowPublishModal(false);
    setStoryToPublish(null);
  };

  // Group and filter stories
  const filteredStories = stories
    .filter(story =>
      story.scenarioTitle.toLowerCase().includes(search.toLowerCase()) ||
      story.preview.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

  const groupedStories = filteredStories.reduce((groups, story) => {
    if (!groups[story.scenarioTitle]) {
      groups[story.scenarioTitle] = [];
    }
    groups[story.scenarioTitle].push(story);
    return groups;
  }, {} as Record<string, RecentStory[]>);

  // Handle ESC to clear search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearch('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleGroup = (scenarioTitle: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [scenarioTitle]: !prev[scenarioTitle]
    }));
  };

  // Show loading state
  if (loading) {
    return (
      <div className="stories-page">
        <div className="stories-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your stories...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="stories-page">
        <div className="stories-container">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button 
              className="btn btn-primary" 
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stories-page">
      <div className="stories-container">
        <header className="stories-header">
          <div className="header-content">
            <h1>Your Stories</h1>
            <p>Manage and organize your generated stories ({totalStories} total)</p>
          </div>
          <Link to="/app" className="btn btn-primary">
            <span className="btn-icon">✏️</span>
            New Story
          </Link>
        </header>
        <div className="search-bar-container">
          <div className="search-bar-wrapper">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="🔍 Search by scenario or story..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-bar"
            />
            {search && (
              <button
                className="clear-search-btn"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>
        <div className="stories-content">
          {Object.keys(groupedStories).length > 0 ? (
            Object.entries(groupedStories).map(([scenarioTitle, stories]) => (
              <div key={scenarioTitle} className="scenario-group">
                <div className="scenario-header" onClick={() => toggleGroup(scenarioTitle)}>
                  <span className="collapse-icon">
                    {collapsedGroups[scenarioTitle] ? '▶' : '▼'}
                  </span>
                  <h2 className="scenario-title">{scenarioTitle}</h2>
                  <span className="story-count">{stories.length} stories</span>
                </div>
                {!collapsedGroups[scenarioTitle] && (
                  <div className="stories-grid">
                    {stories.map(story => (
                      <StoryPageCard
                        key={story.id}
                        story={{
                          id: story.id,
                          scenarioTitle: story.scenarioTitle,
                          created: story.created,
                          wordCount: story.wordCount,
                          preview: story.preview,
                          isPublished: story.isPublished
                        }}
                        onView={() => handleViewStory(story)}
                        onPublish={() => handlePublishStory(story)}
                        onSaveAs={() => handleEditScenario(story.scenarioId)}
                        onDelete={() => handleDeleteStory(story.id, story.scenarioTitle)}
                        onContinue={() => handleContinueStory(story)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>No stories yet</h3>
              <p>Generate your first story from a scenario to see it here!</p>
              <Link to="/app" className="btn btn-primary">Create Your First Story</Link>
            </div>
          )}
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button 
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              ← Previous
            </button>
            
            <div className="pagination-info">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <span className="pagination-total">
                ({totalStories} stories total)
              </span>
            </div>
            
            <button 
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Story View Modal - Full viewport AiStoryReader like Storybook */}
      {showStoryModal && selectedStory && createPortal(
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
          <AiStoryReader
            text={loadingStoryContent ? 'Loading story content...' : (storyContent || 'No content available')}
            title={selectedStory.scenarioTitle}
            author="You"
            readingTime={Math.ceil(selectedStory.wordCount / 200)}
            coverImage={selectedStory.imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=600&fit=crop'}
            characters={selectedStory.scenario?.characters?.map(char => ({
              id: char.id,
              name: char.name || 'Unknown',
              image: char.photoUrl || char.photo_data ? 
                (char.photoUrl || `data:${char.photo_mime_type || 'image/jpeg'};base64,${char.photo_data}`) :
                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
            })) || []}
            enableTTS={true}
            enableBookmark={true}
            enableHighlight={true}
            enableFullScreen={true}
            onProgressChange={(progress) => console.log('Progress:', progress)}
            onBookmark={(bookmark) => console.log('Bookmark:', bookmark)}
            onHighlight={(selection) => console.log('Highlight:', selection)}
            onSettingsChange={(settings) => console.log('Settings:', settings)}
            onModeChange={(mode) => console.log('Mode changed:', mode)}
            onDownload={() => handleDownloadStory(selectedStory)}
            onClose={() => {
              setShowStoryModal(false);
              setSelectedStory(null);
              setStoryContent('');
            }}
          />
        </div>,
        document.body
      )}

      {/* Publish Story Modal */}
      {storyToPublish && (
        <PublishStoryModal
          isOpen={showPublishModal}
          onClose={handleClosePublishModal}
          storyId={storyToPublish.id}
          storyTitle={storyToPublish.scenarioTitle}
          onSuccess={handlePublishSuccess}
        />
      )}

      {/* Custom Modal Components */}
      <AlertModal
        isOpen={alertState.isOpen}
        onClose={hideAlert}
        message={alertState.message}
        title={alertState.title}
      />
      
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
  );
};

export default Stories;
