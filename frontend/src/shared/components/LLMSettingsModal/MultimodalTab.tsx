import React, { useEffect, useState } from 'react';
import { fetchMultimodalModels, getMultimodalStatus } from '../../services/multimodalService';
import { setModelByType, getSelectedModelByType } from '../../services/modelSelection';

interface MultimodalTabProps {
  isActive: boolean;
}

export const MultimodalTab: React.FC<MultimodalTabProps> = ({
  isActive
}) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [temperature, setTemperature] = useState(0.7);

  // Load multimodal settings when tab becomes active
  useEffect(() => {
    if (isActive) {
      loadMultimodalSettings();

      // Load saved settings from localStorage
      const savedSettings = localStorage.getItem('storywriter_multimodal_settings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          setIsEnabled(settings.enabled || false);
          setSelectedModel(settings.model || '');
          setTemperature(settings.temperature || 0.7);
        } catch (error) {
          console.error('Failed to parse multimodal settings:', error);
        }
      }
    }
  }, [isActive]);

  const loadMultimodalSettings = async () => {
    try {
      // Check multimodal service status
      const status = await getMultimodalStatus();
      setIsBusy(status.busy);
      
      // Try to fetch models to determine if service is available
      try {
        const models = await fetchMultimodalModels();
        setAvailableModels(models);
        setIsConnected(models.length > 0);
        
        // If no model is selected and we have models available, select the first one
        if (!selectedModel && models.length > 0) {
          const newModel = models[0];
          setSelectedModel(newModel);
          // Update centralized model selection
          setModelByType('multimodal', newModel, { enabled: isEnabled, temperature });
        }
      } catch (error) {
        console.error("Failed to fetch multimodal models:", error);
        setIsConnected(false);
        setAvailableModels([]);
      }
    } catch (error) {
      console.error("Failed to load multimodal settings:", error);
      setIsConnected(false);
    }
  };

  const saveSettings = () => {
    const settings = {
      enabled: isEnabled,
      model: selectedModel,
      temperature: temperature
    };
    localStorage.setItem('storywriter_multimodal_settings', JSON.stringify(settings));
  };

  // Handle enable/disable toggle
  const handleEnabledChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = e.target.checked;
    setIsEnabled(enabled);
    saveSettings();
  };

  // Handle model selection change
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    setSelectedModel(newModel);

    // Update centralized model selection
    setModelByType('multimodal', newModel, { enabled: isEnabled, temperature });
    saveSettings();
  };

  // Handle temperature change
  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTemp = parseFloat(e.target.value);
    setTemperature(newTemp);

    // Update centralized model selection
    setModelByType('multimodal', selectedModel, { enabled: isEnabled, temperature: newTemp });
    saveSettings();
  };

  if (!isActive) return null;

  return (
    <div className="llm-tab-content">
      {/* Enable/Disable Toggle */}
      <div className="llm-settings-modal__section">
        <div className="llm-settings-modal__seed-checkbox">
          <input
            id="multimodal-enabled"
            type="checkbox"
            checked={isEnabled}
            onChange={handleEnabledChange}
          />
          <label htmlFor="multimodal-enabled">Enable Multimodal AI (Vision)</label>
        </div>
        <p className="llm-settings-description">
          Enable multimodal AI to analyze images and generate text responses based on visual content.
        </p>
      </div>

      {/* Connection Status */}
      <div className="llm-settings-modal__status">
        <div className={`llm-settings-modal__status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          <div className="status-dot"></div>
          <span>
            {isConnected 
              ? (isBusy ? 'Connected (Busy)' : 'Connected') 
              : 'Unavailable'
            }
          </span>
        </div>
        {!isConnected && (
          <p className="llm-settings-description">
            Multimodal AI is not currently available. Please check your configuration or contact support.
          </p>
        )}
      </div>

      {/* Model Selection */}
      <div className="llm-settings-modal__section">
        <label htmlFor="multimodal-model-select" className="llm-settings-modal__label">
          Model
        </label>
        <select
          id="multimodal-model-select"
          data-testid="multimodal-model-select"
          value={selectedModel}
          onChange={handleModelChange}
          disabled={!isEnabled || !isConnected || availableModels.length === 0}
          className="llm-settings-modal__select"
        >
          {availableModels.length === 0 ? (
            <option value="">No multimodal models available</option>
          ) : (
            availableModels.map(model => (
              <option key={model} value={model}>{model}</option>
            ))
          )}
        </select>
        <p className="llm-settings-description">
          Select a vision-capable model for multimodal tasks.
        </p>
      </div>
      
      {/* Temperature Control */}
      <div className="llm-settings-modal__section">
        <label htmlFor="multimodal-temperature-slider" className="llm-settings-modal__label">
          Temperature: {temperature.toFixed(2)}
        </label>
        <input
          id="multimodal-temperature-slider"
          data-testid="multimodal-temperature-slider"
          type="range"
          min="0.30"
          max="1.00"
          step="0.01"
          value={temperature}
          onChange={handleTemperatureChange}
          disabled={!isEnabled}
          className="llm-settings-modal__slider"
        />
        <div className="llm-settings-modal__slider-labels">
          <span>0.30</span>
          <span>1.00</span>
        </div>
        <p className="llm-settings-description">
          Lower values for more focused responses, higher values for more creative interpretations.
        </p>
      </div>

      {/* Usage Information */}
      <div className="llm-settings-modal__section">
        <div className="llm-settings-info-box">
          <h4>Multimodal AI Usage</h4>
          <ul>
            <li>Upload images to get AI descriptions and analysis</li>
            <li>Higher credit costs compared to text-only AI</li>
            <li>Supports common image formats (JPEG, PNG, GIF)</li>
            <li>Best results with clear, high-quality images</li>
          </ul>
        </div>
      </div>
    </div>
  );
};