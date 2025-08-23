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
import { createScenario, fetchScenarioById } from '../services/scenario';
import { chatCompletion } from '../services/llmService';
import { createSimilarScenarioPrompt } from '../services/llmPromptService';
import { getSelectedModel } from '../services/modelSelection';
import { Scenario } from '../types/ScenarioTypes';

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

  const handleGenerateSimilar = async (scenarioId: string) => {
    console.log('handleGenerateSimilar called with scenarioId:', scenarioId);
    const scenario = recentScenarios.find(s => s.id === scenarioId);
    console.log('Found scenario:', scenario);
    if (!scenario) {
      customAlert('Scenario not found. Please try again.', 'Error');
      return;
    }
    
    try {
      // Fetch the full scenario data for the modal
      console.log('Fetching full scenario data...');
      const fullScenario = await fetchScenarioById(scenarioId);
      console.log('Full scenario loaded:', fullScenario);
      
      setScenarioToSimilar(scenario);
      setFullScenarioForModal(fullScenario);
      setShowGenerateSimilarModal(true);
    } catch (error) {
      console.error('Error fetching full scenario:', error);
      customAlert('Failed to load scenario details. Please try again.', 'Error');
    }
  };

  const handleGenerateSimilarConfirm = async (selections: ScenarioSelections) => {
    if (!scenarioToSimilar || !fullScenarioForModal) return;
    
    try {
      setShowGeneratingModal(true);
      
      // Use the already-loaded full scenario data
      const fullScenario = fullScenarioForModal;
      
      // Generate the similar scenario using LLM
      const prompt = createSimilarScenarioPrompt(fullScenario, selections);
      const selectedModel = getSelectedModel();
      const response = await chatCompletion(prompt, { 
        model: selectedModel || 'default-model',
        temperature: 0.8,
        max_tokens: 2000
      });
      
      if (!response) {
        throw new Error('No response from AI service');
      }
      
      console.log('Raw AI response:', response);
      
      // Parse the JSON response
      let newScenarioData: any;
      try {
        newScenarioData = JSON.parse(response);
        console.log('Parsed scenario data:', newScenarioData);
      } catch (parseError) {
        console.error('Failed to parse AI response:', response);
        throw new Error('Invalid response format from AI service');
      }
      
      // Create the new scenario - backend will assign id, userId, and createdAt
      // Convert storyarc from array to string if needed
      const storyarc = Array.isArray(newScenarioData.storyarc) 
        ? newScenarioData.storyarc.map((item: string, index: number) => `• ${item}`).join('\n')
        : newScenarioData.storyarc;
      
      const createdScenario = await createScenario({
        title: newScenarioData.title,
        synopsis: newScenarioData.synopsis,
        writingStyle: newScenarioData.writingStyle,
        characters: newScenarioData.characters || [],
        locations: newScenarioData.locations || [],
        backstory: newScenarioData.backstory,
        storyarc: storyarc,
        notes: newScenarioData.notes,
      } as Scenario);
      
      setShowGeneratingModal(false);
      
      // Navigate to the new scenario in the editor
      navigate(`/app?scenario=${createdScenario.id}`);
      
    } catch (error) {
      console.error('Error generating similar scenario:', error);
      setShowGeneratingModal(false);
      customAlert(
        error instanceof Error ? error.message : 'Failed to generate similar scenario. Please try again.',
        'Error'
      );
    }
  };

  const handleCloseSimilarModal = () => {
    setShowGenerateSimilarModal(false);
    setScenarioToSimilar(null);
    setFullScenarioForModal(null);
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
        {(() => {
          console.log('Dashboard render - showGenerateSimilarModal:', showGenerateSimilarModal, 'scenarioToSimilar:', scenarioToSimilar);
          return null;
        })()}
        <GenerateSimilarModal
          isOpen={showGenerateSimilarModal}
          onClose={handleCloseSimilarModal}
          onGenerate={handleGenerateSimilarConfirm}
          scenarioTitle={scenarioToSimilar?.title || ''}
          characters={fullScenarioForModal?.characters?.map(c => ({ name: c.name || 'Unnamed', id: c.id })) || []}
          locations={fullScenarioForModal?.locations?.map(l => ({ name: l.name || 'Unnamed', id: l.id || '' })) || []}
        />
        
        <GeneratingModal
          isOpen={showGeneratingModal}
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
