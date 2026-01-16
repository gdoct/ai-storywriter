import { AI_STATUS } from '../contexts/AIStatusContext';
import { llmCompletionRequestMessage } from '../types/LLMTypes';
import { GeneratedStory, Scenario } from '../types/ScenarioTypes';
import * as llmPromptService from './llmPromptService';
import { createRewriteStoryArcPrompt, createStoryArcPrompt, createSummaryPrompt } from './llmPromptService';
import { streamSimpleChatCompletionWithStatus, streamChatCompletionWithStatus, streamChatCompletionWithThinking } from './llmService';
import { MaxTokensService, TokenContext } from './maxTokensService';
import { getSelectedModel } from './modelSelection';
import { getShowThinkingSetting } from './settings';
// Import the new agent service for main story generation
import { generateStoryWithAgent } from './storyGeneratorAgentService';

/*
 * MIGRATION NOTE: The main story generation now uses the backend story generator agent.
 * Client-side prompt functions (like llmPromptService.createFinalStoryPrompt) are being
 * replaced by the backend LangGraph agent which handles all prompt engineering server-side.
 *
 * Legacy functions are kept for backward compatibility with other features like:
 * - Individual element generation (backstory, story arc, etc.)
 * - Chapter-based generation (if still needed)
 * - Rewrite operations
 */


// Helper for prompt-based streaming using llmService, with AI status context
export async function streamPromptCompletionWithStatus({
  prompt,
  onProgress,
  temperature,
  seed,
  max_tokens,
  setAiStatus = () => {},
  setShowAIBusyModal = () => {}
}: {
  prompt: string,
  onProgress?: (text: string) => void,
  temperature?: number,
  seed?: number | null,
  max_tokens?: number,
  setAiStatus?: (s: any) => void,
  setShowAIBusyModal?: (b: boolean) => void
}) {
  let fullText = '';
  const selectedModel = getSelectedModel();
  // Use a single message for prompt-based completions
  const promptObj: llmCompletionRequestMessage = {
    userMessage: prompt
  };
  await streamSimpleChatCompletionWithStatus(
    promptObj,
    (text, isDone) => {
      if (isDone) {
        // Final call - completion signal only
        // fullText already contains the complete text from streaming
      } else {
        // Incremental chunk during streaming
        fullText += text;
        if (onProgress) {
          onProgress(text);
        }
      }
    },
    {
      model: selectedModel || undefined,
      temperature,
      max_tokens
    },
    setAiStatus,
    setShowAIBusyModal
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
  } = {},
  setAiStatus = () => {},
  setShowAIBusyModal = () => {}
): Promise<string> {
  const promptObj = llmPromptService.createChapterPrompt(scenario, chapterNumber, previousChapters);
  let fullText = '';
  await streamSimpleChatCompletionWithStatus(
    promptObj,
    (text) => {
      if (options.onProgress) options.onProgress(text);
      fullText = text;
    },
    {
      model: getSelectedModel() || undefined,
      temperature: options.temperature,
      max_tokens: MaxTokensService.getMaxTokens(TokenContext.CHAPTER_CONTENT)
    },
    setAiStatus,
    setShowAIBusyModal
  );
  return fullText;
}

/**
 * Generate a summary for a chapter using the backend LLM proxy
 */
export async function generateChapterSummary(scenario: Scenario,
  chapterText: string,
  options: {
    onProgress?: (text: string) => void,
    temperature?: number
  } = {},
  setAiStatus = () => {},
  setShowAIBusyModal = () => {}
): Promise<string> {
  // No createChapterSummaryPrompt exists, so use inline prompt
  const promptObj = createSummaryPrompt(scenario, chapterText);
  let fullText = '';
  await streamSimpleChatCompletionWithStatus(
    promptObj,
    (text) => {
      if (options.onProgress) options.onProgress(text);
      fullText = text;
    },
    {
      model: getSelectedModel() || undefined,
      temperature: options.temperature,
      max_tokens: MaxTokensService.getMaxTokens(TokenContext.CHAPTER_SUMMARY)
    },
    setAiStatus,
    setShowAIBusyModal
  );
  return fullText;
}

/**
 * Generate a story from a scenario using the backend story generator agent
 * This replaces the old client-side prompt approach with the new backend agent
 */
export async function generateStory(
  scenario: Scenario,
  options: {
    onProgress?: (text: string) => void,
    onThinking?: (thinking: string) => void,
    temperature?: number,
    numberOfChapters?: number, // ignored, kept for compatibility
    seed?: number | null,
    /** Maximum tokens for story generation. Uses service default (2000) if not provided. */
    max_tokens?: number
  } = {},
  setAiStatus = () => {},
  setShowAIBusyModal = () => {}
): Promise<{ result: Promise<GeneratedStory>; cancelGeneration: () => void }> {

  // Use the new backend story generator agent
  // Note: target_length will default to max_tokens in the agent service
  return generateStoryWithAgent(
    scenario,
    {
      onContent: options.onProgress, // Map onProgress to onContent for the agent
      onThinking: options.onThinking,
      temperature: options.temperature,
      seed: options.seed,
      max_tokens: options.max_tokens // Pass through to agent service
    },
    setAiStatus,
    setShowAIBusyModal
  );
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
  } = {},
  setAiStatus: (status: AI_STATUS) => void = () => {},
  setShowAIBusyModal: (show: boolean) => void = () => {}
): Promise<{ result: Promise<string>; cancelGeneration: () => void }> {
  const promptObj = llmPromptService.createBackstoryPrompt(scenario);
  const abortController = new AbortController();
  let cancelGeneration = () => { abortController.abort(); };
  let fullText = '';
  const resultPromise = new Promise<string>((resolve, reject) => {
    (async () => {
      try {
        const selectedModel = getSelectedModel();
        
        // DEBUG: Log parameters being sent
        console.log('[GENERATE BACKSTORY DEBUG]');
        console.log('Selected model:', selectedModel);
        console.log('Temperature:', options.temperature);
        console.log('Scenario:', scenario);
        console.log('Prompt object:', promptObj);
        
        await streamSimpleChatCompletionWithStatus(
          promptObj,
          (text, isDone) => {
            if (isDone) {
              // Final call - completion signal only
              // fullText already contains the complete text from streaming
            } else {
              // Incremental chunk during streaming
              fullText += text;
              if (options.onProgress) options.onProgress(text);
            }
          },
          {
            model: selectedModel || undefined,
            temperature: options.temperature,
            max_tokens: MaxTokensService.getMaxTokens(TokenContext.STORY_BACKSTORY),
            signal: abortController.signal
          },
          setAiStatus,
          setShowAIBusyModal
        );
        resolve(fullText);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          reject(new Error('Generation was cancelled'));
        } else {
          reject(error);
        }
      }
    })();
  });
  return { result: resultPromise, cancelGeneration };
}

export async function generateStoryTitle(scenario: Scenario,
  options: {
    onProgress?: (text: string) => void,
    temperature?: number,
    seed?: number | null
  } = {},
  setAiStatus: (status: AI_STATUS) => void = () => {},
  setShowAIBusyModal: (show: boolean) => void = () => {}
): Promise<{ result: Promise<string>; cancelGeneration: () => void }> {
  const promptObj = llmPromptService.createStoryTitlePrompt(scenario);
  const selectedModel = getSelectedModel();
  const abortController = new AbortController();
  let cancelGeneration = () => { abortController.abort(); };
  let fullText = '';
  
  const resultPromise = new Promise<string>((resolve, reject) => {
    (async () => {
      try {
        await streamChatCompletionWithStatus(
          promptObj,
          (text, isDone) => {
            if (isDone) {
              // Final call - completion signal only
              // fullText already contains the complete text from streaming
            } else {
              // Incremental chunk during streaming
              fullText += text;
              if (options.onProgress) options.onProgress(text);
            }
          },
          {
            model: selectedModel || undefined,
            temperature: options.temperature,
            max_tokens: MaxTokensService.getMaxTokens(TokenContext.STORY_TITLE),
            signal: abortController.signal
          },
          setAiStatus,
          setShowAIBusyModal
        );
        
        // Remove markdown code block if present
        if (fullText.startsWith('```')) {
          fullText = fullText.slice(3);
        }
        if (fullText.endsWith('```')) {
          fullText = fullText.slice(0, -3);
        }
        // Trim whitespace
        fullText = fullText.trim();
        // Ensure we return a non-empty string
        if (fullText.length === 0) {
          fullText = 'Untitled Story';
        }
        
        resolve(fullText);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          reject(new Error('Generation cancelled'));
        } else {
          reject(error);
        }
      }
    })();
  });
    
  return { result: resultPromise, cancelGeneration };
}

export async function generateScenarioSynopsis(scenario: Scenario,
  options: {
    onProgress?: (text: string) => void,
    temperature?: number,
    seed?: number | null
  } = {},
  setAiStatus: (status: AI_STATUS) => void = () => {},
  setShowAIBusyModal: (show: boolean) => void = () => {}
): Promise<{ result: Promise<string>; cancelGeneration: () => void }> {
  const promptObj = llmPromptService.createScenarioSynopsisPrompt(scenario);
  const selectedModel = getSelectedModel();
  const abortController = new AbortController();
  let cancelGeneration = () => { abortController.abort(); };
  let fullText = '';
  
  const resultPromise = new Promise<string>((resolve, reject) => {
    (async () => {
      try {
        await streamChatCompletionWithStatus(
          promptObj,
          (text, isDone) => {
            if (isDone) {
              // Final call - completion signal only
              // fullText already contains the complete text from streaming
            } else {
              // Incremental chunk during streaming
              fullText += text;
              if (options.onProgress) options.onProgress(text);
            }
          },
          {
            model: selectedModel || undefined,
            temperature: options.temperature,
            max_tokens: MaxTokensService.getMaxTokens(TokenContext.STORY_SYNOPSIS),
            signal: abortController.signal
          },
          setAiStatus,
          setShowAIBusyModal
        );
        
        // Remove markdown code block if present
        if (fullText.startsWith('```')) {
          fullText = fullText.slice(3);
        }
        if (fullText.endsWith('```')) {
          fullText = fullText.slice(0, -3);
        }
        // Trim whitespace
        fullText = fullText.trim();
        // Ensure we return a non-empty string
        if (fullText.length === 0) {
          fullText = '(Synopsis unavailable)';
        }
        
        resolve(fullText);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          reject(new Error('Generation cancelled'));
        } else {
          reject(error);
        }
      }
    })();
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
  } = {},
  setAiStatus: (status: AI_STATUS) => void = () => {},
  setShowAIBusyModal: (show: boolean) => void = () => {}
): Promise<{ result: Promise<string>; cancelGeneration: () => void }> {
  const promptObj = llmPromptService.createRewriteBackstoryPrompt(scenario);
  const abortController = new AbortController();
  let cancelGeneration = () => { abortController.abort(); };
  const resultPromise = new Promise<string>((resolve, reject) => {
    (async () => {
      try {
        const selectedModel = getSelectedModel();
        let fullText = '';
        await streamSimpleChatCompletionWithStatus(
        promptObj,
        (text, isDone) => {
          if (isDone) {
            // Final call - completion signal only
            // fullText already contains the complete text from streaming
          } else {
            // Incremental chunk during streaming
            fullText += text;
            if (options.onProgress) options.onProgress(text);
          }
        },
        {
          model: selectedModel || undefined,
          temperature: options.temperature,
          max_tokens: MaxTokensService.getMaxTokens(TokenContext.STORY_BACKSTORY),
          signal: abortController.signal
        },
        setAiStatus,
        setShowAIBusyModal
      );
        resolve(fullText);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          reject(new Error('Generation was cancelled'));
        } else {
          reject(error);
        }
      }
    })();
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
  } = {},
  setAiStatus = () => {},
  setShowAIBusyModal = () => {}
): Promise<{ result: Promise<string>; cancelGeneration: () => void }> {
  const prompt = createRewriteStoryArcPrompt(scenario);
  const abortController = new AbortController();
  let cancelGeneration = () => { abortController.abort(); };
  const resultPromise = new Promise<string>((resolve, reject) => {
    (async () => {
      try {
      const selectedModel = getSelectedModel();
      let fullText = '';
      
      await streamSimpleChatCompletionWithStatus(
        prompt,
        (text, isDone) => {
          if (isDone) {
            // Final call - completion signal only
            // fullText already contains the complete text from streaming
          } else {
            // Incremental chunk during streaming
            fullText += text;
            if (options.onProgress) options.onProgress(text);
          }
        },
        {
          model: selectedModel || undefined,
          temperature: options.temperature,
          max_tokens: MaxTokensService.getMaxTokens(TokenContext.STORY_ARC),
          signal: abortController.signal
        },
        setAiStatus,
        setShowAIBusyModal
      );
      resolve(fullText);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          reject(new Error('Generation was cancelled'));
        } else {
          reject(error);
        }
      }
    })();
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
  } = {},
  setAiStatus = () => {},
  setShowAIBusyModal = () => {}
): Promise<{ result: Promise<any>; cancelGeneration: () => void }> {
  const abortController = new AbortController();
  let cancelGeneration = () => { abortController.abort(); };
  const promptObj = llmPromptService.createWritingStylePrompt();
  const resultPromise = new Promise<any>((resolve, reject) => {
    (async () => {
      try {
        const selectedModel = getSelectedModel();
        let fullText = '';
        await streamSimpleChatCompletionWithStatus(
        promptObj,
        (text, isDone) => {
          if (isDone) {
            // Final call - completion signal only
            // fullText already contains the complete text from streaming
          } else {
            // Incremental chunk during streaming
            fullText += text;
            if (options.onProgress) options.onProgress(text);
          }
        },
        {
          model: selectedModel || undefined,
          temperature: options.temperature,
          max_tokens: MaxTokensService.getMaxTokens(TokenContext.RANDOM_WRITING_STYLE),
          signal: abortController.signal
        },
        setAiStatus,
        setShowAIBusyModal
      );
      // console.log(fullText);
        resolve(fullText);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          reject(new Error('Generation was cancelled'));
        } else {
          reject(error);
        }
      }
    })();
  });
  return { result: resultPromise, cancelGeneration };
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
    seed?: number | null,
    additionalInstructions?: string
  } = {},
  setAiStatus: (status: AI_STATUS) => void = () => {},
  setShowAIBusyModal: (show: boolean) => void = () => {}
): Promise<{ result: Promise<any>; cancelGeneration: () => void }> {
  const abortController = new AbortController();
  let cancelGeneration = () => { abortController.abort(); };
  const promptObj = options.additionalInstructions 
    ? await llmPromptService.createRandomCharacterPrompt(scenario, characterType, options.additionalInstructions)
    : await llmPromptService.createCharacterPrompt(scenario, characterType);
  const resultPromise = new Promise<any>((resolve, reject) => {
    (async () => {
      try {
        const selectedModel = getSelectedModel();
        let fullText = '';
        await streamSimpleChatCompletionWithStatus(
        promptObj,
        (text, isDone) => {
          if (isDone) {
            // Final call - completion signal only
            // fullText already contains the complete text from streaming
          } else {
            // Incremental chunk during streaming
            fullText += text;
            if (options.onProgress) options.onProgress(text);
          }
        },
        {
          model: selectedModel || undefined,
          temperature: options.temperature,
          max_tokens: MaxTokensService.getMaxTokens(TokenContext.RANDOM_CHARACTER),
          signal: abortController.signal
        },
        setAiStatus,
        setShowAIBusyModal
      );
      // Remove markdown code block if present
      let cleaned = fullText.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7);
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
      }
      resolve(cleaned.trim());
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          reject(new Error('Generation was cancelled'));
        } else {
          reject(error);
        }
      }
    })();
  });
  return { result: resultPromise, cancelGeneration };
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
  },
  setAiStatus = () => {},
  setShowAIBusyModal = () => {}
): Promise<{ result: Promise<string>; cancelGeneration: () => void }> {
  return generateRandomScenarioName(options);
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
  } = {},
  setAiStatus = () => {},
  setShowAIBusyModal = () => {}
): Promise<{ result: Promise<string>; cancelGeneration: () => void }> {
  const prompt = createStoryArcPrompt(scenario);
  const abortController = new AbortController();
  let cancelGeneration = () => { abortController.abort(); };
  const resultPromise = new Promise<string>((resolve, reject) => {
    (async () => {
      try {
      const selectedModel = getSelectedModel();
      let fullText = '';
      await streamSimpleChatCompletionWithStatus(
        prompt,
        (text, isDone) => {
          if (isDone) {
            // Final call - completion signal only
            // fullText already contains the complete text from streaming
          } else {
            // Incremental chunk during streaming
            fullText += text;
            if (options.onProgress) options.onProgress(text);
          }
        },
        {
          model: selectedModel || undefined,
          temperature: options.temperature,
          max_tokens: MaxTokensService.getMaxTokens(TokenContext.STORY_ARC),
          signal: abortController.signal
        },
        setAiStatus,
        setShowAIBusyModal
      );
      resolve(fullText);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          reject(new Error('Generation was cancelled'));
        } else {
          reject(error);
        }
      }
    })();
  });
  return { result: resultPromise, cancelGeneration };
}


export async function generateNotes(
  scenario: Scenario,
  options: {
    onProgress?: (text: string) => void,
    temperature?: number,
    seed?: number | null
  } = {}
): Promise<{ result: Promise<string>; cancelGeneration: () => void }> {
  const promptObj = llmPromptService.createNotesPrompt(scenario);
  const abortController = new AbortController();
  let cancelGeneration = () => { abortController.abort(); };
  let fullText = '';
  const resultPromise = new Promise<string>((resolve, reject) => {
    (async () => {
      try {
      const selectedModel = getSelectedModel();
      await streamSimpleChatCompletionWithStatus(
        promptObj,
        (text, isDone) => {
          if (isDone) {
            // Final call - completion signal only
            // fullText already contains the complete text from streaming
          } else {
            // Incremental chunk during streaming
            fullText += text;
            if (options.onProgress) options.onProgress(text);
          }
        },
        {
          model: selectedModel || undefined,
          temperature: options.temperature || 0.8, // Slightly higher temperature for creative ideas
          max_tokens: MaxTokensService.getMaxTokens(TokenContext.STORY_NOTES),
          signal: abortController.signal
        },
        () => {}, // setAiStatus
        () => {}  // setShowAIBusyModal
      );
      resolve(fullText);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          reject(new Error('Generation was cancelled'));
        } else {
          reject(error);
        }
      }
    })();
  });
  return { result: resultPromise, cancelGeneration };
}
