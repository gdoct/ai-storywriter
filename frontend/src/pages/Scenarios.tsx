import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ConfirmModal } from '../components/Modal';
import { useModals } from '../hooks/useModals';
import { deleteScenario, fetchRecentScenarios, formatRelativeTime, RecentScenario } from '../services/dashboardService';
import './Scenarios.css';

const Scenarios: React.FC = () => {
  const navigate = useNavigate();
  const { confirmState, hideConfirm, customConfirm } = useModals();
  const [scenarios, setScenarios] = useState<RecentScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalScenarios, setTotalScenarios] = useState(0);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
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
        
        <div className="search-bar-container" style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
          <div className="search-bar-wrapper">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="🔍 Search scenarios..."
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

        <div className="scenarios-content">
          {filteredScenarios.length > 0 ? (
            <>
              <div className="scenarios-grid">
                {filteredScenarios.map(scenario => (
                  <div key={scenario.id} className="scenario-card">
                    <div className="scenario-content">
                      <div className="scenario-header">
                        <h3 className="scenario-title">{scenario.title}</h3>
                      </div>
                      
                      <div className="scenario-stats">
                        <span className="stat">
                          <strong>{scenario.generatedStoryCount}</strong> generated stories
                        </span>
                      </div>
                      
                      <div className="scenario-meta">
                        <span className="scenario-date">
                          Created {formatRelativeTime(scenario.created)}
                        </span>
                        <span className="scenario-separator">•</span>
                        <span className="scenario-modified">
                          Modified {formatRelativeTime(scenario.lastModified)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="scenario-actions">
                      <button 
                        className="btn btn-primary btn-small scenarios__btn-edit-scenario"
                        onClick={() => handleEditScenario(scenario.id)}
                      >
                        <span className="btn-icon">✏️</span>
                        Edit
                      </button>
                      <Link 
                        to={`/stories?scenario=${scenario.id}`} 
                        className="btn btn-text btn-small"
                      >
                        <span className="btn-icon">📚</span>
                        View Stories
                      </Link>
                      <button 
                        className="btn btn-text delete-btn btn-small"
                        onClick={() => handleDeleteScenario(scenario.id, scenario.title)}
                        title="Delete scenario"
                      >
                        <span className="btn-icon">🗑️</span>
                        Delete
                      </button>
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
      </div>
    </div>
  );
};

export default Scenarios;
