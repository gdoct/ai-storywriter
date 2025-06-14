import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
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
  const { username, email } = useAuth();
  const navigate = useNavigate();
  
  // State for dashboard data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentScenarios, setRecentScenarios] = useState<RecentScenario[]>([]);
  const [recentStories, setRecentStories] = useState<RecentStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const quickActions = [
    { title: 'New Scenario', icon: '✏️', link: '/app', description: 'Start writing a new scenario' },
    { title: 'Browse Scenarios', icon: '📚', link: '/scenarios', description: 'View your scenario collection' },
    { title: 'Browse Stories', icon: '📚', link: '/stories', description: 'View your generated story collection' },
    { title: 'Buy Credits', icon: '💳', link: '/buy-credits', description: 'Purchase credits for premium features' },
    { title: 'Settings', icon: '⚙️', link: '/settings', description: 'Configure AI models and preferences' },
    { title: 'Templates', icon: '📝', link: '/templates', description: 'Browse scenario templates' },
  ];

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
          <Link to="/app" className="btn btn-primary btn-large">
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
                  <div key={scenario.id} className="story-card">
                    <div className="story-info">
                      <h4 className="story-title">{scenario.title}</h4>
                      <div className="story-meta">
                        <span className="story-date">{formatRelativeTime(scenario.created)}</span>
                        <span className="story-words">{scenario.generatedStoryCount} generated stories</span>
                      </div>
                    </div>
                    <div className="story-actions">
                      <button 
                        className="btn btn-text"
                        onClick={() => handleEditScenario(scenario.id)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-text"
                        onClick={() => handleDeleteScenario(scenario.id, scenario.title)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
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
                    <div key={story.id} className="story-card">
                      <div className="story-info">
                        <h4 className="story-title">{story.scenarioTitle}</h4>
                        <div className="story-meta">
                          <span className="story-date">{formatRelativeTime(story.created)}</span>
                          <span className="story-words">{story.wordCount} words</span>
                        </div>
                      </div>
                      <div className="story-actions">
                        <button 
                          className="btn btn-text"
                          onClick={() => handleReadStory(story)}
                        >
                          Read
                        </button>
                        <button className="btn btn-text">Publish</button>
                      </div>
                    </div>
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


              <div className="quick-actions-section">
                <h3>Quick Actions</h3>
                <div className="quick-actions-grid">
                  {quickActions.map((action, index) => (
                    <Link key={index} to={action.link} className="quick-action-card">
                      <div className="action-icon">{action.icon}</div>
                      <div className="action-content">
                        <h4 className="action-title">{action.title}</h4>
                        <p className="action-description">{action.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      );
};

      export default Dashboard;
