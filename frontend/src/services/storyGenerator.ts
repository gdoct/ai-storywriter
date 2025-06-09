import { GeneratedStory, Scenario } from '../types/ScenarioTypes';
import {
  generateRandomCharacter as backendGenerateRandomCharacter,
  generateRandomScenarioName as backendGenerateRandomScenarioName,
  generateRandomWritingStyle as backendGenerateRandomWritingStyle
} from './llmBackend';
import { streamChatCompletion } from './llmService';


// Helper for prompt-based streaming using llmService
async function streamPromptCompletion({
  prompt,
  onProgress,
  temperature,
  seed,
  max_tokens
}: {
  prompt: string,
  onProgress?: (text: string) => void,
  temperature?: number,
  seed?: number | null,
  max_tokens?: number
}) {
  let fullText = '';
  // Use a single message for prompt-based completions
  await streamChatCompletion(
    [ { role: 'user', content: prompt } ],
    (text) => {
      // Only send the new chunk to onProgress
      if (onProgress) {
        onProgress(text.slice(fullText.length));
      }
      fullText = text;
    },
    { temperature, max_tokens }
  );
  return fullText;
}

/**
 * Generate a single chapter using the backend LLM proxy
 */
export async function generateChapter(
  scenario: Scenario,
  chapterNumber: number,
  previousChapters: string = '',
  options: {
    onProgress?: (text: string) => void,
    temperature?: number,
    seed?: number | null
  } = {}
): Promise<string> {
  const prompt = `Convert the following scenario into a detailed chapter ${chapterNumber}, incorporating elements from previous chapters as needed.\n\n` +
                 `Scenario:\n${JSON.stringify(scenario, null, 2)}\n\n` +
                 `Previous Chapters:\n${previousChapters}\n\n` +
                 `Chapter ${chapterNumber}:`;
  return streamPromptCompletion({
    prompt,
    onProgress: options.onProgress,
    temperature: options.temperature,
    seed: options.seed,
    max_tokens: 2000
  });
}

/**
 * Generate a summary for a chapter using the backend LLM proxy
 */
export async function generateChapterSummary(
  chapterText: string,
  options: {
    onProgress?: (text: string) => void,
    temperature?: number
  } = {}
): Promise<string> {
  const prompt = `Summarize the following chapter in 2-3 sentences, focusing on the main events and character developments. Do not include any meta-commentary or formatting.\n\nChapter:\n${chapterText}`;
  return streamPromptCompletion({
    prompt,
    onProgress: options.onProgress,
    temperature: options.temperature,
    max_tokens: 200
  });
}

/**
 * Generate a story from a scenario using the backend LLM proxy (single call, no chapters)
 */
export async function generateStory(
  scenario: Scenario, 
  options: { 
    onProgress?: (text: string) => void,
    temperature?: number,
    numberOfChapters?: number, // ignored, kept for compatibility
    seed?: number | null
  } = {}
): Promise<{ result: Promise<GeneratedStory>; cancelGeneration: () => void }> {
  const prompt = `Create a complete story based on the following scenario, including all major plot points and character developments. Do not include any meta-commentary or formatting.\n\nScenario:\n${JSON.stringify(scenario, null, 2)}`;
  let cancelled = false;
  let cancelGeneration = () => { cancelled = true; };
  const resultPromise = new Promise<GeneratedStory>(async (resolve, reject) => {
    try {
      let fullText = '';
      await streamChatCompletion(
        [ { role: 'user', content: prompt } ],
        (text) => {
          if (!cancelled) {
            if (options.onProgress) options.onProgress(text.slice(fullText.length));
            fullText = text;
          }
        },
        { temperature: options.temperature, max_tokens: 6000 }
      );
      if (!cancelled) {
        resolve({ completeText: fullText, chapters: [] });
      }
    } catch (error) {
      reject(error);
    }
  });
  return { result: resultPromise, cancelGeneration };
}

/**
 * Generate a backstory for a scenario using the backend LLM proxy
 */
export async function generateBackstory(
  scenario: Scenario,
  options: {
    onProgress?: (text: string) => void,
    temperature?: number,
    seed?: number | null
  } = {}
): Promise<{ result: Promise<string>; cancelGeneration: () => void }> {
  const prompt = `Generate a backstory for the following scenario, providing all necessary details to understand the characters and plot. Do not include any meta-commentary or formatting.\n\nScenario:\n${JSON.stringify(scenario, null, 2)}`;
  let cancelled = false;
  let cancelGeneration = () => { cancelled = true; };
  let fullText = '';
  const resultPromise = new Promise<string>(async (resolve, reject) => {
    try {
      await streamChatCompletion(
        [ { role: 'user', content: prompt } ],
        (text) => {
          if (cancelled) return;
          if (options.onProgress) options.onProgress(text.slice(fullText.length));
          fullText = text;
        },
        { temperature: options.temperature, max_tokens: 1000 }
      );
      if (!cancelled) {
        resolve(fullText);
      } else {
        reject(new Error('Generation was cancelled'));
      }
    } catch (error) {
      reject(error);
    }
  });
  return { result: resultPromise, cancelGeneration };
}

/**
 * Rewrite an existing backstory using the backend LLM proxy
 */
export async function rewriteBackstory(
  scenario: Scenario,
  options: {
    onProgress?: (text: string) => void,
    temperature?: number,
    seed?: number | null
  } = {}
): Promise<{ result: Promise<string>; cancelGeneration: () => void }> {
  const prompt = `You are a masterful storyteller specializing in improving existing content in the genre ${scenario.writingStyle?.genre || "General Fiction"}. Rewrite the following backstory:\n\n` +
                 `"${scenario.backstory || ""}"\n\n` +
                 `Keep the core elements of the backstory but make it short and high-level. improve it by:\n` +
                 `- Making it clear and structured\n` +
                 `- Keeping it short and high-level (only add details that are needed for clarity)\n` +
                 `- Preserving all key plot points and character relationships\n` +
                 `- Write in a neutral tone, as if it's the back cover of a book. \n\n` +
                 `Do not include any markdown, formatting, or meta-commentary - only the rewritten backstory itself.`;
  let cancelled = false;
  let cancelGeneration = () => { cancelled = true; };
  const resultPromise = new Promise<string>(async (resolve, reject) => {
    try {
      let fullText = '';
      await streamChatCompletion(
        [ { role: 'user', content: prompt } ],
        (text) => {
          if (!cancelled) {
            if (options.onProgress) options.onProgress(text.slice(fullText.length));
            fullText = text;
          }
        },
        { temperature: options.temperature, max_tokens: 1000 }
      );
      if (!cancelled) {
        resolve(fullText);
      }
    } catch (error) {
      reject(error);
    }
  });
  return { result: resultPromise, cancelGeneration };
}

/**
 * Rewrite an existing story arc using the backend LLM proxy
 */
export async function rewriteStoryArc(
  scenario: Scenario,
  options: {
    onProgress?: (text: string) => void,
    temperature?: number,
    seed?: number | null
  } = {}
): Promise<{ result: Promise<string>; cancelGeneration: () => void }> {
  const prompt = `You are a masterful story architect specializing in improving story arcs for ${scenario.writingStyle?.genre || "General Fiction"} fiction. Rewrite the following story arc to be more compelling, clear, and high-level:\n\n` +
                 `"${scenario.storyarc || ""}"\n\n` +
                 `Keep the core plot points and character arcs, but improve structure and flow.\n` +
                 `Do not include any markdown, formatting, or meta-commentary - only the rewritten story arc itself.`;
  let cancelled = false;
  let cancelGeneration = () => { cancelled = true; };
  const resultPromise = new Promise<string>(async (resolve, reject) => {
    try {
      let fullText = '';
      await streamChatCompletion(
        [ { role: 'user', content: prompt } ],
        (text) => {
          if (!cancelled) {
            if (options.onProgress) options.onProgress(text.slice(fullText.length));
            fullText = text;
          }
        },
        { temperature: options.temperature, max_tokens: 1000 }
      );
      if (!cancelled) {
        resolve(fullText);
      }
    } catch (error) {
      reject(error);
    }
  });
  return { result: resultPromise, cancelGeneration };
}

/**
 * Generate a random writing style using the backend LLM proxy
 */
export async function generateRandomWritingStyle(
  options: {
    onProgress?: (text: string) => void,
    temperature?: number,
    seed?: number | null
  } = {}
): Promise<{ result: Promise<any>; cancelGeneration: () => void }> {
  // Use backend service
  return backendGenerateRandomWritingStyle(options);
}

/**
 * Generate a random character using the backend LLM proxy
 */
export async function generateRandomCharacter(
  scenario: Scenario,
  characterType: string,
  options: {
    onProgress?: (text: string) => void,
    temperature?: number,
    seed?: number | null
  } = {}
): Promise<{ result: Promise<any>; cancelGeneration: () => void }> {
  return backendGenerateRandomCharacter(scenario, characterType, options);
}

/**
 * Generate a random scenario title using the backend LLM proxy
 */
export async function generateRandomScenarioName(
  options?: {
    theme?: string,
    genre?: string,
    onProgress?: (text: string) => void,
    temperature?: number,
    seed?: number | null
  }
): Promise<{ result: Promise<string>; cancelGeneration: () => void }> {
  return backendGenerateRandomScenarioName(options);
}

/**
 * Generate a story arc from a scenario using the backend LLM proxy
 */
export async function generateStoryArc(
  scenario: Scenario,
  options: {
    onProgress?: (text: string) => void,
    temperature?: number,
    seed?: number | null
  } = {}
): Promise<{ result: Promise<string>; cancelGeneration: () => void }> {
  const prompt = `You are a masterful story architect. Write a high-level story arc for a ${scenario.writingStyle?.genre || "General Fiction"} story based on the following scenario.\n\n` +
                 `The story arc should outline the main plot points, character arcs, and key events from beginning to end.\n\n` +
                 `Do not include any markdown, formatting, or meta-commentary - only the story arc itself.\n\nScenario details:\n\n` +
                 `${JSON.stringify(scenario, null, 2)}`;
  let cancelled = false;
  let cancelGeneration = () => { cancelled = true; };
  const resultPromise = new Promise<string>(async (resolve, reject) => {
    try {
      let fullText = '';
      await streamChatCompletion(
        [ { role: 'user', content: prompt } ],
        (text) => {
          if (!cancelled) {
            if (options.onProgress) options.onProgress(text.slice(fullText.length));
            fullText = text;
          }
        },
        { temperature: options.temperature, max_tokens: 1000 }
      );
      if (!cancelled) {
        resolve(fullText);
      }
    } catch (error) {
      reject(error);
    }
  });
  return { result: resultPromise, cancelGeneration };
}
