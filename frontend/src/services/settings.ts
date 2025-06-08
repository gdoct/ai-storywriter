import { LLMConfig } from '../types/LLMTypes';
import { fetchLLMSettings, saveLLMSettings } from './llmBackend';

export async function getSavedSettings(): Promise<LLMConfig | null> {
  return await fetchLLMSettings();
}

export async function saveSettings(config: LLMConfig): Promise<LLMConfig | null> {
  return await saveLLMSettings(config);
}
