import React, { useEffect, useState } from 'react';
import { fetchLLMModels, getLLMStatus } from '../../services/llmBackend';
import { getSelectedModel, setSelectedModel } from '../../services/modelSelection';
import './ModelSelector.css';

const ModelSelector: React.FC = () => {
  const [isLLMConnected, setIsLLMConnected] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModelState] = useState<string>('');

  useEffect(() => {
    loadModels();
    
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

  return (
    <div className="model-selector">
      <label htmlFor="model-select">Model:</label>
      <select
        id="model-select"
        data-testid="model-selector"
        value={selectedModel}
        onChange={handleModelChange}
        disabled={!isLLMConnected || availableModels.length === 0}
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
  );
};

export default ModelSelector;
