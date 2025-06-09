export type BackendType = 'lmstudio' | 'ollama' | 'chatgpt';

export interface LLMConfig {
  backendType: BackendType;
  lmstudio?: { url: string };
  ollama?: { url: string };
  chatgpt?: { apiKey: string };
}
