// THIS FILE IS DEPRECATED
// DO NOT USE THIS FILE

import { LLMConfig } from '../types/LLMTypes';
import { getSelectedModel } from './modelSelection';

const API_BASE = '/api/settings/llm';

export async function fetchLLMSettings(): Promise<LLMConfig | null> {
  const res = await fetch(API_BASE);
  if (!res.ok) return null;
  
  const backendData = await res.json();
  // console.log('[DEBUG] fetchLLMSettings received:', backendData); // Debug log
  
  if (!backendData.backend_type) return null;

  // Transform backend format to frontend format - normalize backend_type
  let normalizedBackendType = backendData.backend_type;
  if (normalizedBackendType === 'openai') {
    normalizedBackendType = 'chatgpt'; // Normalize openai to chatgpt
  }

  const frontendConfig: LLMConfig = {
    backendType: normalizedBackendType,
    lmstudio: { url: 'http://localhost:1234' }, // default
    ollama: { url: 'http://localhost:11434' }, // default
    chatgpt: { apiKey: '' }, // default
    github: { githubToken: '' }, // default
    showThinking: backendData.showThinking || false, // Get from backend response
  };

  // Update the specific backend config with more robust mapping
  const config = backendData.config || {};
  // console.log('[DEBUG] Backend config object:', config); // Debug log
  
  if (backendData.backend_type === 'lmstudio') {
    frontendConfig.lmstudio = { 
      url: config.url || backendData.base_url || 'http://localhost:1234' 
    };
  } else if (backendData.backend_type === 'ollama') {
    frontendConfig.ollama = { 
      url: config.url || backendData.base_url || 'http://localhost:11434' 
    };
  } else if (normalizedBackendType === 'chatgpt') {
    frontendConfig.chatgpt = { 
      apiKey: config.api_key || config.apiKey || '' 
    };
  } else if (backendData.backend_type === 'github') {
    frontendConfig.github = { 
      githubToken: config.githubToken || config.github_token || '' 
    };
  }

  return frontendConfig;
}

export async function saveLLMSettings(config: LLMConfig): Promise<LLMConfig | null> {
  // Transform frontend config to backend format
  let backendConfig: any = {};
  
  if (config.backendType === 'lmstudio' && config.lmstudio) {
    backendConfig = config.lmstudio;
  } else if (config.backendType === 'ollama' && config.ollama) {
    backendConfig = config.ollama;
  } else if (config.backendType === 'chatgpt' && config.chatgpt) {
    backendConfig = { api_key: config.chatgpt.apiKey };
  } else if (config.backendType === 'github' && config.github) {
    backendConfig = { githubToken: config.github.githubToken };
  }

  const saveData = {
    backend_type: config.backendType,
    config: backendConfig,
    showThinking: config.showThinking || false // Include showThinking field
  };

  // console.log('[DEBUG] Saving LLM settings:', saveData); // Debug log

  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(saveData),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('[DEBUG] Save failed:', res.status, errorText);
    return null;
  }
  
  const result = await res.json();
  // console.log('[DEBUG] Save result:', result);
  return result;
}

export async function testLLMConnection(config: LLMConfig): Promise<any> {
  // Transform frontend config to backend format
  let backendConfig: any = {};
  
  if (config.backendType === 'lmstudio' && config.lmstudio) {
    backendConfig = config.lmstudio;
  } else if (config.backendType === 'ollama' && config.ollama) {
    backendConfig = config.ollama;
  } else if (config.backendType === 'chatgpt' && config.chatgpt) {
    backendConfig = { api_key: config.chatgpt.apiKey };
  } else if (config.backendType === 'github' && config.github) {
    backendConfig = { githubToken: config.github.githubToken };
  }

  const testData = {
    backend_type: config.backendType,
    config: backendConfig
  };

  const res = await fetch(`${API_BASE}/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testData),
  });
  return await res.json();
}

export async function fetchLLMModels(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/models`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.models || [];
}

export async function getLLMStatus(): Promise<{isConnected: boolean, modelName: string, backendType?: string}> {
  try {
    // Use the new status endpoint
    const res = await fetch(`${API_BASE}/status`);
    if (!res.ok) {
      return { isConnected: false, modelName: '' };
    }
    
    const statusData = await res.json();
    
    // Get settings for additional info if needed
    const settings = await fetchLLMSettings();
    
    return {
      isConnected: statusData.status === 'connected',
      modelName: getSelectedModel() || (statusData.models && statusData.models[0]) || '',
      backendType: statusData.backend_type || settings?.backendType || '',
    };
  } catch (error) {
    console.error("Failed to check LLM status:", error);
    return { isConnected: false, modelName: '' };
  }
}
