import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes } from 'react-icons/fa';
import { fetchLLMModels, getLLMStatus } from '../../services/llmBackend';
import { getSelectedModel, setSelectedModel } from '../../services/modelSelection';
import './LLMSettingsModal.css';

interface LLMSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSeedChange?: (seed: number | null) => void;
}

export const LLMSettingsModal: React.FC<LLMSettingsModalProps> = ({
  isOpen,
  onClose,
  onSeedChange
}) => {
  const [isLLMConnected, setIsLLMConnected] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModelState, setSelectedModelState] = useState<string>('');
  const [temperature, setTemperature] = useState(0.8);
  const [seed, setSeed] = useState<number | null>(null);
  const [isRandomSeed, setIsRandomSeed] = useState(true);

  // Load models and initialize settings
  useEffect(() => {
    if (isOpen) {
      loadModels();
      
      // Load saved temperature from localStorage
      const savedTemp = localStorage.getItem('storywriter_temperature');
      if (savedTemp) {
        setTemperature(parseFloat(savedTemp));
      }
    }
  }, [isOpen]);

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
          console.error("Failed to fetch models:", error);
        }
      }
    } catch (error) {
      console.error("Failed to load models:", error);
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

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="llm-settings-modal__overlay" onClick={onClose}>
      <div 
        className="llm-settings-modal__content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="llm-settings-modal__header">
          <h2>LLM Settings</h2>
          <button
            className="llm-settings-modal__close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="llm-settings-modal__body">
          {/* Connection Status */}
          <div className="llm-settings-modal__status">
            <div className={`llm-settings-modal__status-indicator ${isLLMConnected ? 'connected' : 'disconnected'}`}>
              <div className="status-dot"></div>
              <span>{isLLMConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>

          {/* Model Selection */}
          <div className="llm-settings-modal__section">
            <label htmlFor="modal-model-select" className="llm-settings-modal__label">
              Model
            </label>
            <select
              id="modal-model-select"
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
            <label htmlFor="modal-temperature-slider" className="llm-settings-modal__label">
              Temperature: {temperature.toFixed(2)}
            </label>
            <input
              id="modal-temperature-slider"
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
                id="modal-random-seed"
                type="checkbox"
                checked={isRandomSeed}
                onChange={handleRandomSeedChange}
              />
              <label htmlFor="modal-random-seed">Use random seed</label>
            </div>
            <label htmlFor="modal-seed-input" className="llm-settings-modal__label">
              Seed
            </label>
            <input
              id="modal-seed-input"
              type="number"
              disabled={isRandomSeed}
              value={seed === null ? '' : seed}
              onChange={handleSeedChange}
              placeholder={isRandomSeed ? "Auto-generated" : "Enter seed"}
              className="llm-settings-modal__input"
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};