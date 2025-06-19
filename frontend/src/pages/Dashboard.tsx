import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardCard from '../components/DashboardCard';
import MarketingFooter from '../components/marketing/MarketingFooter';
import PublishStoryModal from '../components/PublishStoryModal';
import { useAuth } from '../contexts/AuthContext';
import {
  DashboardStats,
  deleteScenario,
  fetchDashboardStats,
  fetchRecentScenarios,
  fetchRecentStories,
  formatRelativeTime,
  RecentScenario,
  RecentStory
} from '../services/dashboardService';
import './Dashboard.css';

interface DashboardProps {
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  seed?: number | null;
}

const Dashboard: React.FC<DashboardProps> = ({ setIsLoading }) => {
  const { userProfile } = useAuth();
  const username = userProfile?.username;
  const email = userProfile?.email;
  const navigate = useNavigate();
  
  // State for dashboard data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentScenarios, setRecentScenarios] = useState<RecentScenario[]>([]);
  const [recentStories, setRecentStories] = useState<RecentStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Publish modal state
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [storyToPublish, setStoryToPublish] = useState<RecentStory | null>(null);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setIsLoading(true);
        
        // Fetch all dashboard data in parallel
        const [statsData, scenariosData, storiesData] = await Promise.all([
          fetchDashboardStats(),
          fetchRecentScenarios(5, 0),
          fetchRecentStories(4, 0)
        ]);
        
        setStats(statsData);
        setRecentScenarios(scenariosData.scenarios);
        setRecentStories(storiesData.stories);
        setError(null);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data. Please try refreshing the page.');
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [setIsLoading]);

  const handleEditScenario = (scenarioId: string) => {
    // Navigate to the scenario editor with the specific scenario ID
    navigate(`/app?scenario=${scenarioId}`);
  };

  const handleDeleteScenario = async (scenarioId: string, scenarioTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${scenarioTitle}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await deleteScenario(scenarioId);
      
      // Reload dashboard data
      const [statsData, scenariosData, storiesData] = await Promise.all([
        fetchDashboardStats(),
        fetchRecentScenarios(5, 0),
        fetchRecentStories(4, 0)
      ]);
      
      setStats(statsData);
      setRecentScenarios(scenariosData.scenarios);
      setRecentStories(storiesData.stories);
    } catch (err) {
      console.error('Error deleting scenario:', err);
      alert('Failed to delete scenario. Please try again.');
    }
  };

  const handleReadStory = async (story: RecentStory) => {
    // Navigate to Stories page and open the story modal
    navigate('/stories', { state: { openStoryId: story.id } });
  };

  const handlePublishStory = (story: RecentStory) => {
    setStoryToPublish(story);
    setShowPublishModal(true);
  };

  const handlePublishSuccess = () => {
    alert('Story published successfully! It will appear in the marketplace once AI processing is complete.');
    setShowPublishModal(false);
    setStoryToPublish(null);
  };

  const handleClosePublishModal = () => {
    setShowPublishModal(false);
    setStoryToPublish(null);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard-container">
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

  // Show main dashboard (stats should be loaded at this point)
  if (!stats) {
    return null;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="welcome-section">
            <h1>Welcome back, {username || email || 'User'}!</h1>
            <p>Ready to create some amazing stories today?</p>
          </div>
          <Link to="/app" className="btn btn-primary btn-large" data-testid="start-writing-link">
            <span className="btn-icon">✏️</span>
            Start Writing
          </Link>
        </header>

        <div className="dashboard-content">
          <div className="stats-section">
            <h2>Your Writing Stats</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📖</div>
                <div className="stat-content">
                  <div className="stat-number">{stats.scenariosCreated}</div>
                  <div className="stat-label">Scenarios Created</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✍️</div>
                <div className="stat-content">
                  <div className="stat-number">{stats.storiesGenerated.toLocaleString()}</div>
                  <div className="stat-label">Stories generated</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🤖</div>
                <div className="stat-content">
                  <div className="stat-number">{stats.modelsUsed}</div>
                  <div className="stat-label">AI Models Used</div>
                </div>
              </div>
            </div>
             <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">✍️</div>
                <div className="stat-content">
                  <div className="stat-number">{stats.storiesPublished}</div>
                  <div className="stat-label">Stories published</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🤖</div>
                <div className="stat-content">
                  <div className="stat-number">{stats.scenariosPublished}</div>
                  <div className="stat-label">Scenarios published</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏰</div>
                <div className="stat-content">
                  <div className="stat-number">{formatRelativeTime(stats.lastActivity)}</div>
                  <div className="stat-label">Last Activity</div>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-main">
            <div className="recent-stories-section">
              <div className="section-header">
                <h3>Recent Scenarios</h3>
                <Link to="/scenarios" className="btn btn-secondary btn-small">View All</Link>
              </div>
              <div className="stories-list">
                {recentScenarios.map(scenario => (
                  <DashboardCard
                    key={scenario.id}
                    title={scenario.title}
                    metadata={[
                      { icon: "📅", text: formatRelativeTime(scenario.lastModified) },
                      { icon: "📝", text: `${scenario.generatedStoryCount} generated stories` }
                    ]}
                    actions={[
                      {
                        label: "Delete",
                        onClick: () => handleDeleteScenario(scenario.id, scenario.title),
                        variant: "warning"
                      },
                      {
                        label: "Edit",
                        onClick: () => handleEditScenario(scenario.id),
                        variant: "text"
                      },
                    ]}
                  />
                ))}
                {recentScenarios.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon">📝</div>
                    <h4>No scenarios yet</h4>
                    <p>Create your first scenario to get started!</p>
                    <Link to="/app" className="btn btn-primary">Start Writing</Link>
                  </div>
                )}
              </div>
            </div>

            <div className="recent-stories-section">
                <div className="section-header">
                  <h3>Recent Generated Stories</h3>
                  <Link to="/stories" className="btn btn-secondary btn-small">View All</Link>
                </div>
                <div className="stories-list">
                  {recentStories.map(story => (
                    <DashboardCard
                      key={story.id}
                      title={story.scenarioTitle}
                      metadata={[
                        { icon: "📅", text: formatRelativeTime(story.created) },
                        { icon: "📝", text: `${story.wordCount} words` }
                      ]}
                      actions={[
                        ...(story.isPublished ? [] : [{
                          label: "Publish",
                          onClick: () => handlePublishStory(story),
                          variant: "secondary" as const
                        }]),
                        {
                          label: "Read",
                          onClick: () => handleReadStory(story),
                          variant: "primary" as const
                        },
                      ]}
                    />
                  ))}
                  {recentStories.length === 0 && (
                    <div className="empty-state">
                      <div className="empty-icon">📝</div>
                      <h4>You haven't generated any stories yet</h4>
                      <p>Create your first scenario to get started!</p>
                      <Link to="/app" className="btn btn-primary">Start Writing</Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <MarketingFooter />

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
      </div>
    );
};

export default Dashboard;
