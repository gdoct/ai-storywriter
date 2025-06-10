export type BackendType = 'lmstudio' | 'ollama' | 'chatgpt';

export interface LLMConfig {
  backendType: BackendType;
  lmstudio?: { url: string };
  ollama?: { url: string };
  chatgpt?: { apiKey: string };
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface llmCompletionRequestMessage {
  systemMessage?: string;
  userMessage?: string;
}