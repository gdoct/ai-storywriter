import React, { useEffect, useState } from 'react';
import { fetchLLMSettings, saveLLMSettings, testLLMConnection } from '../services/llmBackend';
import { BackendType, LLMConfig } from '../types/LLMTypes';
import './Settings.css';

const backendOptions: { label: string; value: BackendType }[] = [
  { label: 'LM Studio', value: 'lmstudio' },
  { label: 'Ollama', value: 'ollama' },
  { label: 'ChatGPT', value: 'chatgpt' },
];

const defaultConfig: LLMConfig = {
  backendType: 'lmstudio',
  lmstudio: { url: 'http://localhost:1234' },
  ollama: { url: 'http://localhost:11434' },
  chatgpt: { apiKey: '' },
};

const Settings: React.FC = () => {
  const [config, setConfig] = useState<LLMConfig>(defaultConfig);
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Load settings from backend
  useEffect(() => {
    fetchLLMSettings().then((data) => {
      if (data) setConfig({ ...defaultConfig, ...data });
    });
  }, []);

  // Test connection
  const handleTestConnection = async () => {
    setTestStatus('idle');
    setTestMessage('');
    setLoading(true);
    try {
      const result = await testLLMConnection(config);
      if (result.status === 'connected') {
        setTestStatus('success');
        setTestMessage('Connected! Models: ' + (result.models?.join(', ') || 'none'));
      } else {
        setTestStatus('error');
        setTestMessage(result.error || 'Connection failed');
      }
    } catch (e) {
      setTestStatus('error');
      setTestMessage('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  // Save settings
  const handleSave = async () => {
    await saveLLMSettings(config);
    setSaveMessage('Settings saved!');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  // Handle backend type change
  const handleBackendChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const backendType = e.target.value as BackendType;
    setConfig((prev) => ({
      ...defaultConfig,
      ...prev,
      backendType,
    }));
  };

  // Handle config field changes
  const handleConfigChange = (field: string, value: string) => {
    setConfig((prev) => {
      if (prev.backendType === 'lmstudio') {
        return { ...prev, lmstudio: { url: value } };
      } else if (prev.backendType === 'ollama') {
        return { ...prev, ollama: { url: value } };
      } else if (prev.backendType === 'chatgpt') {
        return { ...prev, chatgpt: { apiKey: value } };
      }
      return prev;
    });
  };

  // Render dynamic config form
  const renderConfigForm = () => {
    switch (config.backendType) {
      case 'lmstudio':
        return (
          <div className="form-row">
            <label>LM Studio URL:</label>
            <input
              type="text"
              value={config.lmstudio?.url || ''}
              onChange={(e) => handleConfigChange('url', e.target.value)}
              placeholder="http://localhost:1234"
              className="settings-input"
            />
          </div>
        );
      case 'ollama':
        return (
          <div className="form-row">
            <label>Ollama URL:</label>
            <input
              type="text"
              value={config.ollama?.url || ''}
              onChange={(e) => handleConfigChange('url', e.target.value)}
              placeholder="http://localhost:11434"
              className="settings-input"
            />
          </div>
        );
      case 'chatgpt':
        return (
          <div className="form-row">
            <label>OpenAI API Key:</label>
            <input
              type="password"
              value={config.chatgpt?.apiKey || ''}
              onChange={(e) => handleConfigChange('apiKey', e.target.value)}
              placeholder="sk-..."
              className="settings-input"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="settings-container dark-settings">
      <h2 className="settings-title">LLM Backend Settings</h2>
      <section className="settings-section">
        <div className="form-row">
          <label>Backend:</label>
          <select value={config.backendType} onChange={handleBackendChange} className="settings-input">
            {backendOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {renderConfigForm()}
        <div className="button-row">
          <button className="settings-btn primary-btn" onClick={handleSave} disabled={loading}>
            Save Settings
          </button>
          <button className="settings-btn secondary-btn" onClick={handleTestConnection} disabled={loading}>
            {loading ? 'Testing...' : 'Test Connection'}
          </button>
        </div>
        {saveMessage && <div className="message success-message">{saveMessage}</div>}
        {testMessage && (
          <div className={`message ${testStatus === 'success' ? 'success-message' : 'error-message'}`}>{testMessage}</div>
        )}
      </section>
    </div>
  );
};

export default Settings;
