import { LLMConfig } from '../types/LLMTypes';
import { createWritingStylePrompt } from './llmPromptService';

const API_BASE = '/api/settings/llm';

export async function fetchLLMSettings(): Promise<LLMConfig | null> {
  const res = await fetch(API_BASE);
  if (!res.ok) return null;
  
  const backendData = await res.json();
  if (!backendData.backend_type) return null;

  // Transform backend format to frontend format
  const frontendConfig: LLMConfig = {
    backendType: backendData.backend_type,
    lmstudio: { url: 'http://192.168.32.1:1234' }, // default
    ollama: { url: 'http://localhost:11434' }, // default
    chatgpt: { apiKey: '' }, // default
    defaultModel: backendData.default_model || '',
  };

  // Update the specific backend config
  if (backendData.backend_type === 'lmstudio' && backendData.config) {
    frontendConfig.lmstudio = { url: backendData.config.url || 'http://192.168.32.1:1234' };
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
    config: backendConfig,
    default_model: config.defaultModel
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
      modelName: settings?.defaultModel || (statusData.models && statusData.models[0]) || '',
      backendType: statusData.backend_type || settings?.backendType || '',
    };
  } catch (error) {
    console.error("Failed to check LLM status:", error);
    return { isConnected: false, modelName: '' };
  }
}

// Proxy call to backend for LLM completions (streaming, real SSE implementation)
export async function generateStreamingCompletion({ prompt, onProgress, temperature, seed, max_tokens }: {
  prompt: string,
  onProgress: (text: string) => void,
  temperature?: number,
  seed?: number | null,
  max_tokens?: number
}): Promise<string> {
  // Real SSE streaming implementation
  const payload = {
    model: undefined, // let backend use default
    messages: [{ role: 'user', content: prompt }],
    temperature,
    max_tokens,
    seed
  };
  const response = await fetch('/proxy/llm/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok || !response.body) {
    throw new Error('Failed to connect to LLM backend');
  }
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let done = false;
  let fullText = '';
  let buffer = '';
  
  // Process stream similarly to how ChatTab does it
  while (!done) {
    const { value, done: streamDone } = await reader.read();
    done = streamDone;
    
    if (value) {
      // Decode the chunk
      const chunk = decoder.decode(value, { stream: true });
      
      // Process every line that starts with 'data: '
      chunk.split('\n').forEach(line => {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            done = true;
            return;
          }
          
          try {
            const json = JSON.parse(data);
            const choices = json.choices || [];
            
            for (const choice of choices) {
              const delta = choice.delta || {};
              const content = delta.content;
              
              if (content) {
                fullText += content;
                // Call onProgress immediately for each content piece
                onProgress(content);
              }
            }
          } catch (e) {
            console.error('Failed to parse SSE chunk:', e);
          }
        }
      });
    }
  }
  
  return fullText;
}

// Generate a random writing style using the backend
export async function generateRandomWritingStyle(options: any = {}): Promise<{ result: Promise<any>; cancelGeneration: () => void }> {
  const prompt = createWritingStylePrompt();
  let cancelled = false;
  let cancelGeneration = () => { cancelled = true; };
  const resultPromise = new Promise<any>(async (resolve, reject) => {
    try {
      // Only support streaming completions now
      let fullText = '';
      await generateStreamingCompletion({
        prompt,
        onProgress: (chunk) => { fullText += chunk; },
        ...options
      });
      if (!cancelled) resolve(fullText);
    } catch (e) { reject(e); }
  });
  return { result: resultPromise, cancelGeneration };
}

// Generate a random character using the backend
export async function generateRandomCharacter(scenario: any, characterType: string, options: any = {}): Promise<{ result: Promise<any>; cancelGeneration: () => void }> {
  const prompt = `Create a random ${characterType} character for the following scenario. Format as JSON.\n\n${JSON.stringify(scenario)}`;
  let cancelled = false;
  let cancelGeneration = () => { cancelled = true; };
  const resultPromise = new Promise<any>(async (resolve, reject) => {
    try {
      let fullText = '';
      await generateStreamingCompletion({
        prompt,
        onProgress: (chunk) => { fullText += chunk; },
        ...options
      });
      if (!cancelled) resolve(fullText);
    } catch (e) { reject(e); }
  });
  return { result: resultPromise, cancelGeneration };
}

// Generate a random scenario name using the backend
export async function generateRandomScenarioName(options: any = {}): Promise<{ result: Promise<string>; cancelGeneration: () => void }> {
  const prompt = `Suggest a creative scenario title${options.theme ? ' for the theme: ' + options.theme : ''}${options.genre ? ' in the genre: ' + options.genre : ''}.`;
  let cancelled = false;
  let cancelGeneration = () => { cancelled = true; };
  const resultPromise = new Promise<string>(async (resolve, reject) => {
    try {
      let fullText = '';
      await generateStreamingCompletion({
        prompt,
        onProgress: (chunk) => { fullText += chunk; },
        ...options
      });
      if (!cancelled) resolve(fullText);
    } catch (e) { reject(e); }
  });
  return { result: resultPromise, cancelGeneration };
}
