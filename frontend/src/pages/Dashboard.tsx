import React, { Dispatch, SetStateAction } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import './Dashboard.css';

interface DashboardProps {
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  seed?: number | null;
}

const Dashboard: React.FC<DashboardProps> = ({ setIsLoading }) => {
  const { username } = useAuth();

  const stats = {
    scenariosCreated: 12,
    storiesGenerated: 14,
    modelsUsed: 3,
    lastActivity: '2 hours ago'
  };

  const recentScenarios = [
    { id: 1, title: 'The Mysterious Garden', created: '2 days ago', generatedStoryCount: 3 },
    { id: 2, title: 'Space Adventure Chronicles', created: '1 week ago', generatedStoryCount: 4 },
    { id: 3, title: 'Detective in the Rain', created: '2 weeks ago', generatedStoryCount: 7 },
  ];

  const recentStories = [
    { id: 1, title: 'The Mysterious Garden', created: '2 days ago', wordCount: 3150, rating: 4.5 },
    { id: 2, title: 'The Mysterious Garden', created: '2 days ago', wordCount: 2850, rating: 2.0 },
    { id: 3, title: 'The Mysterious Garden', created: '2 days ago', wordCount: 4950, rating: 3.5 },
    { id: 4, title: 'Space Adventure Chronicles', created: '1 week ago', wordCount: 4200, rating: 4.0 },
  ];


  const quickActions = [
    { title: 'New Scenario', icon: '✏️', link: '/app', description: 'Start writing a new scenario' },
    { title: 'Browse Scenarios', icon: '📚', link: '/scenarios', description: 'View your scenario collection' },
    { title: 'Browse Stories', icon: '📚', link: '/stories', description: 'View your generated story collection' },
    { title: 'Buy Credits', icon: '💳', link: '/buy-credits', description: 'Purchase credits for premium features' },
    { title: 'Settings', icon: '⚙️', link: '/settings', description: 'Configure AI models and preferences' },
    { title: 'Templates', icon: '📝', link: '/templates', description: 'Browse scenario templates' },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="welcome-section">
            <h1>Welcome back, {username}!</h1>
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
              <div className="stat-card">
                <div className="stat-icon">⏰</div>
                <div className="stat-content">
                  <div className="stat-number">{stats.lastActivity}</div>
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
                        <span className="story-date">{scenario.created}</span>
                        <span className="story-words">{scenario.generatedStoryCount} words</span>
                      </div>
                    </div>
                    <div className="story-actions">
                      <button className="btn btn-text">Edit</button>
                      <button className="btn btn-text">View</button>
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
                        <h4 className="story-title">{story.title}</h4>
                        <div className="story-meta">
                          <span className="story-date">{story.created}</span>
                          <span className="story-words">{story.wordCount} words</span>
                        </div>
                      </div>
                      <div className="story-actions">
                        <button className="btn btn-text">Edit</button>
                        <button className="btn btn-text">View</button>
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
