// frontend/src/services/llmService.ts
import { AI_STATUS } from '../contexts/AIStatusContext';
import { llmCompletionRequestMessage, LLMMessage } from '../types/LLMTypes';
import { getToken } from './security';

export interface LLMChatOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  keepAlive?: string;
  signal?: AbortSignal;
}

export type LLMStreamCallback = (chunk: string, isDone: boolean) => void;

const BACKEND_URL = 'http://localhost:5000';
const LLM_PROXY_ENDPOINT = `${BACKEND_URL}/proxy/llm/v1/chat/completions`;

/**
 * Streams chat completion from the LLM backend, calling onStream for each content chunk.
 * @param messages Chat history
 * @param onStream Callback for each content chunk
 * @param options Model and generation options
 */
function buildMessagesFromRequest(msg: llmCompletionRequestMessage): LLMMessage[] {
  const messages: LLMMessage[] = [];
  if (msg.systemMessage) {
    messages.push({ role: 'system', content: msg.systemMessage });
  }
  if (msg.userMessage) {
    messages.push({ role: 'user', content: msg.userMessage });
  }
  return messages;
}

/**
 * Helper to handle 409 and update context
 * @param response fetch response
 * @param setAiStatus function to set AI status
 * @param setShowAIBusyModal function to show busy modal
 */
export async function handle409Error(response: Response, setAiStatus: (s: AI_STATUS) => void, setShowAIBusyModal: (b: boolean) => void) {
  if (response.status === 409) {
    setAiStatus(AI_STATUS.BUSY);
    setShowAIBusyModal(true);
    throw new Error('409');
  }
}

/**
 * Streaming chat completion with AI status context handling.
 * @param prompt
 * @param onStream
 * @param options
 * @param setAiStatus
 * @param setShowAIBusyModal
 */
export async function streamChatCompletionWithStatus(
  prompt: llmCompletionRequestMessage,
  onStream: LLMStreamCallback,
  options: LLMChatOptions = {},
  setAiStatus: (s: AI_STATUS) => void,
  setShowAIBusyModal: (b: boolean) => void
): Promise<void> {
  try {
    const messages = buildMessagesFromRequest(prompt);
    const payload: any = {
      model: options.model || '',
      messages,
      temperature: options.temperature ?? 0.8,
      max_tokens: options.max_tokens ?? 1024,
    };
    
    // Only include keep_alive if explicitly requested
    if (options.keepAlive) {
      payload.keep_alive = options.keepAlive;
    }
    
    if (!options.model || options.model.trim() === '') {
      throw new Error('Model must be specified');
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(LLM_PROXY_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: options.signal,
    });
    
    await handle409Error(response, setAiStatus, setShowAIBusyModal);
    
    // Handle other error status codes
    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        if (response.status === 402) {
          // Insufficient credits error
          errorMessage = errorData.error || 'Insufficient credits to complete this request. Please purchase more credits to continue.';
        } else {
          errorMessage = errorData.error || errorData.message || errorMessage;
        }
      } catch (e) {
        // If we can't parse the error response, use the default message
      }
      throw new Error(errorMessage);
    }
    
    if (!response.body) throw new Error('No response body');
    const reader = response.body.getReader();
    let done = false;
    let assistantText = '';
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      if (value) {
        const chunk = new TextDecoder().decode(value);
        // eslint-disable-next-line
        chunk.split('\n').forEach(line => {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                const content = parsed.choices[0].delta.content;
                assistantText += content;
                onStream(content, false);
              }
            } catch (e) {
              // Ignore malformed lines
            }
          }
        });
      }
    }
    onStream(assistantText, true);
  } catch (err) {
    setAiStatus(AI_STATUS.IDLE);
    setShowAIBusyModal(false);
    throw err;
  }
}

/**
 * Non-streaming chat completion with AI status context handling.
 * @param prompt
 * @param options
 * @param setAiStatus
 * @param setShowAIBusyModal
 */
export async function chatCompletionWithStatus(
  prompt: llmCompletionRequestMessage,
  options: LLMChatOptions = {},
  setAiStatus: (s: AI_STATUS) => void,
  setShowAIBusyModal: (b: boolean) => void
): Promise<string> {
  const messages = buildMessagesFromRequest(prompt);
  const payload: any = {
    model: options.model || '',
    messages,
    temperature: options.temperature ?? 0.8,
    max_tokens: options.max_tokens ?? 1024,
    stream: false,
  };
  
  // Only include keep_alive if explicitly requested
  if (options.keepAlive) {
    payload.keep_alive = options.keepAlive;
  }
  
  if (!options.model || options.model.trim() === '') {
    throw new Error('Model must be specified');
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await fetch(LLM_PROXY_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal: options.signal,
  });
  
  await handle409Error(response, setAiStatus, setShowAIBusyModal);
  
  if (!response.ok) {
    setAiStatus(AI_STATUS.ERROR);
    let errorMessage = `LLM backend error: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (response.status === 402) {
        // Insufficient credits error
        errorMessage = errorData.error || 'Insufficient credits to complete this request. Please purchase more credits to continue.';
      } else {
        errorMessage = errorData.error || errorData.message || errorMessage;
      }
    } catch (e) {
      // If we can't parse the error response, use the default message
    }
    throw new Error(errorMessage);
  }
  const data = await response.json();
  const choices = data.choices || [];
  setAiStatus(AI_STATUS.IDLE);
  if (choices.length === 0) return '';
  return choices[0].message?.content || '';
}

export type { LLMMessage };
