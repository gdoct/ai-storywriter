// frontend/src/services/chatService.ts
import { llmCompletionRequestMessage } from '../types/LLMTypes';
import { getToken } from './security';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  followUpQuestions?: string[];
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  signal?: AbortSignal;
}

export type ChatStreamCallback = (chunk: string, isDone: boolean) => void;

const BACKEND_URL = 'http://localhost:5000';
const CHAT_ENDPOINT = `${BACKEND_URL}/api/chat/completions`;

/**
 * Dedicated chat service for the ChatAgent component.
 * Uses its own endpoint separate from the main LLM proxy.
 */
export class ChatService {
  private static instance: ChatService;

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  /**
   * Stream chat completion specifically for the chat agent
   */
  async streamChatCompletion(
    prompt: llmCompletionRequestMessage,
    onStream: ChatStreamCallback,
    options: ChatOptions = {}
  ): Promise<void> {
    const messages = this.buildMessagesFromRequest(prompt);
    
    const payload = {
      model: options.model || 'default',
      messages,
      temperature: options.temperature ?? 0.8,
      max_tokens: options.max_tokens ?? 1024,
      stream: true,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(CHAT_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: options.signal,
      });

      if (!response.ok) {
        let errorMessage = `Chat service error: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // Use default error message if JSON parsing fails
        }
        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error('No response body from chat service');
      }

      const reader = response.body.getReader();
      let done = false;
      let assistantText = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (value) {
          const chunk = new TextDecoder().decode(value);
          
          // Process each "data:" line from the SSE stream
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
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
          }
        }
      }
      
      onStream(assistantText, true);
    } catch (error) {
      console.error('Chat service error:', error);
      throw error;
    }
  }

  /**
   * Non-streaming chat completion for simple cases
   */
  async chatCompletion(
    prompt: llmCompletionRequestMessage,
    options: ChatOptions = {}
  ): Promise<string> {
    const messages = this.buildMessagesFromRequest(prompt);
    
    const payload = {
      model: options.model || 'default',
      messages,
      temperature: options.temperature ?? 0.8,
      max_tokens: options.max_tokens ?? 1024,
      stream: false,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(CHAT_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: options.signal,
      });

      if (!response.ok) {
        let errorMessage = `Chat service error: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // Use default error message if JSON parsing fails
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const choices = data.choices || [];
      if (choices.length === 0) return '';
      return choices[0].message?.content || '';
    } catch (error) {
      console.error('Chat service error:', error);
      throw error;
    }
  }

  /**
   * Check if the chat service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Chat service health check failed:', error);
      return false;
    }
  }

  private buildMessagesFromRequest(prompt: llmCompletionRequestMessage): ChatMessage[] {
    const messages: ChatMessage[] = [];
    
    if (prompt.systemMessage) {
      messages.push({ role: 'system', content: prompt.systemMessage });
    }
    
    if (prompt.userMessage) {
      messages.push({ role: 'user', content: prompt.userMessage });
    }
    
    return messages;
  }
}

// Export singleton instance
export const chatService = ChatService.getInstance();
