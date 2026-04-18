import { Button } from '@drdata/ai-styles';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DashboardHeader,
    RecentGeneratedStories,
    RecentRollingStories,
    RecentScenarios,
    WritingStats
} from '../components/Dashboard';
import GenerateSimilarModal from '../components/Dashboard/GenerateSimilarModal';
import MarketingFooter from '@anonymous/components/marketing/MarketingFooter';
import { AlertModal, ConfirmModal } from '@shared/components/Modal';
import { WelcomeWizard } from '@shared/components/WelcomeWizard';
import PublishStoryModal from '../components/Story/PublishStoryModal';
import { useAuth } from '@shared/contexts/AuthContext';
import { useModals } from '@shared/hooks/useModals';
import {
    DashboardStats,
    fetchDashboardStats,
    fetchRecentScenarios,
    fetchRecentStories,
    RecentScenario,
    RecentStory
} from '@shared/services/dashboardService';
import { isUserInBYOKMode } from '@shared/services/settings';
import { fetchRollingStories, RollingStory } from '@shared/services/rollingStoriesService';

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
  const [recentRollingStories, setRecentRollingStories] = useState<RollingStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Publish modal state
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [storyToPublish, setStoryToPublish] = useState<RecentStory | null>(null);
  
  // Generate similar scenario state
  const [showGenerateSimilarModal, setShowGenerateSimilarModal] = useState(false);
  const [sourceScenarioForSimilar, setSourceScenarioForSimilar] = useState<RecentScenario | null>(null);
  
  // Welcome wizard state
  const [showWelcomeWizard, setShowWelcomeWizard] = useState(false);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all dashboard data in parallel
        const [statsData, scenariosData, storiesData, rollingStoriesData] = await Promise.all([
          fetchDashboardStats(),
          fetchRecentScenarios(5, 0),
          fetchRecentStories(4, 0),
          fetchRollingStories()
        ]);

        setStats(statsData);
        setRecentScenarios(scenariosData.scenarios);
        setRecentStories(storiesData.stories);
        // Show only the 4 most recent rolling stories
        setRecentRollingStories(rollingStoriesData.slice(0, 4));
        setError(null);
        
        // Show welcome wizard if user has 0 credits, doesn't use BYOK, and has 0 scenarios
        const userCredits = userProfile?.credits || 0;
        const hasNoScenarios = statsData.scenariosCreated === 0;
        const isInBYOKMode = await isUserInBYOKMode();
        
        if (userCredits === 0 && !isInBYOKMode && hasNoScenarios) {
          setShowWelcomeWizard(true);
        }
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

  const handleContinueRollingStory = (story: RollingStory) => {
    // Navigate to the rolling story page
    navigate(`/rolling-story/${story.id}`);
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

  const handleGenerateSimilar = (scenarioId: string) => {
    const scenario = recentScenarios.find(s => s.id === scenarioId);
    if (!scenario) {
      customAlert('Scenario not found. Please try again.', 'Error');
      return;
    }
    setSourceScenarioForSimilar(scenario);
    setShowGenerateSimilarModal(true);
  };

  const handleSimilarScenarioCreated = (newScenarioId: string) => {
    setShowGenerateSimilarModal(false);
    setSourceScenarioForSimilar(null);
    navigate(`/app?scenario=${newScenarioId}`);
  };

  const handleCloseSimilarModal = () => {
    setShowGenerateSimilarModal(false);
    setSourceScenarioForSimilar(null);
  };

  const handleCloseWelcomeWizard = () => {
    setShowWelcomeWizard(false);
  };

  const handleCompleteWelcomeWizard = () => {
    setShowWelcomeWizard(false);
    // Could potentially track that the user has completed the wizard
    // This might be useful for analytics or to prevent showing it again
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
        <DashboardHeader
          username={username}
          email={email}
          // isFirstVisit should be true when there is no last activity
          isFirstVisit={!stats?.lastActivity?.length}
        />

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
          handleGenerateSimilar={handleGenerateSimilar}
        />
        <RecentGeneratedStories
          recentStories={recentStories}
          handlePublishStory={handlePublishStory}
          handleReadStory={handleReadStory}
        />
        <RecentRollingStories
          recentRollingStories={recentRollingStories}
          handleContinueStory={handleContinueRollingStory}
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

        {/* Generate Similar Scenario Modal */}
        {sourceScenarioForSimilar && (
          <GenerateSimilarModal
            isOpen={showGenerateSimilarModal}
            onClose={handleCloseSimilarModal}
            onScenarioCreated={handleSimilarScenarioCreated}
            sourceScenarioId={sourceScenarioForSimilar.id}
            sourceScenarioTitle={sourceScenarioForSimilar.title}
          />
        )}

        {/* Welcome Wizard */}
        <WelcomeWizard
          isOpen={showWelcomeWizard}
          onClose={handleCloseWelcomeWizard}
          onComplete={handleCompleteWelcomeWizard}
        />

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
