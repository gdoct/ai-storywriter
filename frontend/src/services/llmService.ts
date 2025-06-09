// frontend/src/services/llmService.ts

export interface LLMMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LLMChatOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
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
export async function streamChatCompletion(
  messages: LLMMessage[],
  onStream: LLMStreamCallback,
  options: LLMChatOptions = {}
): Promise<void> {
  const payload = {
    model: options.model || 'google/gemma-3-4b',
    messages,
    temperature: options.temperature ?? 0.8,
    max_tokens: options.max_tokens ?? 1024,
  };

  const response = await fetch(LLM_PROXY_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
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
            const json = JSON.parse(data);
            const choices = json.choices || [];
            for (const choice of choices) {
              const delta = choice.delta || {};
              const content = delta.content;
              if (content) {
                assistantText += content;
                onStream(assistantText, false);
              }
            }
          } catch {
            // Not JSON, ignore
          }
        }
      });
    }
  }
  onStream(assistantText, true);
}
