import React, { useEffect, useState } from 'react';
import { getLMStudioConfig, updateLMStudioConfig } from '../../services/settings';
import './Footer.css';

interface FooterProps {
  isLoading: boolean;
  onSeedChange?: (seed: number | null) => void;
}

const Footer: React.FC<FooterProps> = ({ isLoading }) => {
  const [temperature, setTemperature] = useState(0.8);
  const [isLMStudioConnected, setIsLMStudioConnected] = useState(false);
  const [lmStudioModel, setLMStudioModel] = useState('');
  const [seed, setSeed] = useState<number | null>(null);
  const [isRandomSeed, setIsRandomSeed] = useState(true);

  // Load the current temperature setting and check LM Studio connectivity on mount
  useEffect(() => {
    const config = getLMStudioConfig();
    // Try to get saved temperature or default to 0.8
    const savedTemp = localStorage.getItem('storywriter_temperature');
    if (savedTemp) {
      setTemperature(parseFloat(savedTemp));
    }
    
    // Set seed from config if not random
    if (config.seed !== undefined && config.seed !== null) {
      setSeed(config.seed);
    }
    
    // Check if LM Studio is available
    checkLMStudioConnection(config.baseUrl);
  }, []);

  // Function to check LM Studio connection
  const checkLMStudioConnection = async (baseUrl: string) => {
    try {
      const response = await fetch(`${baseUrl}/v1/models`);
      if (response.ok) {
        setIsLMStudioConnected(true);
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          setLMStudioModel(data.data[0].id);
        }
      } else {
        setIsLMStudioConnected(false);
        setLMStudioModel('');
      }
    } catch (error) {
      setIsLMStudioConnected(false);
      setLMStudioModel('');
    }
  };

  // Handle temperature change
  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTemp = parseFloat(e.target.value);
    setTemperature(newTemp);
    // Store in localStorage for persistence
    localStorage.setItem('storywriter_temperature', newTemp.toString());
  };
  
  // Handle seed change
  const handleSeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSeed = parseInt(e.target.value, 10);
    setSeed(isNaN(newSeed) ? null : newSeed);
    updateLMStudioConfig({ seed: isNaN(newSeed) ? null : newSeed });
  };

  // Handle random seed checkbox
  const handleRandomSeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isRandom = e.target.checked;
    setIsRandomSeed(isRandom);
    
    if (isRandom) {
      // If random is checked, set seed to null in config
      setSeed(null);
      updateLMStudioConfig({ seed: null });
    } else if (seed === null) {
      // If random is unchecked and no seed is set, generate a random seed as starting point
      const randomSeed = Math.floor(Math.random() * 1000000);
      setSeed(randomSeed);
      updateLMStudioConfig({ seed: randomSeed });
    }
  };
  
  // Reset seed for new story generation - can be called from parent component
  useEffect(() => {
    if (isRandomSeed && !isLoading) {
      const randomSeed = Math.floor(Math.random() * 1000000);
      setSeed(randomSeed);
      updateLMStudioConfig({ seed: isRandomSeed ? null : randomSeed });
    }
  }, [isLoading, isRandomSeed]);

  return (
    <div className="footer">
      <div className="footer-content">
        <div className="status-indicators">
          <div className="status-indicator">
            <div className={`status-dot ${isLoading ? 'active' : 'idle'}`}></div>
            <span>{isLoading ? 'Processing Request...' : 'Backend Idle'}</span>
          </div>
          <div className="status-indicator">
            <div className={`status-dot ${isLMStudioConnected ? 'idle' : 'error'}`}></div>
            <span>{isLMStudioConnected ? `LMStudio: ${lmStudioModel.split('/').pop() || 'Connected'}` : 'LMStudio: Disconnected'}</span>
          </div>
        </div>
        
        <div className="model-controls">
          <div className="temperature-control">
            <label htmlFor="temperature-slider">Temperature: {temperature.toFixed(2)}</label>
            <input
              id="temperature-slider"
              type="range"
              min="0.60"
              max="1.20"
              step="0.01"
              value={temperature}
              onChange={handleTemperatureChange}
            />
          </div>
          
          <div className="seed-control">
            <div className="seed-checkbox">
              <input
                id="random-seed"
                type="checkbox"
                checked={isRandomSeed}
                onChange={handleRandomSeedChange}
              />
              <label htmlFor="random-seed">Random</label>
            </div>
            <label htmlFor="seed-input">Seed:</label>
            <input
              id="seed-input"
              type="number"
              disabled={isRandomSeed}
              value={seed === null ? '' : seed}
              onChange={handleSeedChange}
              placeholder={isRandomSeed ? "Auto" : "Enter seed"}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
