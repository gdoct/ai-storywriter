import { ChatCompletionChunk, ChatCompletionRequest, ChatCompletionResponse, ChatMessage } from '../types/LMStudioTypes';

/**
 * Service for interacting with the LMStudio API
 */
export class LMStudioAPI {
  private baseUrl: string;
  private modelName: string;
  private seed: number | null;

  // Switch default baseUrl to use the backend proxy
  constructor(baseUrl: string = '/proxy/lmstudio', modelName: string = 'default', seed: number | null = null) {
    this.baseUrl = baseUrl;
    this.modelName = modelName;
    this.seed = seed;
  }

  /**
   * Get the list of models available in LM Studio
   */
  async getModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`);
      if (!response.ok) {
        console.error("Error fetching models:", response.status, await response.text());
        return [];
      }
      const data = await response.json();
      return data.data.map((model: any) => model.id);
    } catch (error) {
      console.error("Failed to fetch models:", error);
      return [];
    }
  }

  /**
   * Send a chat completion request to LM Studio
   * 
   * @param messages The chat messages to send
   * @param options Additional options for the request
   * @returns The completion response
   */
  async getChatCompletion(
    messages: ChatMessage[],
    options: {
      temperature?: number;
      max_tokens?: number;
      top_p?: number;
      stop?: string | string[] | null;
      seed?: number | null;
    } = {}
  ): Promise<ChatCompletionResponse | null> {
    const requestBody: ChatCompletionRequest = {
      model: this.modelName,
      messages: messages,
      // Remove temperature parameter as requested
      max_tokens: options.max_tokens ?? 1000,
      top_p: options.top_p ?? 0.95,
      stop: options.stop ?? null,
      stream: false,
      seed: options.seed ?? this.seed,
    };

    try {
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error("Error fetching chat completion:", response.status, await response.text());
        return null;
      }
      const data: ChatCompletionResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to fetch chat completion:", error);
      return null;
    }
  }

  /**
   * Stream a chat completion from LM Studio, with callbacks for each chunk
   * 
   * @param messages The chat messages to send
   * @param callbacks Callbacks for the streaming response
   * @param options Additional options for the request
   * @returns A function to abort the stream
   */
  streamChatCompletion(
    messages: ChatMessage[],
    callbacks: {
      onChunk: (chunk: ChatCompletionChunk, text: string) => void;
      onComplete?: (fullText: string) => void;
      onError?: (error: Error) => void;
    },
    options: {
      temperature?: number;
      max_tokens?: number;
      top_p?: number;
      stop?: string | string[] | null;
      seed?: number | null;
    } = {}
  ): { abort: () => void } {
    const controller = new AbortController();
    const { signal } = controller;
    
    const requestBody: ChatCompletionRequest = {
      model: this.modelName,
      messages: messages,
      // Remove temperature parameter as requested
      max_tokens: options.max_tokens ?? 1000,
      top_p: options.top_p ?? 0.95,
      stop: options.stop ?? null,
      stream: true,
      seed: options.seed ?? this.seed,
    };

    let fullText = '';
    
    fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal,
    })
      .then(response => {
        if (!response.ok) {
          response.text().then(text => {
            const error = new Error(`HTTP error ${response.status}: ${text}`);
            if (callbacks.onError) callbacks.onError(error);
          });
          return;
        }
        
        if (!response.body) {
          const error = new Error("Response body is null");
          if (callbacks.onError) callbacks.onError(error);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        function processStream(): Promise<void> {
          return reader.read().then(({ done, value }) => {
            if (done) {
              if (callbacks.onComplete) callbacks.onComplete(fullText);
              return;
            }
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  if (callbacks.onComplete) callbacks.onComplete(fullText);
                  return;
                }
                
                try {
                  const parsedChunk: ChatCompletionChunk = JSON.parse(data);
                  const content = parsedChunk.choices[0]?.delta?.content || '';
                  
                  if (content) {
                    fullText += content;
                  }
                  
                  callbacks.onChunk(parsedChunk, fullText);
                } catch (e) {
                  console.error('Error parsing SSE chunk:', e, data);
                  if (callbacks.onError) callbacks.onError(new Error(`Failed to parse chunk: ${e}`));
                }
              }
            }
            
            return processStream();
          }).catch(error => {
            if (error.name !== 'AbortError') {
              console.error('Error reading stream:', error);
              if (callbacks.onError) callbacks.onError(error);
            }
          });
        }

        processStream();
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          console.error('Error fetching stream:', error);
          if (callbacks.onError) callbacks.onError(error);
        }
      });

    return {
      abort: () => controller.abort()
    };
  }
}

// Create a singleton instance with default values
export const lmStudioAPI = new LMStudioAPI();

// Export a function to configure the API with custom settings
export function configureLMStudioAPI(baseUrl: string, modelName: string = 'default', seed: number | null = null): void {
  (lmStudioAPI as any).baseUrl = baseUrl;
  (lmStudioAPI as any).modelName = modelName;
  (lmStudioAPI as any).seed = seed;
}
