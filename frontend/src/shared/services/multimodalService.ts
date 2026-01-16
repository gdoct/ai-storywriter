// frontend/src/services/multimodalService.ts
import { LLMMessage } from '../types/LLMTypes';
import { MaxTokensService, TokenContext } from './maxTokensService';
import { getToken } from './security';
import { getBYOKHeaders, isUserInBYOKMode } from './settings';

export interface MultimodalChatOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  signal?: AbortSignal;
}

export type MultimodalStreamCallback = (chunk: string, isDone: boolean) => void;

// Auto-detect if we're running in dev mode (localhost:3000) or production 
const isDevMode = window.location.port === '3000';
const backendUrl = import.meta.env.VITE_API_URL;
const MULTIMODAL_PROXY_ENDPOINT = isDevMode && backendUrl
  ? `${backendUrl}/api/proxy/multimodal/v1/chat/completions`
  : '/api/proxy/multimodal/v1/chat/completions';

const MULTIMODAL_MODELS_ENDPOINT = isDevMode && backendUrl
  ? `${backendUrl}/api/proxy/multimodal/v1/models`
  : '/api/proxy/multimodal/v1/models';

const MULTIMODAL_STATUS_ENDPOINT = isDevMode && backendUrl
  ? `${backendUrl}/api/proxy/multimodal/v1/status`
  : '/api/proxy/multimodal/v1/status';

/**
 * Fetch available multimodal models
 */
export async function fetchMultimodalModels(): Promise<string[]> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    // Add BYOK headers if user is in BYOK mode
    const isInBYOKMode = await isUserInBYOKMode();
    if (isInBYOKMode) {
      const byokHeaders = getBYOKHeaders();
      Object.assign(headers, byokHeaders);
    }
    
    const response = await fetch(MULTIMODAL_MODELS_ENDPOINT, {
      headers
    });
    
    if (!response.ok) {
      console.error('Failed to fetch multimodal models:', response.status);
      return [];
    }
    
    const data = await response.json();
    return data.data ? data.data.map((model: any) => model.id) : [];
  } catch (error) {
    console.error('Error fetching multimodal models:', error);
    return [];
  }
}

/**
 * Get multimodal service status
 */
export async function getMultimodalStatus(): Promise<{busy: boolean}> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(MULTIMODAL_STATUS_ENDPOINT, {
      headers
    });
    
    if (!response.ok) {
      return { busy: false };
    }
    
    const data = await response.json();
    return { busy: data.busy || false };
  } catch (error) {
    console.error('Error checking multimodal status:', error);
    return { busy: false };
  }
}

/**
 * Stream multimodal chat completion with vision support
 */
export async function streamMultimodalChatCompletion(
  messages: LLMMessage[],
  onStream: MultimodalStreamCallback,
  options: MultimodalChatOptions = {}
): Promise<void> {
  try {
    const payload: any = {
      model: options.model || 'gpt-4-vision-preview',
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: MaxTokensService.getMaxTokens(TokenContext.VISION_DETAILED, options.max_tokens),
    };
    
    if (!options.model || options.model.trim() === '') {
      throw new Error('Model must be specified for multimodal chat');
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    // Add BYOK headers if user is in BYOK mode
    const isInBYOKMode = await isUserInBYOKMode();
    if (isInBYOKMode) {
      const byokHeaders = getBYOKHeaders();
      Object.assign(headers, byokHeaders);
    }
    
    const response = await fetch(MULTIMODAL_PROXY_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: options.signal,
    });
    
    // Handle error status codes
    if (!response.ok) {
      let errorMessage = `Multimodal request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        if (response.status === 402) {
          errorMessage = errorData.detail || 'Insufficient credits for multimodal AI';
        } else if (response.status === 403) {
          errorMessage = errorData.detail || 'Multimodal AI not enabled for your account';
        } else if (response.status === 429) {
          errorMessage = errorData.detail || 'Multimodal AI is currently busy, please try again';
        } else {
          errorMessage = errorData.detail || errorData.error || errorMessage;
        }
      } catch (e) {
        console.error('Error parsing multimodal service error response:', e);
      }
      throw new Error(errorMessage);
    }
    
    if (!response.body) throw new Error('No response body from multimodal service');
    
    const reader = response.body.getReader();
    let done = false;
    let fullContent = '';
    
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      
      if (value) {
        const chunk = new TextDecoder().decode(value);
        chunk.split('\n').forEach(line => {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                const content = parsed.choices[0].delta.content;
                fullContent += content;
                onStream(content, false);
              } else if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
                console.error('Error parsing multimodal SSE chunk:', e);
              }
            }
          }
        });
      }
    }
    
    onStream('', true); // Signal completion
  } catch (error) {
    console.error('Multimodal chat completion error:', error);
    throw error;
  }
}

/**
 * Create a multimodal message with image content
 */
export function createMultimodalMessage(
  text: string, 
  imageUrl?: string | File, 
  role: 'user' | 'assistant' = 'user'
): LLMMessage {
  const content: any[] = [
    {
      type: 'text',
      text: text
    }
  ];
  
  if (imageUrl) {
    if (typeof imageUrl === 'string') {
      // URL or base64 data URL
      content.push({
        type: 'image_url',
        image_url: {
          url: imageUrl
        }
      });
    } else {
      // File object - convert to data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          content.push({
            type: 'image_url',
            image_url: {
              url: e.target.result as string
            }
          });
        }
      };
      reader.readAsDataURL(imageUrl);
    }
  }
  
  return {
    role,
    content: content as any // Type assertion to satisfy LLMMessage type
  };
}

/**
 * Helper to convert File to base64 data URL
 */
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to convert file to data URL'));
      }
    };
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
}