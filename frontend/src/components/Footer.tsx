import React, { useEffect, useState } from 'react';
import { getLMStudioConfig } from '../services/settings';
import './Footer.css';

interface FooterProps {
  isLoading: boolean;
}

const Footer: React.FC<FooterProps> = ({ isLoading }) => {
  const [temperature, setTemperature] = useState(0.8);
  const [isLMStudioConnected, setIsLMStudioConnected] = useState(false);
  const [lmStudioModel, setLMStudioModel] = useState('');

  // Load the current temperature setting and check LM Studio connectivity on mount
  useEffect(() => {
    const config = getLMStudioConfig();
    // Try to get saved temperature or default to 0.8
    const savedTemp = localStorage.getItem('storywriter_temperature');
    if (savedTemp) {
      setTemperature(parseFloat(savedTemp));
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
      </div>
    </div>
  );
};

export default Footer;
