import React, { useEffect, useState } from 'react';
import { getLLMStatus } from '../../services/llmBackend';
import { getSavedSettings } from '../../services/settings';
import './Footer.css';

interface FooterProps {
  isLoading: boolean;
  onSeedChange?: (seed: number | null) => void;
}

const Footer: React.FC<FooterProps> = ({ isLoading, onSeedChange }) => {
  const [temperature, setTemperature] = useState(0.8);
  const [isLLMConnected, setIsLLMConnected] = useState(false);
  const [llmModel, setLLMModel] = useState('');
  const [backendType, setBackendType] = useState('');
  const [seed, setSeed] = useState<number | null>(null);
  const [isRandomSeed, setIsRandomSeed] = useState(true);

  // Use a ref to track previous loading state
  const prevLoadingRef = React.useRef(isLoading);

  // Load the current temperature setting and check LLM backend connectivity on mount
  useEffect(() => {
    // Try to get saved temperature from localStorage (fallback for compatibility)
    const savedTemp = localStorage.getItem('storywriter_temperature');
    if (savedTemp) {
      setTemperature(parseFloat(savedTemp));
    }
    
    // Get settings and check backend connection
    loadSettingsAndCheckStatus();
    
    // Set up interval to periodically check connection status
    const intervalId = setInterval(loadSettingsAndCheckStatus, 30000); // check every 30 seconds
    
    return () => {
      clearInterval(intervalId); // Clean up interval on component unmount
    };
  }, []);
  
  const loadSettingsAndCheckStatus = async () => {
    try {
      // Check LLM connection status
      const status = await getLLMStatus();
      setIsLLMConnected(status.isConnected);
      
      if (status.backendType) {
        setBackendType(status.backendType);
      }
      
      if (status.modelName) {
        setLLMModel(status.modelName);
      }
      
      // Only fetch settings if we don't have enough info from status
      if (!status.backendType || !status.modelName) {
        const settings = await getSavedSettings();
        
        if (settings) {
          if (!status.backendType) {
            setBackendType(settings.backendType);
          }
          
          if (!status.modelName && settings.defaultModel) {
            setLLMModel(settings.defaultModel);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load settings or check status:", error);
      setIsLLMConnected(false);
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
    const seedValue = isNaN(newSeed) ? null : newSeed;
    setSeed(seedValue);
    if (onSeedChange) {
      onSeedChange(seedValue);
    }
  };

  // Handle random seed checkbox
  const handleRandomSeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isRandom = e.target.checked;
    setIsRandomSeed(isRandom);
    
    if (isRandom) {
      // If random is checked, set seed to null in config
      setSeed(null);
      if (onSeedChange) {
        onSeedChange(null);
      }
    } else if (seed === null) {
      // If random is unchecked and no seed is set, generate a random seed as starting point
      const randomSeed = Math.floor(Math.random() * 1000000);
      setSeed(randomSeed);
      if (onSeedChange) {
        onSeedChange(randomSeed);
      }
    }
  };
  
  // Reset seed for new story generation when loading finishes
  useEffect(() => {
    // Only generate a new seed when loading changes from true to false
    if (prevLoadingRef.current && !isLoading && isRandomSeed) {
      const randomSeed = Math.floor(Math.random() * 1000000);
      setSeed(randomSeed);
      if (onSeedChange) {
        onSeedChange(randomSeed);
      }
    }
    
    // Update the ref with current loading state
    prevLoadingRef.current = isLoading;
  }, [isLoading, isRandomSeed, onSeedChange]);

  // Get display name for the model
  const getModelDisplayName = () => {
    if (!llmModel) return '';
    return llmModel.split('/').pop() || llmModel;
  };

  // Format the backend type for display
  const getBackendDisplayName = () => {
    if (!backendType) return 'LLM';
    
    // Capitalize first letter and format backend type
    switch(backendType.toLowerCase()) {
      case 'lmstudio':
        return 'LM Studio';
      case 'chatgpt':
        return 'ChatGPT';
      case 'ollama':
        return 'Ollama';
      default:
        return backendType.charAt(0).toUpperCase() + backendType.slice(1);
    }
  };

  return (
    <div className="footer">
      <div className="footer-content">
        <div className="status-indicators">
          <div className="status-indicator">
            <div className={`status-dot ${isLoading ? 'active' : 'idle'}`}></div>
            <span>{isLoading ? 'Processing Request...' : 'Backend Idle'}</span>
          </div>
          <div className="status-indicator">
            <div className={`status-dot ${isLLMConnected ? 'idle' : 'error'}`}></div>
            <span>
              {isLLMConnected 
                ? `${getBackendDisplayName()}: ${getModelDisplayName() || 'Connected'}` 
                : `${getBackendDisplayName()}: Disconnected`}
            </span>
            <button 
              onClick={loadSettingsAndCheckStatus} 
              title="Refresh LLM Status"
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                fontSize: '12px',
                marginLeft: '5px'
              }}
            >
              ↻
            </button>
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
