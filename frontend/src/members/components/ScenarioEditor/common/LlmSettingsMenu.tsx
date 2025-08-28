import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaCog, FaTimes } from 'react-icons/fa';
import { fetchLLMModels, getLLMStatus } from '../../../../shared/services/llmBackend';
import { getSelectedModel, setSelectedModel } from '../../../../shared/services/modelSelection';
import './LlmSettingsMenu.css';

interface LlmSettingsMenuProps {
  className?: string;
  disabled?: boolean;
  onSeedChange?: (seed: number | null) => void;
}

export const LlmSettingsMenu: React.FC<LlmSettingsMenuProps> = ({
  className,
  disabled = false,
  onSeedChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLLMConnected, setIsLLMConnected] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModelState, setSelectedModelState] = useState<string>('');
  const [temperature, setTemperature] = useState(0.8);
  const [seed, setSeed] = useState<number | null>(null);
  const [isRandomSeed, setIsRandomSeed] = useState(true);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Use a ref to track previous loading state for seed generation
  const prevLoadingRef = useRef(disabled);

  const toggleMenu = useCallback(() => {
    if (disabled) return;
    
    // Calculate dropdown position when opening
    if (!isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: buttonRect.bottom + 8, // 8px margin
        right: window.innerWidth - buttonRect.right
      });
    }
    
    setIsOpen(prev => !prev);
  }, [disabled, isOpen]);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Load models and initialize settings
  useEffect(() => {
    loadModels();
    
    // Load saved temperature from localStorage
    const savedTemp = localStorage.getItem('storywriter_temperature');
    if (savedTemp) {
      setTemperature(parseFloat(savedTemp));
    }
    
    // Set up interval to periodically check connection status
    const intervalId = setInterval(loadModels, 30000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

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

  // Reset seed for new story generation when loading finishes
  useEffect(() => {
    // Only generate a new seed when loading changes from true to false
    if (prevLoadingRef.current && !disabled && isRandomSeed) {
      const randomSeed = Math.floor(Math.random() * 1000000);
      setSeed(randomSeed);
      if (onSeedChange) {
        onSeedChange(randomSeed);
      }
    }
    
    // Update the ref with current loading state
    prevLoadingRef.current = disabled;
  }, [disabled, isRandomSeed, onSeedChange]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, closeMenu]);

  return (
    <div className={`llm-settings-menu ${className}`}>
      <button 
        ref={buttonRef}
        className={`llm-settings-menu__toggle ${disabled ? 'llm-settings-menu__toggle--disabled' : ''}`}
        onClick={toggleMenu}
        aria-label="LLM Settings"
        aria-expanded={isOpen}
        disabled={disabled}
        title="LLM Settings"
      >
        {isOpen ? <FaTimes /> : <FaCog />}
      </button>
      
      {/* Settings Dropdown */}
      {isOpen && createPortal(
        <div 
          className="llm-settings-menu__dropdown"
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            right: dropdownPosition.right,
            zIndex: 9999
          }}
          ref={menuRef}
        >
          <div className="llm-settings-menu__header">
            <h3>LLM Settings</h3>
          </div>
          
          {/* Model Selection */}
          <div className="llm-settings-menu__section">
            <div className="model-selector">
              <label htmlFor="llm-model-select">Model:</label>
              <select
                id="llm-model-select"
                value={selectedModelState}
                onChange={handleModelChange}
                disabled={!isLLMConnected || availableModels.length === 0}
                className="llm-settings-menu__select"
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
          </div>
          
          {/* Temperature Control */}
          <div className="llm-settings-menu__section">
            <div className="temperature-control">
              <label htmlFor="llm-temperature-slider">Temperature: {temperature.toFixed(2)}</label>
              <input
                id="llm-temperature-slider"
                type="range"
                min="0.60"
                max="1.20"
                step="0.01"
                value={temperature}
                onChange={handleTemperatureChange}
                className="llm-settings-menu__slider"
              />
            </div>
          </div>
          
          {/* Seed Control */}
          <div className="llm-settings-menu__section">
            <div className="seed-control">
              <div className="seed-checkbox">
                <input
                  id="llm-random-seed"
                  type="checkbox"
                  checked={isRandomSeed}
                  onChange={handleRandomSeedChange}
                />
                <label htmlFor="llm-random-seed">Random</label>
              </div>
              <label htmlFor="llm-seed-input">Seed:</label>
              <input
                id="llm-seed-input"
                type="number"
                disabled={isRandomSeed}
                value={seed === null ? '' : seed}
                onChange={handleSeedChange}
                placeholder={isRandomSeed ? "Auto" : "Enter seed"}
                className="llm-settings-menu__seed-input"
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
