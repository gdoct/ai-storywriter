import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CharacterBadge } from '../components/ScenarioEditor/common/CharacterBadge';
import { ConfirmModal } from '@shared/components/Modal';
import { useModals } from '@shared/hooks/useModals';

import { deleteScenario, fetchRecentScenarios, formatRelativeTime, RecentScenario } from '@shared/services/dashboardService';
import './Scenarios.css';
import { Button } from '@drdata/ai-styles';
import GenerateSimilarModal from '../components/Dashboard/GenerateSimilarModal';

const Scenarios: React.FC = () => {
  const navigate = useNavigate();
  const { confirmState, hideConfirm, customConfirm, customAlert } = useModals();
  const [scenarios, setScenarios] = useState<RecentScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalScenarios, setTotalScenarios] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Generate similar scenario state
  const [showGenerateSimilarModal, setShowGenerateSimilarModal] = useState(false);
  const [sourceScenarioForSimilar, setSourceScenarioForSimilar] = useState<RecentScenario | null>(null);
  
  // Infinite scroll ref
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const scenariosPerPage = 12;

  // Load initial scenarios
  useEffect(() => {
    const loadInitialScenarios = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetchRecentScenarios(scenariosPerPage, 0);

        setScenarios(response.scenarios);
        setTotalScenarios(response.pagination.total);
        setHasMore(response.scenarios.length >= scenariosPerPage);
      } catch (err) {
        console.error('Error loading scenarios:', err);
        setError('Failed to load scenarios. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialScenarios();
  }, []);

  // Load more scenarios for infinite scroll
  const loadMoreScenarios = async () => {
    if (isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);
      const offset = scenarios.length;
      const response = await fetchRecentScenarios(scenariosPerPage, offset);
      
      setScenarios(prev => [...prev, ...response.scenarios]);
      setHasMore(response.scenarios.length >= scenariosPerPage);
    } catch (err) {
      console.error('Error loading more scenarios:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isLoadingMore) {
          loadMoreScenarios();
        }
      },
      {
        rootMargin: '100px', // Start loading 100px before the element is visible
      }
    );

    const currentLoadMoreRef = loadMoreRef.current;
    if (currentLoadMoreRef) {
      observer.observe(currentLoadMoreRef);
    }

    return () => {
      if (currentLoadMoreRef) {
        observer.unobserve(currentLoadMoreRef);
      }
    };
  }, [hasMore, isLoadingMore, scenarios.length]);

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

  // Reset scenarios when search changes
  useEffect(() => {
    if (search) {
      // For search, we'll use the existing filter logic without infinite scroll
      return;
    }
    // When search is cleared, reload scenarios
    const loadInitialScenarios = async () => {
      try {
        setLoading(true);
        const response = await fetchRecentScenarios(scenariosPerPage, 0);
        setScenarios(response.scenarios);
        setTotalScenarios(response.pagination.total);
        setHasMore(response.scenarios.length >= scenariosPerPage);
      } catch (err) {
        console.error('Error reloading scenarios:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialScenarios();
  }, [search]);

  const handleEditScenario = (scenarioId: string) => {
    // Navigate to the scenario editor with the specific scenario ID
    navigate(`/app?scenario=${scenarioId}`);
  };

  const handleDeleteScenario = async (scenarioId: string, scenarioTitle: string) => {
    const confirmed = await customConfirm(
      `Are you sure you want to delete "${scenarioTitle}"? This action cannot be undone.`,
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
      await deleteScenario(scenarioId);

      // Reload scenarios after deletion
      const response = await fetchRecentScenarios(scenariosPerPage, 0);
      setScenarios(response.scenarios);
      setTotalScenarios(response.pagination.total);
      setHasMore(response.scenarios.length === scenariosPerPage && response.scenarios.length < response.pagination.total);
    } catch (err) {
      console.error('Error deleting scenario:', err);
      alert('Failed to delete scenario. Please try again.');
    }
  };

  const handleGenerateSimilar = (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) {
      customAlert('Scenario not found. Please try again.', 'Error');
      return;
    }
    setSourceScenarioForSimilar(scenario);
    setShowGenerateSimilarModal(true);
  };

  const handleSimilarScenarioCreated = (newScenarioId: string) => {
    setShowGenerateSimilarModal(false);
    setSourceScenarioForSimilar(null);
    navigate(`/app?scenario=${newScenarioId}`);
  };

  const handleCloseSimilarModal = () => {
    setShowGenerateSimilarModal(false);
    setSourceScenarioForSimilar(null);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="scenarios-page">
        <div className="scenarios-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your scenarios...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="scenarios-page">
        <div className="scenarios-container">
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

  // Filter scenarios based on search
  const filteredScenarios = scenarios.filter(scenario =>
    scenario.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="scenarios-page">
      <div className="scenarios-container">
        <header className="scenarios-header">
          <div className="header-content">
            <h1>Your Scenarios</h1>
            <p>Manage and organize your story scenarios ({totalScenarios} total)</p>
          </div>
          <Link to="/app" className="btn btn-primary">
            <span className="btn-icon">✏️</span>
            New Scenario
          </Link>
        </header>

        <div className="search-bar-container">
          <div className="search-bar-wrapper">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="🔍 Search scenarios..."
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

        <div className="scenarios-content">
          {filteredScenarios.length > 0 ? (
            <>
              <div className="scenarios-grid">
                {filteredScenarios.map(scenario => (
                  <div
                    key={scenario.id}
                    className="scenario-card"
                    onClick={() => handleEditScenario(scenario.id)}
                  >
                    <div className="scenario-image-container">
                      <img
                        src={scenario.imageUrl || '/placeholder-image.png'}
                        alt={scenario.title || 'Scenario Image'}
                        className="scenario-thumbnail"
                      />
                      <div className="scenario-title-overlay">
                        <h3 className="scenario-title">{scenario.title}</h3>
                      </div>
                      {scenario.characters && scenario.characters.length > 0 && (
                        <CharacterBadge
                          characters={scenario.characters}
                          className="scenario-character-badge"
                        />
                      )}
                    </div>
                    <div className="scenario-content">
                      <div className="scenario-meta">
                        📅 {formatRelativeTime(scenario.lastModified)} •
                        📝 {scenario.generatedStoryCount} stories
                      </div>

                      {scenario.synopsis && (
                        <p className="scenario-synopsis">{scenario.synopsis}</p>
                      )}

                      <div className="scenario-actions">
                        <button
                          className="btn btn-secondary btn-small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateSimilar(scenario.id);
                          }}
                        >
                          Generate Similar...
                        </button>
                        <Link
                          to={`/stories?scenario=${scenario.id}`}
                          className="btn btn-text btn-small"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="btn-icon">📚</span>
                          View Stories
                        </Link>
                        <button
                          className="btn btn-text delete-btn btn-small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteScenario(scenario.id, scenario.title);
                          }}
                          title="Delete scenario"
                        >
                          <span className="btn-icon">🗑️</span>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Trigger for Infinite Scroll */}
              {hasMore && (
                <div ref={loadMoreRef} className="load-more-trigger">
                  {isLoadingMore && (
                    <div className="loading-more">
                      <div className="loading-spinner"></div>
                      <p>Loading more scenarios...</p>
                    </div>
                  )}
                </div>
              )}
              
              {!hasMore && scenarios.length > 0 && (
                <div className="end-of-results">
                  <p>You've reached the end! ({totalScenarios} scenarios total)</p>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>No scenarios yet</h3>
              <p>Create your first scenario to get started with storytelling!</p>
              <Link to="/app" className="btn btn-primary">Create Your First Scenario</Link>
            </div>
          )}

          {/* Custom Modal Components */}

          {sourceScenarioForSimilar && (
            <GenerateSimilarModal
              isOpen={showGenerateSimilarModal}
              onClose={handleCloseSimilarModal}
              onScenarioCreated={handleSimilarScenarioCreated}
              sourceScenarioId={sourceScenarioForSimilar.id}
              sourceScenarioTitle={sourceScenarioForSimilar.title}
            />
          )}

          <ConfirmModal
            isOpen={confirmState.isOpen}
            onClose={hideConfirm}
            onConfirm={confirmState.onConfirm || (() => { })}
            message={confirmState.message}
            title={confirmState.title}
            confirmText={confirmState.confirmText}
            cancelText={confirmState.cancelText}
            variant={confirmState.variant}
          />
        </div>
      </div>
    </div>
  );
};

export default Scenarios;
