import React, { Dispatch, SetStateAction, useState } from 'react';

import ScenarioWriter from '../components/ScenarioWriter/ScenarioWriter';
import './Home.css';

interface HomeProps {
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  seed?: number | null;
}

const Home: React.FC<HomeProps> = ({ setIsLoading, seed }) => {
  const [scenario, setScenario] = useState('');

  const handleSubmit = () => {
    if (!scenario.trim()) return;

    // Set loading to true when submitting
    setIsLoading(true);

    // Simulate API call - we'll replace this with actual backend communication later
    setTimeout(() => {
      // Set loading back to false after "response"
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="home-container">
      <ScenarioWriter 
        value={scenario}
        onChange={setScenario}
        onSubmit={handleSubmit}
        seed={seed}
      />
    </div>
  );
};

export default Home;
