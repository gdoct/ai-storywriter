import { Button } from '@drdata/ai-styles';
import React, { useEffect, useState } from 'react';
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
    fetchDashboardStats,
    fetchRecentScenarios,
    fetchRecentStories,
    RecentScenario,
    RecentStory
} from '../services/dashboardService';

interface DashboardProps {
  // No props needed anymore
}

const Dashboard: React.FC<DashboardProps> = () => {
  const { userProfile } = useAuth();
  const username = userProfile?.username;
  const email = userProfile?.email;
  const navigate = useNavigate();
  const { alertState, confirmState, hideAlert, hideConfirm, customAlert } = useModals();
  
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
      }
    };

    loadDashboardData();
  }, []);

  const handleEditScenario = (scenarioId: string) => {
    // Navigate to the scenario editor with the specific scenario ID
    navigate(`/app?scenario=${scenarioId}`);
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
      <div style={{ 
        minHeight: '100vh',
        background: 'var(--color-background)',
        padding: 'var(--spacing-xl)'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: `var(--spacing-5xl) auto 0 auto`,
          textAlign: 'center'
        }}>
          <div style={{ 
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-lg)'
          }}>
            Loading your dashboard...
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'var(--color-background)',
        padding: 'var(--spacing-xl)'
      }}>
        <div style={{ 
          maxWidth: '600px', 
          margin: `var(--spacing-5xl) auto 0 auto`,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-lg)' }}>⚠️</div>
          <h3 style={{ 
            fontSize: 'var(--font-size-2xl)', 
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--spacing-md)'
          }}>
            Something went wrong
          </h3>
          <p style={{ 
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--spacing-xl)',
            fontSize: 'var(--font-size-lg)'
          }}>
            {error}
          </p>
          <Button 
            variant="primary" 
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Show main dashboard (stats should be loaded at this point)
  if (!stats) {
    return null;
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'var(--color-background)'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        padding: 'var(--spacing-xl)'
      }}>
        <DashboardHeader username={username} email={email} />

        <div style={{ marginTop: 'var(--spacing-2xl)' }}>
          <WritingStats stats={stats} />

          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
            gap: 'var(--spacing-xl)',
            marginTop: 'var(--spacing-2xl)'
          }}>
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
        <div style={{ marginTop: 'var(--spacing-5xl)' }}>
          <MarketingFooter />
        </div>

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
