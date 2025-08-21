import React, { useEffect, useState } from 'react';
import { fetchLLMSettings, saveLLMSettings, testLLMConnection } from '../../services/llmBackend';
import { BackendType, LLMConfig } from '../../types/LLMTypes';
import '../admin/AdminPanel.css';

const backendOptions: { label: string; value: BackendType }[] = [
  { label: 'LM Studio', value: 'lmstudio' },
  { label: 'Ollama', value: 'ollama' },
  { label: 'ChatGPT', value: 'chatgpt' },
  { label: 'GitHub Models', value: 'github' },
];

const defaultConfig: LLMConfig = {
  backendType: 'lmstudio',
  lmstudio: { url: 'http://localhost:1234' },
  ollama: { url: 'http://localhost:11434' },
  chatgpt: { apiKey: '' },
  github: { githubToken: '' },
  showThinking: false,
};

const LLMSettings: React.FC = () => {
  const [config, setConfig] = useState<LLMConfig>(defaultConfig);
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');

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
    } catch {
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

  // Refresh models
  const handleRefreshModels = async () => {
    setRefreshing(true);
    setRefreshMessage('');
    try {
      const response = await fetch('/api/settings/llm/models/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      
      if (result.refreshed) {
        setRefreshMessage(`Refreshed! Found ${result.models?.length || 0} models.`);
      } else {
        setRefreshMessage(result.error || 'Failed to refresh models');
      }
    } catch {
      setRefreshMessage('Failed to refresh models');
    } finally {
      setRefreshing(false);
      setTimeout(() => setRefreshMessage(''), 3000);
    }
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
      } else if (prev.backendType === 'github') {
        return { ...prev, github: { githubToken: value } };
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
      case 'github':
        return (
          <div className="form-row">
            <label>GitHub Token:</label>
            <input
              type="password"
              value={config.github?.githubToken || ''}
              onChange={(e) => handleConfigChange('githubToken', e.target.value)}
              placeholder="ghp_..."
              className="settings-input"
            />
            <div className="help-text">
              GitHub personal access token for accessing GitHub Models API at https://models.github.ai
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="section llm-settings">
      <h2>LLM Backend Settings</h2>
      <div className="section-content">
        <div className="form-row">
          <label>Backend:</label>
          <select value={config.backendType} onChange={handleBackendChange} className="settings-input">
            {backendOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {renderConfigForm()}
        <div className="form-row">
          <label>
            <input
              type="checkbox"
              checked={config.showThinking || false}
              onChange={(e) => setConfig(prev => ({ ...prev, showThinking: e.target.checked }))}
              style={{ marginRight: '8px' }}
            />
            Show reasoning model thinking process (displays &lt;think&gt; content)
          </label>
        </div>
        <div className="button-row">
          <button className="settings-btn primary-btn" onClick={handleSave} disabled={loading}>
            Save Settings
          </button>
          <button className="settings-btn secondary-btn" onClick={handleTestConnection} disabled={loading}>
            {loading ? 'Testing...' : 'Test Connection'}
          </button>
          <button className="settings-btn secondary-btn" onClick={handleRefreshModels} disabled={refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh Models'}
          </button>
        </div>
        {saveMessage && <div className="message success-message">{saveMessage}</div>}
        {testMessage && (
          <div className={`message ${testStatus === 'success' ? 'success-message' : 'error-message'}`}>{testMessage}</div>
        )}
        {refreshMessage && <div className="message success-message">{refreshMessage}</div>}
      </div>
    </div>
  );
};

export default LLMSettings;
