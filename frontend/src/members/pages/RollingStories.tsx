/**
 * Rolling Stories Page - Interactive story generation with choices
 * Shows scenarios grouped by their rolling stories
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@drdata/ai-styles';
import { useModals } from '@shared/hooks/useModals';
import { Modal, AlertModal, ConfirmModal } from '@shared/components/Modal';
import {
  RollingStory,
  fetchRollingStories,
  deleteRollingStory,
} from '@shared/services/rollingStoriesService';
import { fetchAllScenarios } from '@shared/services/scenario';
import './RollingStories.css';

// Simple type for scenario list items
interface ScenarioListItem {
  id: string;
  title: string;
  synopsis?: string;
  imageUrl?: string;
}

// Grouped scenario with its rolling stories
interface ScenarioWithStories {
  scenario: ScenarioListItem;
  stories: RollingStory[];
}

const RollingStories = () => {
  const navigate = useNavigate();
  const { alertState, confirmState, hideAlert, hideConfirm, customAlert, customConfirm } = useModals();

  // State
  const [scenariosWithStories, setScenariosWithStories] = useState<ScenarioWithStories[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewStoryModal, setShowNewStoryModal] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [newStoryTitle, setNewStoryTitle] = useState('');

  // Expanded scenario state - which scenario's stories are being viewed
  const [expandedScenarioId, setExpandedScenarioId] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [storiesData, scenariosData] = await Promise.all([
        fetchRollingStories(),
        fetchAllScenarios(),
      ]);

      // Group stories by scenario
      const storiesByScenario = new Map<string, RollingStory[]>();
      storiesData.forEach(story => {
        const existing = storiesByScenario.get(story.scenario_id) || [];
        existing.push(story);
        storiesByScenario.set(story.scenario_id, existing);
      });

      // Create grouped data - only scenarios that have rolling stories
      const grouped: ScenarioWithStories[] = [];
      storiesByScenario.forEach((stories, scenarioId) => {
        const scenario = scenariosData.find(s => s.id === scenarioId);
        if (scenario) {
          // Sort stories by updated_at descending
          stories.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
          grouped.push({ scenario, stories });
        }
      });

      // Sort grouped by most recent story activity
      grouped.sort((a, b) => {
        const aLatest = a.stories[0]?.updated_at || '';
        const bLatest = b.stories[0]?.updated_at || '';
        return new Date(bLatest).getTime() - new Date(aLatest).getTime();
      });

      setScenariosWithStories(grouped);
      setScenarios(scenariosData);
    } catch (error) {
      console.error('Error loading data:', error);
      customAlert('Failed to load rolling stories', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStory = async (storyId: number, scenarioId: string) => {
    const confirmed = await customConfirm(
      'Are you sure you want to delete this story? This action cannot be undone.',
      {
        title: 'Delete Story',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        variant: 'danger'
      }
    );

    if (confirmed) {
      try {
        await deleteRollingStory(storyId);
        // Update the grouped data
        setScenariosWithStories(prev => {
          return prev.map(group => {
            if (group.scenario.id === scenarioId) {
              const updatedStories = group.stories.filter(s => s.id !== storyId);
              // If no stories left, remove the entire group
              if (updatedStories.length === 0) {
                return null;
              }
              return { ...group, stories: updatedStories };
            }
            return group;
          }).filter(Boolean) as ScenarioWithStories[];
        });
      } catch (error) {
        console.error('Error deleting story:', error);
        customAlert('Failed to delete story', 'Error');
      }
    }
  };

  const handleStartNewStory = () => {
    if (!selectedScenario || !newStoryTitle.trim()) {
      customAlert('Please select a scenario and enter a title', 'Error');
      return;
    }

    // Navigate to the story player with the scenario ID and title
    navigate(`/rolling-story/new`, {
      state: {
        scenarioId: selectedScenario,
        title: newStoryTitle.trim(),
      },
    });
  };

  const handleContinueStory = (storyId: number) => {
    navigate(`/rolling-story/${storyId}`);
  };

  const handleScenarioClick = (scenarioId: string) => {
    setExpandedScenarioId(expandedScenarioId === scenarioId ? null : scenarioId);
  };

  const getStatusBadge = (status: RollingStory['status']) => {
    const badges: Record<string, { className: string; label: string }> = {
      draft: { className: 'status-draft', label: 'Draft' },
      in_progress: { className: 'status-in-progress', label: 'In Progress' },
      completed: { className: 'status-completed', label: 'Completed' },
      abandoned: { className: 'status-abandoned', label: 'Abandoned' },
    };
    const badge = badges[status] || badges.draft;
    return <span className={`status-badge ${badge.className}`}>{badge.label}</span>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStoryCountLabel = (count: number) => {
    if (count === 1) return '1 story';
    return `${count} stories`;
  };

  if (loading) {
    return (
      <div className="rolling-stories-page">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading stories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rolling-stories-page">
      {/* Header */}
      <header className="rolling-stories-header">
        <div className="header-content">
          <h1>Rolling Stories</h1>
          <p className="header-subtitle">
            Interactive stories that evolve with your choices
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowNewStoryModal(true)}
        >
          Start New Story
        </Button>
      </header>

      {/* Scenarios with Stories */}
      {scenariosWithStories.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📖</div>
          <h2>No Rolling Stories Yet</h2>
          <p>Start your first interactive story adventure!</p>
          <Button variant="primary" onClick={() => setShowNewStoryModal(true)}>
            Create Your First Story
          </Button>
        </div>
      ) : (
        <div className="scenarios-list">
          {scenariosWithStories.map(({ scenario, stories }) => (
            <div key={scenario.id} className="scenario-group">
              {/* Scenario Header - Clickable */}
              <div
                className={`scenario-header ${expandedScenarioId === scenario.id ? 'expanded' : ''}`}
                onClick={() => handleScenarioClick(scenario.id)}
              >
                <div className="scenario-info">
                  {scenario.imageUrl && (
                    <img
                      src={scenario.imageUrl}
                      alt={scenario.title}
                      className="scenario-thumbnail"
                    />
                  )}
                  <div className="scenario-details">
                    <h3 className="scenario-title">{scenario.title || 'Untitled Scenario'}</h3>
                    <span className="story-count">{getStoryCountLabel(stories.length)}</span>
                  </div>
                </div>
                <div className="scenario-actions">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setSelectedScenario(scenario.id);
                      setNewStoryTitle('');
                      setShowNewStoryModal(true);
                    }}
                  >
                    New Story
                  </Button>
                  <span className={`expand-icon ${expandedScenarioId === scenario.id ? 'expanded' : ''}`}>
                    ▼
                  </span>
                </div>
              </div>

              {/* Stories List - Expandable */}
              {expandedScenarioId === scenario.id && (
                <div className="stories-list">
                  {stories.map((story) => (
                    <Card key={story.id} className="story-card story-card-compact">
                      <div className="story-card-header">
                        <h4 className="story-title">{story.title}</h4>
                        {getStatusBadge(story.status)}
                      </div>
                      <div className="story-card-meta">
                        <span className="meta-item">
                          📝 {story.paragraph_count || 0} paragraphs
                        </span>
                        <span className="meta-item">
                          📅 {formatDate(story.updated_at)}
                        </span>
                      </div>
                      <div className="story-card-actions">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleContinueStory(story.id)}
                        >
                          {story.status === 'draft' ? 'Start' : story.status === 'completed' ? 'Read' : 'Continue'}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDeleteStory(story.id, scenario.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Story Modal */}
      <Modal
        isOpen={showNewStoryModal}
        onClose={() => {
          setShowNewStoryModal(false);
          setSelectedScenario(null);
          setNewStoryTitle('');
        }}
        title="Start New Rolling Story"
      >
        <div className="new-story-form">
          <div className="form-group">
            <label htmlFor="story-title">Story Title</label>
            <input
              id="story-title"
              type="text"
              value={newStoryTitle}
              onChange={(e) => setNewStoryTitle(e.target.value)}
              placeholder="Enter a title for your story"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="scenario-select">Select a Scenario</label>
            {scenarios.length === 0 ? (
              <p className="no-scenarios">
                No scenarios available.{' '}
                <a href="/scenarios">Create one first</a>.
              </p>
            ) : (
              <select
                id="scenario-select"
                value={selectedScenario || ''}
                onChange={(e) => setSelectedScenario(e.target.value)}
                className="form-select"
              >
                <option value="">Choose a scenario...</option>
                {scenarios.map((scenario) => (
                  <option key={scenario.id} value={scenario.id}>
                    {scenario.title || 'Untitled Scenario'}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="modal-actions">
            <Button variant="secondary" onClick={() => {
              setShowNewStoryModal(false);
              setSelectedScenario(null);
              setNewStoryTitle('');
            }}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleStartNewStory}
              disabled={!selectedScenario || !newStoryTitle.trim()}
            >
              Start Story
            </Button>
          </div>
        </div>
      </Modal>

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertState.isOpen}
        onClose={hideAlert}
        message={alertState.message}
        title={alertState.title}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={hideConfirm}
        onConfirm={confirmState.onConfirm}
        message={confirmState.message}
        title={confirmState.title}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant}
      />
    </div>
  );
};

export default RollingStories;
