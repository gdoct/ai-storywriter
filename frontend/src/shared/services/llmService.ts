// frontend/src/services/llmService.ts
import { AI_STATUS } from '../contexts/AIStatusContext';
import { llmCompletionRequestMessage, LLMMessage } from '../types/LLMTypes';
import { getToken } from './security';
import { getBYOKHeaders, isUserInBYOKMode } from './settings';

export interface LLMChatOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  keepAlive?: string;
  signal?: AbortSignal;
}

export type LLMStreamCallback = (chunk: string, isDone: boolean) => void;

export interface ThinkingContent {
  thinking: string;
  response: string;
  isThinking: boolean;
  isDone: boolean;
}

export type LLMThinkingStreamCallback = (content: ThinkingContent) => void;

// Auto-detect if we're running in dev mode (localhost:3000) or production 
const isDevMode = window.location.port === '3000';
const backendUrl = import.meta.env.VITE_API_URL;
const LLM_PROXY_ENDPOINT = isDevMode && backendUrl
  ? `${backendUrl}/api/proxy/llm/v1/chat/completions`
  : '/api/proxy/llm/v1/chat/completions';
const LLM_FRONTEND_ENDPOINT = isDevMode && backendUrl
  ? `${backendUrl}/api/proxy/llm/v1/frontend/chat/completions`
  : '/api/proxy/llm/v1/frontend/chat/completions';

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
 * Simple streaming chat completion for AI buttons (synopsis, title generation)
 * Uses the dedicated simple endpoint to avoid agent processing interference.
 * @param prompt
 * @param onStream
 * @param options
 * @param setAiStatus
 * @param setShowAIBusyModal
 */
export async function streamSimpleChatCompletionWithStatus(
  prompt: llmCompletionRequestMessage,
  onStream: LLMStreamCallback,
  options: LLMChatOptions = {},
  setAiStatus: (s: AI_STATUS) => void,
  setShowAIBusyModal: (b: boolean) => void
): Promise<void> {
  try {
    const messages = buildMessagesFromRequest(prompt);
    const payload: any = {
      model: options.model || 'google/gemma-3-4b',
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
    
    // Add BYOK headers if user is in BYOK mode
    const isInBYOKMode = await isUserInBYOKMode();
    if (isInBYOKMode) {
      const byokHeaders = getBYOKHeaders();
      Object.assign(headers, byokHeaders);
    }
    
    const response = await fetch(LLM_FRONTEND_ENDPOINT, {
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
        console.error('Error parsing simple chat service error response:', e);
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
              console.error('Error parsing simple SSE chunk:', e);
            }
          }
        });
      }
    }
    onStream('', true);  // Signal completion without sending duplicate text
  } catch (err) {
    setAiStatus(AI_STATUS.IDLE);
    setShowAIBusyModal(false);
    throw err;
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
      model: options.model || 'google/gemma-3-4b',
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
    
    // Add BYOK headers if user is in BYOK mode
    const isInBYOKMode = await isUserInBYOKMode();
    if (isInBYOKMode) {
      const byokHeaders = getBYOKHeaders();
      Object.assign(headers, byokHeaders);
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
        console.error('Error parsing chat service error response:', e);
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
              console.error('Error parsing SSE chunk:', e);
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
 * Enhanced streaming chat completion that can handle reasoning model thinking output.
 * @param prompt
 * @param onStream
 * @param options  
 * @param setAiStatus
 * @param setShowAIBusyModal
 */
export async function streamChatCompletionWithThinking(
  prompt: llmCompletionRequestMessage,
  onStream: LLMThinkingStreamCallback,
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
    
    // Add BYOK headers if user is in BYOK mode
    const isInBYOKMode = await isUserInBYOKMode();
    if (isInBYOKMode) {
      const byokHeaders = getBYOKHeaders();
      Object.assign(headers, byokHeaders);
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
        console.error('Error parsing chat service error response:', e); // Debug log
      }
      throw new Error(errorMessage);
    }
    
    if (!response.body) throw new Error('No response body');
    const reader = response.body.getReader();
    let done = false;
    let thinkingContent = '';
    let responseContent = '';
    let isInsideThinking = false;

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
                
                // Parse thinking tags
                const parseThinking = (text: string) => {
                  let currentText = text;
                  let thinking = thinkingContent;
                  let response = responseContent;
                  let insideThinking = isInsideThinking;
                  
                  // console.log('Parsing chunk:', text, 'insideThinking:', insideThinking); // Debug log
                  
                  // Handle opening think tag
                  if (currentText.includes('<think>')) {
                    // console.log('Found <think> tag!'); // Debug log
                    const parts = currentText.split('<think>');
                    for (let i = 0; i < parts.length; i++) {
                      if (i === 0) {
                        // Content before first <think> tag
                        if (!insideThinking) {
                          response += parts[i];
                        } else {
                          thinking += parts[i];
                        }
                      } else {
                        // Content after <think> tag
                        insideThinking = true;
                        thinking += parts[i];
                      }
                    }
                    currentText = '';
                  }
                  
                  // Handle closing think tag
                  if (thinking.includes('</think>')) {
                    // console.log('Found </think> tag!'); // Debug log
                    const parts = thinking.split('</think>');
                    thinking = parts[0]; // Keep only content before </think>
                    insideThinking = false;
                    // Content after </think> goes to response
                    for (let i = 1; i < parts.length; i++) {
                      response += parts[i];
                    }
                    // Add any remaining current text to response
                    response += currentText;
                  } else if (currentText && !insideThinking) {
                    response += currentText;
                  } else if (currentText && insideThinking) {
                    thinking += currentText;
                  }
                  
                  return { thinking, response, insideThinking };
                };
                
                const parsed_content = parseThinking(content);
                thinkingContent = parsed_content.thinking;
                responseContent = parsed_content.response;
                isInsideThinking = parsed_content.insideThinking;
                
                onStream({
                  thinking: thinkingContent,
                  response: responseContent,
                  isThinking: isInsideThinking,
                  isDone: false
                });
              }
            } catch (e) {
              // Ignore malformed lines
              console.error('Error parsing SSE chunk:', e);
            }
          }
        });
      }
    }
    
    onStream({
      thinking: thinkingContent,
      response: responseContent,
      isThinking: false,
      isDone: true
    });
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
      console.error('Error parsing chat service error response:', e);
    }
    throw new Error(errorMessage);
  }
  const data = await response.json();
  const choices = data.choices || [];
  setAiStatus(AI_STATUS.IDLE);
  if (choices.length === 0) return '';
  return choices[0].message?.content || '';
}

/**
 * Non-streaming chat completion with AI status context handling.
 * @param prompt
 * @param options
 * @param setAiStatus
 * @param setShowAIBusyModal
 */
export async function chatCompletion(
  prompt: llmCompletionRequestMessage,
  options: LLMChatOptions = {},
  token: string | null = null
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
  
  const usertoken = token ?? getToken();
  if (usertoken) {
    headers.Authorization = `Bearer ${usertoken}`;
  }
  
  const response = await fetch(LLM_PROXY_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal: options.signal,
  });
  
   if (response.status === 409) {
    throw new Error('409');
  }
  
  if (!response.ok) {
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
      console.error('Error parsing chat service error response:', e);
      // If we can't parse the error response, use the default message
    }
    throw new Error(errorMessage);
  }
  // read response to a string non-json plain text
  if (!response.body) {
    throw new Error('Response body is null');
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let done = false;
  let assistantText = '';
  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    const chunk = decoder.decode(value, { stream: !done });

    // Process each "data:" line
    const lines = chunk.split('\n').filter(line => line.startsWith('data:'));
    for (const line of lines) {
      try {
        const dataContent = line.slice(5).trim(); // Remove "data:" prefix
        if (dataContent === "[DONE]") {
          break; // End of stream
        }
        const json = JSON.parse(dataContent); // Parse JSON
        const content = json.choices?.[0]?.delta?.content;
        if (content) {
          assistantText += content;
        }
      } catch (error) {
        console.error('Failed to parse chunk:', line, error);
      }
    }
  }

  return assistantText;
}

export type { LLMMessage };
