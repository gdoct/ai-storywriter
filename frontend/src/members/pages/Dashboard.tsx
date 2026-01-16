import { Button } from '@drdata/ai-styles';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DashboardHeader,
    RecentGeneratedStories,
    RecentScenarios,
    WritingStats
} from '../components/Dashboard';
import GeneratingModal from '../components/Dashboard/GeneratingModal';
import GenerateSimilarModal, { ScenarioSelections } from '../components/Dashboard/GenerateSimilarModal';
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
import { fetchScenarioById } from '@shared/services/scenario';
import { generateSimilarScenarios, ScenarioSelections as ServiceScenarioSelections, GenerationProgress } from '@shared/services/similarScenarioService';
import { Scenario } from '@shared/types/ScenarioTypes';

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
  
  // Generate similar scenario state
  const [showGenerateSimilarModal, setShowGenerateSimilarModal] = useState(false);
  const [showGeneratingModal, setShowGeneratingModal] = useState(false);
  const [scenarioToSimilar, setScenarioToSimilar] = useState<RecentScenario | null>(null);
  const [fullScenarioForModal, setFullScenarioForModal] = useState<Scenario | null>(null);
  
  // Progress tracking for multiple scenario generation
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(1);
  const [totalScenariosToGenerate, setTotalScenariosToGenerate] = useState(1);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [completedScenarios, setCompletedScenarios] = useState<Scenario[]>([]);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  // Welcome wizard state
  const [showWelcomeWizard, setShowWelcomeWizard] = useState(false);

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

  const handleGenerateSimilar = async (scenarioId: string) => {
    const scenario = recentScenarios.find(s => s.id === scenarioId);
    if (!scenario) {
      customAlert('Scenario not found. Please try again.', 'Error');
      return;
    }
    
    try {
      // Fetch the full scenario data for the modal
      const fullScenario = await fetchScenarioById(scenarioId);
      
      setScenarioToSimilar(scenario);
      setFullScenarioForModal(fullScenario);
      setShowGenerateSimilarModal(true);
    } catch (error) {
      console.error('Error fetching full scenario:', error);
      customAlert('Failed to load scenario details. Please try again.', 'Error');
    }
  };

  const handleAbortGeneration = () => {
    setShowGeneratingModal(false);
    setCurrentScenarioIndex(1);
    setTotalScenariosToGenerate(1);
    setIsRetrying(false);
    setRetryCount(0);
    setCompletedScenarios([]);
    setAbortController(null);
  };

  const handleProgressUpdate = (progress: GenerationProgress) => {
    setCurrentScenarioIndex(progress.currentIndex);
    setTotalScenariosToGenerate(progress.totalCount);
    setIsRetrying(progress.isRetrying);
    setRetryCount(progress.retryCount);
    setCompletedScenarios(progress.completedScenarios || []);
  };

  const handleGenerateSimilarConfirm = async (selections: ScenarioSelections) => {
    if (!scenarioToSimilar || !fullScenarioForModal) return;
    
    try {
      setShowGeneratingModal(true);
      setCurrentScenarioIndex(1);
      setTotalScenariosToGenerate(selections.count);
      setIsRetrying(false);
      setRetryCount(0);
      setCompletedScenarios([]);

      const fullScenario = fullScenarioForModal;
      
      // Convert ScenarioSelections to service format
      const serviceSelections: ServiceScenarioSelections = {
        retainCharacters: selections.retainCharacters,
        retainLocations: selections.retainLocations,
        retainNotes: selections.retainNotes,
        selectedCharacters: selections.selectedCharacters,
        selectedLocations: selections.selectedLocations,
        count: selections.count
      };
      
      // Generate scenarios using the service
      const createdScenarios = await generateSimilarScenarios(
        fullScenario,
        serviceSelections,
        handleProgressUpdate,
        handleAbortGeneration
      );
      
      setShowGeneratingModal(false);
      setAbortController(null);
      
      // Navigate based on the number of scenarios generated
      if (selections.count === 1) {
        // Single scenario: open in editor
        navigate(`/app?scenario=${createdScenarios[0].id}`);
      } else {
        // Multiple scenarios: navigate to scenarios page
        navigate('/scenarios');
      }
      
    } catch (error) {
      console.error('Error generating similar scenario:', error);
      setShowGeneratingModal(false);
      setAbortController(null);
      
      if (error instanceof Error && error.message === 'Generation was aborted') {
        // Don't show error for aborted operations
        return;
      }
      
      customAlert(
        error instanceof Error ? error.message : 'Failed to generate similar scenario. Please try again.',
        'Error'
      );
    } finally {
      setCurrentScenarioIndex(1);
      setTotalScenariosToGenerate(1);
      setIsRetrying(false);
      setRetryCount(0);
      setCompletedScenarios([]);
    }
  };

  const handleCloseSimilarModal = () => {
    setShowGenerateSimilarModal(false);
    setScenarioToSimilar(null);
    setFullScenarioForModal(null);
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

        {/* Generate Similar Scenario Modals */}
        <GenerateSimilarModal
          isOpen={showGenerateSimilarModal}
          onClose={handleCloseSimilarModal}
          onGenerate={handleGenerateSimilarConfirm}
          scenarioTitle={scenarioToSimilar?.title || ''}
          characters={(fullScenarioForModal?.characters ?? []).map(c => ({ name: c.name ?? 'Unnamed', id: c.id ?? '' }))}
          locations={(fullScenarioForModal?.locations ?? []).map(l => ({ name: l.name ?? 'Unnamed', id: l.id ?? '' }))}
        />
        
        <GeneratingModal
          isOpen={showGeneratingModal}
          currentIndex={currentScenarioIndex}
          totalCount={totalScenariosToGenerate}
          isRetrying={isRetrying}
          retryCount={retryCount}
          completedScenarios={completedScenarios}
          onAbort={handleAbortGeneration}
        />

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
