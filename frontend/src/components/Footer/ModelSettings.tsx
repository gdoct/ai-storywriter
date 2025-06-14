import React, { useEffect, useRef, useState } from 'react';
import './ModelSettings.css';

interface ModelSettingsProps {
  isLoading: boolean;
  onSeedChange?: (seed: number | null) => void;
}

const ModelSettings: React.FC<ModelSettingsProps> = ({ isLoading, onSeedChange }) => {
  const [temperature, setTemperature] = useState(0.8);
  const [seed, setSeed] = useState<number | null>(null);
  const [isRandomSeed, setIsRandomSeed] = useState(true);
  
  // Use a ref to track previous loading state
  const prevLoadingRef = useRef(isLoading);

  useEffect(() => {
    // Try to get saved temperature from localStorage
    const savedTemp = localStorage.getItem('storywriter_temperature');
    if (savedTemp) {
      setTemperature(parseFloat(savedTemp));
    }
  }, []);

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

  return (
    <div className="model-settings">
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
  );
};

export default ModelSettings;
