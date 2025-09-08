// THIS FILE IS DEPRECATED
// DO NOT USE THIS FILE

import { LLMConfig } from '../types/LLMTypes';
import { getSelectedModel } from './modelSelection';
import { getToken } from './security';

const API_BASE = '/api/settings/llm';

// Helper function to get BYOK headers
function getBYOKHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  // Add authentication token
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Add BYOK credentials if available
  const byokCredentials = localStorage.getItem('storywriter_byok_credentials');
  if (byokCredentials) {
    try {
      const credentials = JSON.parse(byokCredentials);
      if (credentials.apiKey) {
        headers['X-BYOK-API-Key'] = credentials.apiKey;
        headers['X-BYOK-Provider'] = credentials.provider;
        if (credentials.baseUrl) {
          headers['X-BYOK-Base-URL'] = credentials.baseUrl;
        }
      }
    } catch (error) {
      console.error('Error parsing BYOK credentials:', error);
    }
  }
  
  return headers;
}

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

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  
  // Add authentication token
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(API_BASE, {
    method: 'POST',
    headers,
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
  // Use the newer proxy endpoint that respects BYOK mode
  const headers = getBYOKHeaders();
  
  // Use the same base URL logic as llmService.ts
  const isDevMode = window.location.port === '3000';
  const backendUrl = import.meta.env.VITE_API_URL;
  const modelsEndpoint = isDevMode && backendUrl
    ? `${backendUrl}/api/proxy/llm/v1/models`
    : '/api/proxy/llm/v1/models';
  
  const res = await fetch(modelsEndpoint, {
    headers
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data ? data.data.map((model: any) => model.id) : [];
}

export async function getLLMStatus(): Promise<{isConnected: boolean, modelName: string, backendType?: string}> {
  try {
    // Use the new status endpoint with BYOK headers
    const headers = getBYOKHeaders();
    const res = await fetch(`${API_BASE}/status`, { headers });
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
