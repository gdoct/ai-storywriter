// frontend/src/services/llmService.ts
import { AI_STATUS } from '../contexts/AIStatusContext';
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
    await handle409Error(response, setAiStatus, setShowAIBusyModal);
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
    setAiStatus(AI_STATUS.IDLE);
  } catch (err: any) {
    if (err.message !== '409') setAiStatus(AI_STATUS.ERROR);
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
  await handle409Error(response, setAiStatus, setShowAIBusyModal);
  if (!response.ok) {
    setAiStatus(AI_STATUS.ERROR);
    throw new Error(`LLM backend error: ${response.statusText}`);
  }
  const data = await response.json();
  const choices = data.choices || [];
  setAiStatus(AI_STATUS.IDLE);
  if (choices.length === 0) return '';
  return choices[0].message?.content || '';
}

export type { LLMMessage };
