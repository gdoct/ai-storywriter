/**
 * Long Stories Page - Chapter-based story generation
 * Shows all long stories grouped by scenario
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@drdata/ai-styles';
import { useModals } from '@shared/hooks/useModals';
import { Modal, AlertModal, ConfirmModal } from '@shared/components/Modal';
import {
  LongStoryListItem,
  fetchLongStories,
  deleteLongStory,
} from '@shared/services/longStoriesService';
import { fetchAllScenarios } from '@shared/services/scenario';
import './LongStories.css';

interface ScenarioListItem {
  id: string;
  title: string;
  synopsis?: string;
  imageUrl?: string;
}

interface ScenarioWithStories {
  scenario: ScenarioListItem;
  stories: LongStoryListItem[];
}

const LongStories = () => {
  const navigate = useNavigate();
  const { alertState, confirmState, hideAlert, hideConfirm, customAlert, customConfirm } = useModals();

  const [scenariosWithStories, setScenariosWithStories] = useState<ScenarioWithStories[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewStoryModal, setShowNewStoryModal] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [newStoryTitle, setNewStoryTitle] = useState('');
  const [expandedScenarioId, setExpandedScenarioId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [storiesData, scenariosData] = await Promise.all([
        fetchLongStories(),
        fetchAllScenarios(),
      ]);

      const storiesByScenario = new Map<string, LongStoryListItem[]>();
      storiesData.forEach(story => {
        const existing = storiesByScenario.get(story.scenario_id) || [];
        existing.push(story);
        storiesByScenario.set(story.scenario_id, existing);
      });

      const grouped: ScenarioWithStories[] = [];
      storiesByScenario.forEach((stories, scenarioId) => {
        const scenario = scenariosData.find(s => s.id === scenarioId);
        if (scenario) {
          stories.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
          grouped.push({ scenario, stories });
        }
      });

      grouped.sort((a, b) => {
        const aLatest = a.stories[0]?.updated_at || '';
        const bLatest = b.stories[0]?.updated_at || '';
        return new Date(bLatest).getTime() - new Date(aLatest).getTime();
      });

      setScenariosWithStories(grouped);
      setScenarios(scenariosData);
    } catch (error) {
      console.error('Error loading long stories:', error);
      customAlert('Failed to load stories', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStory = async (storyId: number, scenarioId: string) => {
    const confirmed = await customConfirm(
      'Are you sure you want to delete this story? This action cannot be undone.',
      { title: 'Delete Story', confirmText: 'Delete', cancelText: 'Cancel', variant: 'danger' }
    );
    if (confirmed) {
      try {
        await deleteLongStory(storyId);
        setScenariosWithStories(prev =>
          prev.map(group => {
            if (group.scenario.id !== scenarioId) return group;
            const updatedStories = group.stories.filter(s => s.id !== storyId);
            if (updatedStories.length === 0) return null;
            return { ...group, stories: updatedStories };
          }).filter(Boolean) as ScenarioWithStories[]
        );
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
    navigate(`/long-story/new`, {
      state: { scenarioId: selectedScenario, title: newStoryTitle.trim() },
    });
  };

  const handleOpenStory = (storyId: number) => {
    navigate(`/long-story/${storyId}`);
  };

  const getStatusBadge = (status: LongStoryListItem['status']) => {
    const badges: Record<string, { className: string; label: string }> = {
      draft: { className: 'status-draft', label: 'Draft' },
      in_progress: { className: 'status-in-progress', label: 'In Progress' },
      completed: { className: 'status-completed', label: 'Completed' },
      abandoned: { className: 'status-abandoned', label: 'Abandoned' },
    };
    const badge = badges[status] || badges.draft;
    return <span className={`status-badge ${badge.className}`}>{badge.label}</span>;
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });

  const getStoryCountLabel = (count: number) =>
    count === 1 ? '1 story' : `${count} stories`;

  if (loading) {
    return (
      <div className="long-stories-page">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading stories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="long-stories-page">
      <header className="long-stories-header">
        <div className="header-content">
          <h1>Long Stories</h1>
          <p className="header-subtitle">Complete chapter-based stories generated from your scenarios</p>
        </div>
        <Button variant="primary" onClick={() => setShowNewStoryModal(true)}>
          Generate New Story
        </Button>
      </header>

      {scenariosWithStories.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h2>No Long Stories Yet</h2>
          <p>Generate your first complete chapter-based story from a scenario!</p>
          <Button variant="primary" onClick={() => setShowNewStoryModal(true)}>
            Generate Your First Story
          </Button>
        </div>
      ) : (
        <div className="scenarios-list">
          {scenariosWithStories.map(({ scenario, stories }) => (
            <div key={scenario.id} className="scenario-group">
              <div
                className={`scenario-header ${expandedScenarioId === scenario.id ? 'expanded' : ''}`}
                onClick={() => setExpandedScenarioId(expandedScenarioId === scenario.id ? null : scenario.id)}
              >
                <div className="scenario-info">
                  {scenario.imageUrl && (
                    <img src={scenario.imageUrl} alt={scenario.title} className="scenario-thumbnail" />
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
                  <span className={`expand-icon ${expandedScenarioId === scenario.id ? 'expanded' : ''}`}>▼</span>
                </div>
              </div>

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
                          {story.chapter_count || 0} chapter{story.chapter_count !== 1 ? 's' : ''}
                        </span>
                        <span className="meta-item">{formatDate(story.updated_at)}</span>
                      </div>
                      <div className="story-card-actions">
                        <Button variant="primary" size="sm" onClick={() => handleOpenStory(story.id)}>
                          {story.status === 'completed' ? 'Read' : story.status === 'draft' ? 'Generate' : 'Continue'}
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => handleDeleteStory(story.id, scenario.id)}>
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

      <Modal
        isOpen={showNewStoryModal}
        onClose={() => { setShowNewStoryModal(false); setSelectedScenario(null); setNewStoryTitle(''); }}
        title="Generate New Long Story"
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
                No scenarios available. <a href="/scenarios">Create one first</a>.
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
            <Button variant="secondary" onClick={() => { setShowNewStoryModal(false); setSelectedScenario(null); setNewStoryTitle(''); }}>
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

      <AlertModal isOpen={alertState.isOpen} onClose={hideAlert} message={alertState.message} title={alertState.title} />
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

export default LongStories;
