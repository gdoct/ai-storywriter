// THIS FILE IS DEPRECATED
// DO NOT USE THIS FILE

import { LLMConfig } from '../types/LLMTypes';
import { getSelectedModel } from './modelSelection';

const API_BASE = '/api/settings/llm';

export async function fetchLLMSettings(): Promise<LLMConfig | null> {
  const res = await fetch(API_BASE);
  if (!res.ok) return null;
  
  const backendData = await res.json();
  if (!backendData.backend_type) return null;

  // Transform backend format to frontend format
  const frontendConfig: LLMConfig = {
    backendType: backendData.backend_type,
    lmstudio: { url: 'http://localhost:1234' }, // default
    ollama: { url: 'http://localhost:11434' }, // default
    chatgpt: { apiKey: '' }, // default
  };

  // Update the specific backend config
  if (backendData.backend_type === 'lmstudio' && backendData.config) {
    frontendConfig.lmstudio = { url: backendData.config.url || 'http://localhost:1234' };
  } else if (backendData.backend_type === 'ollama' && backendData.config) {
    frontendConfig.ollama = { url: backendData.config.url || 'http://localhost:11434' };
  } else if (backendData.backend_type === 'chatgpt' && backendData.config) {
    frontendConfig.chatgpt = { apiKey: backendData.config.api_key || '' };
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
  }

  const saveData = {
    backend_type: config.backendType,
    config: backendConfig
  };

  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(saveData),
  });
  if (!res.ok) return null;
  return await res.json();
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
