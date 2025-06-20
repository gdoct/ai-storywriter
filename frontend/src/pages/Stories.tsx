import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertModal, ConfirmModal } from '../components/Modal';
import PublishStoryModal from '../components/Story/PublishStoryModal';
import StoryPageCard from '../components/Story/StoryPageCard';
import ReadingModal from '../components/StoryReader/ReadingModal';
import StoryReader from '../components/StoryReader/StoryReader';
import { useModals } from '../hooks/useModals';
import { fetchRecentStories, formatRelativeTime, RecentStory } from '../services/dashboardService';
import { deleteDBStory, fetchSingleDBStory } from '../services/scenario';
import './Stories.css';

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
  const [selectedStory, setSelectedStory] = useState<RecentStory | null>(null);
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
      // Fetch the individual story using the optimized single story endpoint
      const fullStory = await fetchSingleDBStory(story.id);
      
      if (fullStory && fullStory.text) {
        setStoryContent(fullStory.text);
      } else {
        setStoryContent('Story content not found.');
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
        <div className="search-bar-container" style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
          <div className="search-bar-wrapper">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="🔍 Search by scenario or story..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-bar professional-search-bar"
              style={{ width: 360, padding: '12px 44px 12px 40px', fontSize: 18, borderRadius: 32, border: '1.5px solid #cbd5e1', boxShadow: '0 2px 8px rgba(79,70,229,0.07)', outline: 'none', transition: 'border 0.2s' }}
            />
            {search && (
              <button
                className="clear-search-btn"
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 20, color: '#64748b', cursor: 'pointer' }}
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

      {/* Story View Modal */}
      <ReadingModal
        show={showStoryModal}
        onClose={() => {
          setShowStoryModal(false);
          setSelectedStory(null);
          setStoryContent('');
        }}
        title={selectedStory ? `Story: ${selectedStory.scenarioTitle}` : 'Story'}
      >
        <StoryReader
          content={storyContent}
          isLoading={loadingStoryContent}
          metadata={selectedStory ? {
            scenario: selectedStory.scenarioTitle,
            created: formatRelativeTime(selectedStory.created),
            wordCount: selectedStory.wordCount
          } : undefined}
          onDownload={selectedStory ? () => handleDownloadStory(selectedStory) : undefined}
          onEditScenario={selectedStory ? () => handleEditScenario(selectedStory.scenarioId) : undefined}
          onDelete={selectedStory ? () => handleDeleteStory(selectedStory.id, selectedStory.scenarioTitle) : undefined}
        />
      </ReadingModal>

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
