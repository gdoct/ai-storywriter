import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ScenarioEditorWrapper } from '../components/ScenarioEditor/ScenarioEditorWrapper';
import { fetchScenarioById } from '../services/scenario';
import { Scenario } from '../types/ScenarioTypes';
import './Home.css';

interface HomeProps {
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  seed?: number | null;
}

const Home: React.FC<HomeProps> = ({ setIsLoading, seed }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [initialScenario, setInitialScenario] = useState<Scenario | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  
  // Extract scenario ID from URL parameters
  const scenarioIdFromUrl = searchParams.get('scenario');

  // Load initial scenario if specified in URL
  useEffect(() => {
    const loadInitialScenario = async () => {
      if (scenarioIdFromUrl) {
        try {
          setLoading(true);
          setIsLoading(true);
          const scenario = await fetchScenarioById(scenarioIdFromUrl);
          setInitialScenario(scenario);
        } catch (error) {
          console.error('Failed to load scenario:', error);
          // Continue with no initial scenario
        } finally {
          setLoading(false);
          setIsLoading(false);
        }
      }
    };

    loadInitialScenario();
  }, [scenarioIdFromUrl, setIsLoading]);

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
