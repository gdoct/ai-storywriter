import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CharacterBadge } from '../components/ScenarioEditor/common/CharacterBadge';
import { ConfirmModal } from '../components/Modal';
import { useModals } from '../hooks/useModals';

import { deleteScenario, fetchRecentScenarios, formatRelativeTime, RecentScenario } from '../services/dashboardService';
import './Scenarios.css';
import { Button } from '@drdata/ai-styles';
import GenerateSimilarModal, { ScenarioSelections } from '../components/Dashboard/GenerateSimilarModal';
import { Scenario } from '../types/ScenarioTypes';
import { fetchScenarioById } from '../services/scenario';
import GeneratingModal from '../components/Dashboard/GeneratingModal';
import { generateSimilarScenarios, ScenarioSelections as ServiceScenarioSelections, GenerationProgress } from '../services/similarScenarioService';

const Scenarios: React.FC = () => {
  const navigate = useNavigate();
  const { confirmState, hideConfirm, customConfirm, customAlert } = useModals();
  const [scenarios, setScenarios] = useState<RecentScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalScenarios, setTotalScenarios] = useState(0);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Generate similar scenario state
  const [showGenerateSimilarModal, setShowGenerateSimilarModal] = useState(false);
  const [showGeneratingModal, setShowGeneratingModal] = useState(false);
  const [scenarioToSimilar, setScenarioToSimilar] = useState<RecentScenario | null>(null);
  const [fullScenarioForModal, setFullScenarioForModal] = useState<Scenario | null>(null);
  
  // Progress tracking for multiple scenario generation
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(1);
  const [totalScenariosToGenerate, setTotalScenariosToGenerate] = useState(1);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const scenariosPerPage = 12;

  // Load scenarios for current page
  useEffect(() => {
    const loadScenarios = async () => {
      try {
        setLoading(true);
        setError(null);

        const offset = (currentPage - 1) * scenariosPerPage;
        const response = await fetchRecentScenarios(scenariosPerPage, offset);

        setScenarios(response.scenarios);
        setTotalScenarios(response.pagination.total);
        setTotalPages(Math.ceil(response.pagination.total / scenariosPerPage));
      } catch (err) {
        console.error('Error loading scenarios:', err);
        setError('Failed to load scenarios. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    loadScenarios();
  }, [currentPage]);

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

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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

      // Reload the current page data
      const offset = (currentPage - 1) * scenariosPerPage;
      const response = await fetchRecentScenarios(scenariosPerPage, offset);
      setScenarios(response.scenarios);
      setTotalScenarios(response.pagination.total);
      setTotalPages(Math.ceil(response.pagination.total / scenariosPerPage));

      // If current page is empty and not the first page, go to previous page
      if (response.scenarios.length === 0 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      console.error('Error deleting scenario:', err);
      alert('Failed to delete scenario. Please try again.');
    }
  };

  const handleGenerateSimilar = async (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) {
      customAlert('Scenario not found. Please try again.', 'Error');
      return;
    }

    try {
      // Fetch the full scenario data for the modal
      const fullScenario = await fetchScenarioById(scenarioId);

      setScenarioToSimilar(scenario);
      setFullScenarioForModal(fullScenario);
      setShowGenerateSimilarModal(true);
    } catch (error) {
      console.error('Error fetching full scenario:', error);
      customAlert('Failed to load scenario details. Please try again.', 'Error');
    }
  };

  const handleAbortGeneration = () => {
    setShowGeneratingModal(false);
    setCurrentScenarioIndex(1);
    setTotalScenariosToGenerate(1);
    setIsRetrying(false);
    setRetryCount(0);
  };

  const handleProgressUpdate = (progress: GenerationProgress) => {
    setCurrentScenarioIndex(progress.currentIndex);
    setTotalScenariosToGenerate(progress.totalCount);
    setIsRetrying(progress.isRetrying);
    setRetryCount(progress.retryCount);
  };


  const handleGenerateSimilarConfirm = async (selections: ScenarioSelections) => {
    if (!scenarioToSimilar || !fullScenarioForModal) return;
    
    try {
      setShowGeneratingModal(true);
      setCurrentScenarioIndex(1);
      setTotalScenariosToGenerate(selections.count);
      setIsRetrying(false);
      setRetryCount(0);
      
      const fullScenario = fullScenarioForModal;
      
      // Convert ScenarioSelections to service format
      const serviceSelections: ServiceScenarioSelections = {
        retainCharacters: selections.retainCharacters,
        retainLocations: selections.retainLocations,
        retainNotes: selections.retainNotes,
        selectedCharacters: selections.selectedCharacters,
        selectedLocations: selections.selectedLocations,
        count: selections.count
      };
      
      // Generate scenarios using the service
      const createdScenarios = await generateSimilarScenarios(
        fullScenario,
        serviceSelections,
        handleProgressUpdate,
        handleAbortGeneration
      );
      
      setShowGeneratingModal(false);
      
      // Navigate based on the number of scenarios generated
      if (selections.count === 1) {
        // Single scenario: open in editor
        navigate(`/app?scenario=${createdScenarios[0].id}`);
      } else {
        // Multiple scenarios: reload scenarios list to show new ones
        setCurrentPage(1); // Reset to first page to see new scenarios
        const offset = 0;
        const response = await fetchRecentScenarios(scenariosPerPage, offset);
        setScenarios(response.scenarios);
        setTotalScenarios(response.pagination.total);
        setTotalPages(Math.ceil(response.pagination.total / scenariosPerPage));
      }
      
    } catch (error) {
      console.error('Error generating similar scenario:', error);
      setShowGeneratingModal(false);
      
      if (error instanceof Error && error.message === 'Generation was aborted') {
        // Don't show error for aborted operations
        return;
      }
      
      customAlert(
        error instanceof Error ? error.message : 'Failed to generate similar scenario. Please try again.',
        'Error'
      );
    } finally {
      setCurrentScenarioIndex(1);
      setTotalScenariosToGenerate(1);
      setIsRetrying(false);
      setRetryCount(0);
    }
  };


  const handleCloseSimilarModal = () => {
    setShowGenerateSimilarModal(false);
    setScenarioToSimilar(null);
    setFullScenarioForModal(null);
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
                      ({totalScenarios} scenarios total)
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

          <GenerateSimilarModal
            isOpen={showGenerateSimilarModal}
            onClose={handleCloseSimilarModal}
            onGenerate={handleGenerateSimilarConfirm}
            scenarioTitle={scenarioToSimilar?.title || ''}
            characters={fullScenarioForModal?.characters?.map(c => ({ name: c.name || 'Unnamed', id: c.id })) || []}
            locations={fullScenarioForModal?.locations?.map(l => ({ name: l.name || 'Unnamed', id: l.id || '' })) || []}
          />

          <GeneratingModal
            isOpen={showGeneratingModal}
            currentIndex={currentScenarioIndex}
            totalCount={totalScenariosToGenerate}
            isRetrying={isRetrying}
            retryCount={retryCount}
            onAbort={handleAbortGeneration}
          />

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
