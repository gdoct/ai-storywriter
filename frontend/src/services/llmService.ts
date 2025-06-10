// frontend/src/services/llmService.ts
import { llmCompletionRequestMessage, LLMMessage } from '../types/LLMTypes';

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

export async function streamChatCompletion(
  prompt: llmCompletionRequestMessage,
  onStream: LLMStreamCallback,
  options: LLMChatOptions = {}
): Promise<void> {
  const messages = buildMessagesFromRequest(prompt);
  const payload = {
    model: options.model || '',
    messages,
    temperature: options.temperature ?? 0.8,
    max_tokens: options.max_tokens ?? 1024,
    keep_alive: '10m',
  };
  if (!options.model || options.model.trim() === '') {
    throw new Error('Model must be specified');
  }
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

/**
 * Gets chat completion from the LLM backend in a non-streaming way.
 * @param messages Chat history
 * @param options Model and generation options
 * @returns The assistant's reply as a string
 */
export async function chatCompletion(
  prompt: llmCompletionRequestMessage,
  options: LLMChatOptions = {}
): Promise<string> {
  const messages = buildMessagesFromRequest(prompt);
  const payload = {
    model: options.model || '',
    messages,
    temperature: options.temperature ?? 0.8,
    max_tokens: options.max_tokens ?? 1024,
    keep_alive: '10m',
    stream: false,
  };
  if (!options.model || options.model.trim() === '') {
    throw new Error('Model must be specified');
  }

  const response = await fetch(LLM_PROXY_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`LLM backend error: ${response.statusText}`);
  }

  const data = await response.json();
  const choices = data.choices || [];
  if (choices.length === 0) return '';
  return choices[0].message?.content || '';
}

export type { LLMMessage };
