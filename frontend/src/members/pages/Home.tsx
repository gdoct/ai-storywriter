import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ScenarioEditorWrapper } from '../components/ScenarioEditor/ScenarioEditorWrapper';
import { fetchScenarioById, createContinuationScenario } from '@shared/services/scenario';
import { Scenario } from '@shared/types/ScenarioTypes';
import './Home.css';

interface HomeProps {
  // No props needed anymore
}

const Home: React.FC<HomeProps> = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [initialScenario, setInitialScenario] = useState<Scenario | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  
  // Extract parameters from URL
  const scenarioIdFromUrl = searchParams.get('scenario');
  const continueStoryId = searchParams.get('continueStory');

  // Load initial scenario if specified in URL
  useEffect(() => {
    const loadInitialScenario = async () => {
      if (continueStoryId && scenarioIdFromUrl) {
        // Handle continue story mode
        try {
          setLoading(true);
          const continuationScenario = await createContinuationScenario(
            parseInt(continueStoryId), 
            scenarioIdFromUrl
          );
          setInitialScenario(continuationScenario);
        } catch (error) {
          console.error('Failed to create continuation scenario:', error);
          // Fallback to loading the original scenario
          try {
            const scenario = await fetchScenarioById(scenarioIdFromUrl);
            setInitialScenario(scenario);
          } catch (fallbackError) {
            console.error('Failed to load fallback scenario:', fallbackError);
          }
        } finally {
          setLoading(false);
        }
      } else if (scenarioIdFromUrl) {
        // Regular scenario loading
        try {
          setLoading(true);
          const scenario = await fetchScenarioById(scenarioIdFromUrl);
          setInitialScenario(scenario);
        } catch (error) {
          console.error('Failed to load scenario:', error);
          // Continue with no initial scenario
        } finally {
          setLoading(false);
        }
      }
    };

    loadInitialScenario();
  }, [scenarioIdFromUrl, continueStoryId]);

  const handleScenarioSave = (scenario: Scenario) => {
    // Update URL with scenario ID after save
    if (scenario.id && scenario.id !== scenarioIdFromUrl) {
      navigate(`/app?scenario=${scenario.id}`, { replace: true });
    }
  };

  const handleClose = () => {
    // Navigate back to dashboard
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="home-loading">
        <div className="loading-spinner"></div>
        <p>Loading scenario...</p>
      </div>
    );
  }

  return (
    <ScenarioEditorWrapper
      initialScenario={initialScenario}
      onScenarioSave={handleScenarioSave}
      onClose={handleClose}
    />
  );
};

export default Home;
