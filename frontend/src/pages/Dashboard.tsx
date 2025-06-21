import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DashboardHeader,
  RecentGeneratedStories,
  RecentScenarios,
  WritingStats
} from '../components/Dashboard';
import MarketingFooter from '../components/marketing/MarketingFooter';
import { AlertModal, ConfirmModal } from '../components/Modal';
import PublishStoryModal from '../components/Story/PublishStoryModal';
import { useAuth } from '../contexts/AuthContext';
import { useModals } from '../hooks/useModals';
import {
  DashboardStats,
  deleteScenario,
  fetchDashboardStats,
  fetchRecentScenarios,
  fetchRecentStories,
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
  const { alertState, confirmState, hideAlert, hideConfirm, customAlert, customConfirm } = useModals();
  
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
      customAlert('Failed to delete scenario. Please try again.', 'Error');
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
    customAlert('Story published successfully! It will appear in the marketplace once AI processing is complete.', 'Success');
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
        <DashboardHeader username={username} email={email} />

        <div className="dashboard-content">
          <WritingStats stats={stats} />

          <div className="dashboard-main">
            <RecentScenarios 
              recentScenarios={recentScenarios} 
              handleEditScenario={handleEditScenario} 
            />
            <RecentGeneratedStories 
              recentStories={recentStories} 
              handlePublishStory={handlePublishStory} 
              handleReadStory={handleReadStory} 
            />
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
    </div>
  );
};

export default Dashboard;
