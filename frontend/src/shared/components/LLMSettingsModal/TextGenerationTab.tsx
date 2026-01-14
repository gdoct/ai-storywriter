import React, { useEffect, useState } from 'react';
import { fetchLLMModels, getLLMStatus } from '../../services/llmBackend';
import { getSelectedModel, setSelectedModel } from '../../services/modelSelection';

interface TextGenerationTabProps {
  isActive: boolean;
  onSeedChange?: (seed: number | null) => void;
}

export const TextGenerationTab: React.FC<TextGenerationTabProps> = ({
  isActive,
  onSeedChange
}) => {
  const [isLLMConnected, setIsLLMConnected] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModelState, setSelectedModelState] = useState<string>('');
  const [temperature, setTemperature] = useState(0.8);
  const [seed, setSeed] = useState<number | null>(null);
  const [isRandomSeed, setIsRandomSeed] = useState(true);

  // Load models and initialize settings when tab becomes active
  useEffect(() => {
    if (isActive) {
      loadModels();
      
      // Load saved temperature from localStorage
      const savedTemp = localStorage.getItem('storywriter_temperature');
      if (savedTemp) {
        setTemperature(parseFloat(savedTemp));
      }
    }
  }, [isActive]);

  const loadModels = async () => {
    try {
      // Check LLM connection status
      const status = await getLLMStatus();
      setIsLLMConnected(status.isConnected);
      
      // Load selected model from storage
      const savedModel = getSelectedModel();
      if (savedModel) {
        setSelectedModelState(savedModel);
      }
      
      // Load available models
      if (status.isConnected) {
        try {
          const models = await fetchLLMModels();
          setAvailableModels(models);
          
          // If no model is selected and we have models available, select the first one
          if (!getSelectedModel() && models.length > 0) {
            setSelectedModel(models[0]);
            setSelectedModelState(models[0]);
          }
        } catch (error) {
          console.error("Failed to fetch text generation models:", error);
        }
      }
    } catch (error) {
      console.error("Failed to load text generation settings:", error);
      setIsLLMConnected(false);
    }
  };

  // Handle model selection change
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    setSelectedModel(newModel);
    setSelectedModelState(newModel);
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

  if (!isActive) return null;

  return (
    <div className="llm-tab-content">
      {/* Connection Status */}
      <div className="llm-settings-modal__status">
        <div className={`llm-settings-modal__status-indicator ${isLLMConnected ? 'connected' : 'disconnected'}`}>
          <div className="status-dot"></div>
          <span>{isLLMConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Model Selection */}
      <div className="llm-settings-modal__section">
        <label htmlFor="text-model-select" className="llm-settings-modal__label">
          Model
        </label>
        <select
          id="text-model-select"
          data-testid="text-model-select"
          value={selectedModelState}
          onChange={handleModelChange}
          disabled={!isLLMConnected || availableModels.length === 0}
          className="llm-settings-modal__select"
        >
          {availableModels.length === 0 ? (
            <option value="">No models available</option>
          ) : (
            availableModels.map(model => (
              <option key={model} value={model}>{model}</option>
            ))
          )}
        </select>
      </div>
      
      {/* Temperature Control */}
      <div className="llm-settings-modal__section">
        <label htmlFor="text-temperature-slider" className="llm-settings-modal__label">
          Temperature: {temperature.toFixed(2)}
        </label>
        <input
          id="text-temperature-slider"
          data-testid="text-temperature-slider"
          type="range"
          min="0.60"
          max="1.20"
          step="0.01"
          value={temperature}
          onChange={handleTemperatureChange}
          className="llm-settings-modal__slider"
        />
        <div className="llm-settings-modal__slider-labels">
          <span>0.60</span>
          <span>1.20</span>
        </div>
      </div>
      
      {/* Seed Control */}
      <div className="llm-settings-modal__section">
        <div className="llm-settings-modal__seed-checkbox">
          <input
            id="text-random-seed"
            type="checkbox"
            checked={isRandomSeed}
            onChange={handleRandomSeedChange}
          />
          <label htmlFor="text-random-seed">Use random seed</label>
        </div>
        <label htmlFor="text-seed-input" className="llm-settings-modal__label">
          Seed
        </label>
        <input
          id="text-seed-input"
          type="number"
          disabled={isRandomSeed}
          value={seed === null ? '' : seed}
          onChange={handleSeedChange}
          placeholder={isRandomSeed ? "Auto-generated" : "Enter seed"}
          className="llm-settings-modal__input"
        />
      </div>
    </div>
  );
};