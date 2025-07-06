/**
 * Moderation Dashboard Component
 * Provides interface for moderators and admins to manage content and users
 */

import { Hero } from '@drdata/ai-styles';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useModals } from '../../hooks/useModals';
import http from '../../services/http';
import { ModerationDashboard as ModerationDashboardData } from '../../types/auth';
import { AlertModal, ConfirmModal } from '../Modal';
import { ModeratorOnly } from '../PermissionGate';
import './ModerationDashboard.css';

export const ModerationDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const { alertState, confirmState, hideAlert, hideConfirm, customAlert, customConfirm } = useModals();
  const [dashboardData, setDashboardData] = useState<ModerationDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await http.get<ModerationDashboardData>('/api/moderate/dashboard');
      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch moderation dashboard:', err);
      setError('Failed to load moderation dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="moderation-dashboard">
        <div className="loading">Loading moderation dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="moderation-dashboard">
        <div className="error">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={fetchDashboardData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <ModeratorOnly fallback={<div>Access denied. Moderator permissions required.</div>}>
      <div className="moderation-dashboard">
        <Hero title='Moderation Dashboard' className="moderation-hero">
          <div className="user-info">
            <span>Welcome, {userProfile?.username}</span>
            <div className="user-roles">
              {userProfile?.roles.map(role => (
                <span key={role} className={`role-badge role-${role}`}>
                  {role}
                </span>
              ))}
            </div>
          </div>
        </Hero>

        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Recent Stories</h3>
            <div className="stat-number">{dashboardData?.recent_stories.length || 0}</div>
            <p>Stories published today</p>
          </div>
          
          <div className="stat-card warning">
            <h3>Flagged Content</h3>
            <div className="stat-number">{dashboardData?.flagged_content_count || 0}</div>
            <p>Items awaiting review</p>
          </div>
          
          <div className="stat-card info">
            <h3>Pending Reports</h3>
            <div className="stat-number">{dashboardData?.pending_reports || 0}</div>
            <p>User reports to process</p>
          </div>
        </div>

        <div className="dashboard-sections">
          <div className="section">
            <h2>Recent Stories</h2>
            <div className="stories-list">
              {dashboardData?.recent_stories.length === 0 ? (
                <p>No recent stories</p>
              ) : (
                dashboardData?.recent_stories.map((story: any) => (
                  <div key={story.id} className="story-item">
                    <div className="story-info">
                      <h4>{story.title}</h4>
                      <p>By: {story.author_username}</p>
                      <span className="story-date">{new Date(story.published_at).toLocaleDateString()}</span>
                    </div>
                    <div className="story-actions">
                      <button 
                        className="btn btn-small btn-secondary"
                        onClick={() => window.open(`/marketplace/story/${story.id}`, '_blank')}
                      >
                        View
                      </button>
                      <button 
                        className="btn btn-small btn-warning"
                        onClick={() => handleFlagStory(story.id)}
                      >
                        Flag
                      </button>
                      <button 
                        className="btn btn-small btn-danger"
                        onClick={() => handleRemoveStory(story.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="section">
            <h2>Recent Moderation Actions</h2>
            <div className="actions-list">
              {dashboardData?.recent_actions.length === 0 ? (
                <p>No recent moderation actions</p>
              ) : (
                dashboardData?.recent_actions.map((action) => (
                  <div key={action.id} className="action-item">
                    <div className="action-info">
                      <span className={`action-type action-${action.type}`}>
                        {action.type.replace('_', ' ')}
                      </span>
                      <p>
                        <strong>{action.moderator_username}</strong> {action.type.replace('_', ' ')} 
                        {action.target_type} {action.target_id}
                      </p>
                      <p className="action-reason">Reason: {action.reason}</p>
                      <span className="action-date">
                        {new Date(action.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

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
    </ModeratorOnly>
  );

  // Moderation action handlers
  async function handleFlagStory(storyId: number) {
    const reason = window.prompt('Enter reason for flagging this story:');
    if (!reason) return;

    try {
      await http.post(`/api/moderate/stories/${storyId}/flag`, { reason });
      customAlert('Story flagged successfully', 'Success');
      fetchDashboardData(); // Refresh dashboard
    } catch (error) {
      console.error('Failed to flag story:', error);
      customAlert('Failed to flag story', 'Error');
    }
  }

  async function handleRemoveStory(storyId: number) {
    const reason = window.prompt('Enter reason for removing this story:');
    if (!reason) return;

    const confirmed = await customConfirm(
      'Are you sure you want to remove this story? This action cannot be undone.',
      {
        title: 'Confirm Remove Story',
        confirmText: 'Remove',
        cancelText: 'Cancel',
        variant: 'danger'
      }
    );

    if (!confirmed) {
      return;
    }

    try {
      await http.delete(`/api/moderate/stories/${storyId}`, { data: { reason } });
      customAlert('Story removed successfully', 'Success');
      fetchDashboardData(); // Refresh dashboard
    } catch (error) {
      console.error('Failed to remove story:', error);
      customAlert('Failed to remove story', 'Error');
    }
  }
};
