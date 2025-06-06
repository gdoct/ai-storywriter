import React, { useEffect, useState } from 'react';
import { LMStudioAPI } from '../services/lmstudioapi';
import { getLMStudioConfig, updateLMStudioConfig } from '../services/settings';
import './Settings.css';

const Settings: React.FC = () => {
  const [baseUrl, setBaseUrl] = useState('/proxy/lmstudio');
  const [modelName, setModelName] = useState('default');
  const [seed, setSeed] = useState<number | null>(null);
  const [useRandomSeed, setUseRandomSeed] = useState(true);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Load saved settings
  useEffect(() => {
    const config = getLMStudioConfig();
    setBaseUrl(config.baseUrl);
    setModelName(config.modelName);
    setSeed(config.seed ?? null);
    setUseRandomSeed(config.seed === null);
  }, []);

  // Fetch available models
  const fetchModels = async () => {
    setLoading(true);
    try {
      // Temporarily configure API with current form values to test
      const tempAPI = new LMStudioAPI(baseUrl, modelName);
      
      const models = await tempAPI.getModels();
      setAvailableModels(models);
      if (models.length > 0 && !models.includes(modelName)) {
        // If current model isn't available, select the first one
        setModelName(models[0]);
      }
      return models.length > 0;
    } catch (error) {
      console.error('Failed to fetch models:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Test connection to LM Studio
  const testConnection = async () => {
    setTestStatus('idle');
    setTestMessage('');
    
    const success = await fetchModels();
    
    if (success) {
      setTestMessage('Successfully connected to LM Studio! Found ' + availableModels.length + ' model(s).');
      setTestStatus('success');
    } else {
      setTestMessage('Connection failed. Make sure LM Studio is running and Server is enabled.');
      setTestStatus('error');
      // CORS warning
      setTimeout(() => {
        setTestMessage(prev => prev + '\nIf you see a CORS error in the browser console, you must enable CORS for http://localhost:3000 in LM Studio settings or use a proxy.');
      }, 100);
    }
  };

  // Save settings
  const saveSettings = () => {
    updateLMStudioConfig({
      baseUrl,
      modelName,
      seed: useRandomSeed ? null : seed
    });
    setSaveMessage('Settings saved successfully!');
    
    // Clear message after 3 seconds
    setTimeout(() => {
      setSaveMessage('');
    }, 3000);
  };

  return (
    <div className="settings-container">
      <h2>Settings</h2>
      
      <section className="settings-section">
        <h3>LM Studio API Configuration</h3>
        
        <div className="form-row">
          <label htmlFor="baseUrl">LM Studio URL:</label>
          <input
            type="text"
            id="baseUrl"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="/proxy/lmstudio"
          />
        </div>
        
        <div className="form-row">
          <label htmlFor="modelName">Model:</label>
          <select
            id="modelName"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
          >
            {availableModels.length === 0 && (
              <option value="default">Default Model</option>
            )}
            {availableModels.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </div>
        
        <div className="form-row">
          <label htmlFor="seedSettings">Random Seed:</label>
          <div className="seed-controls">
            <input 
              type="checkbox" 
              id="useRandomSeed" 
              checked={useRandomSeed} 
              onChange={(e) => setUseRandomSeed(e.target.checked)} 
            />
            <label htmlFor="useRandomSeed">Use random seeds (recommended)</label>
            
            {!useRandomSeed && (
              <div className="fixed-seed-input">
                <input
                  type="number"
                  id="seed"
                  value={seed !== null ? seed : ""}
                  onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Enter seed number"
                  disabled={useRandomSeed}
                />
                <div className="seed-description">
                  Using a fixed seed will make all generations predictable
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="button-row">
          <button 
            className="settings-btn primary-btn"
            onClick={saveSettings}
          >
            Save Settings
          </button>
          
          <button 
            className="settings-btn secondary-btn"
            onClick={testConnection}
            disabled={loading}
          >
            {loading ? <><span className="spinner"></span>Testing...</> : 'Test Connection'}
          </button>
        </div>
        
        {saveMessage && (
          <div className="message success-message">
            {saveMessage}
          </div>
        )}
        
        {testMessage && (
          <div className={`message ${testStatus === 'success' ? 'success-message' : 'error-message'}`}>
            {testMessage}
          </div>
        )}
      </section>
    </div>
  );
};

export default Settings;
