import { PromptSettings } from '../types/ScenarioTypes';

/**
 * Creates a customized system prompt by applying prefix and keywords from prompt settings
 * @param baseSystemPrompt - The original system prompt
 * @param promptSettings - Custom prompt settings from the scenario
 * @returns The customized system prompt
 */
export function createSystemPrompt(baseSystemPrompt: string, promptSettings?: PromptSettings): string {
  if (!promptSettings) {
    return baseSystemPrompt;
  }

  let customizedPrompt = baseSystemPrompt;

  // Add system prompt prefix if provided
  if (promptSettings.systemPromptPrefix?.trim()) {
    customizedPrompt = `${promptSettings.systemPromptPrefix.trim()}\n\n${customizedPrompt}`;
  }

  // Add keywords after the system prompt if provided
  if (promptSettings.keywords?.trim()) {
    const keywords = promptSettings.keywords.trim();
    customizedPrompt = `${customizedPrompt}\n\nKeywords to incorporate into the story: ${keywords}`;
  }

  return customizedPrompt;
}

/**
 * Creates a customized user prompt by applying prefix from prompt settings
 * @param baseUserPrompt - The original user prompt
 * @param promptSettings - Custom prompt settings from the scenario
 * @returns The customized user prompt
 */
export function createUserPrompt(baseUserPrompt: string, promptSettings?: PromptSettings): string {
  if (!promptSettings || !promptSettings.userPromptPrefix?.trim()) {
    return baseUserPrompt;
  }

  return `${promptSettings.userPromptPrefix.trim()}\n\n${baseUserPrompt}`;
}

/**
 * Helper function to check if prompt settings have any customizations
 * @param promptSettings - Prompt settings to check
 * @returns true if any customizations are present
 */
export function hasPromptCustomizations(promptSettings?: PromptSettings): boolean {
  if (!promptSettings) return false;
  
  return !!(
    promptSettings.systemPromptPrefix?.trim() ||
    promptSettings.userPromptPrefix?.trim() ||
    promptSettings.keywords?.trim()
  );
}