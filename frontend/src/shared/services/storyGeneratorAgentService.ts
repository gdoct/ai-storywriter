/**
 * Story Generator Agent Service
 * Handles story generation using the backend LangGraph agent instead of client-side prompts
 */

import { Scenario, GeneratedStory } from '../types/ScenarioTypes';
import { getToken } from './security';
import { MaxTokensService, TokenContext } from './maxTokensService';
import { AI_STATUS } from '../contexts/AIStatusContext';

// Auto-detect if we're running in dev mode or production
const isDevMode = window.location.port === '3000';
const backendUrl = import.meta.env.VITE_API_URL;
const API_BASE = isDevMode && backendUrl ? backendUrl : '';

export interface StoryGenerationRequest {
  scenario: Scenario;
  generation_options: {
    target_length?: number;
    writing_style_override?: string;
    temperature?: number;
    seed?: number;
    max_tokens?: number;
  };
}

export interface StoryGenerationResponse {
  success: boolean;
  story: string;
  processing_summary: {
    nodes_processed: number;
    total_tokens: number;
    processing_time: number;
  };
  credits_used: number;
  error?: string;
}

export interface StoryStreamingEvent {
  type: 'progress' | 'content' | 'complete' | 'error' | 'stream_end';
  step?: string;
  progress?: number;
  message?: string;
  content?: string;
  story?: string;
  credits_used?: number;
  processing_summary?: any;
  error?: string;
}

export interface StoryGenerationOptions {
  onProgress?: (event: StoryStreamingEvent) => void;
  onContent?: (content: string) => void;
  onThinking?: (thinking: string) => void;
  temperature?: number;
  seed?: number | null;
  target_length?: number;
  writing_style_override?: string;
  /** Maximum tokens for story generation. Defaults to STORY_GENERATION context limit (2000). */
  max_tokens?: number;
}

/**
 * Generate a story using the backend story generator agent (streaming)
 */
export async function generateStoryWithAgent(
  scenario: Scenario,
  options: StoryGenerationOptions = {},
  setAiStatus: (status: AI_STATUS) => void = () => {},
  setShowAIBusyModal: (show: boolean) => void = () => {}
): Promise<{ result: Promise<GeneratedStory>; cancelGeneration: () => void }> {

  const token = getToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const abortController = new AbortController();
  const cancelGeneration = () => {
    abortController.abort();
  };

  const maxTokens = MaxTokensService.getMaxTokens(TokenContext.STORY_GENERATION, options.max_tokens);
  const request: StoryGenerationRequest = {
    scenario,
    generation_options: {
      target_length: options.target_length || maxTokens,
      writing_style_override: options.writing_style_override,
      temperature: options.temperature || 0.7,
      seed: options.seed,
      max_tokens: maxTokens
    }
  };

  const resultPromise = new Promise<GeneratedStory>((resolve, reject) => {
    (async () => {
      try {
        setAiStatus(AI_STATUS.LOADING);
        setShowAIBusyModal(true);

        const response = await fetch(`${API_BASE}/api/agent/story/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/event-stream'
          },
          body: JSON.stringify(request),
          signal: abortController.signal
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Story generation failed' }));
          throw new Error(errorData.detail || 'Story generation failed');
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Failed to start streaming');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let fullStory = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const eventData = JSON.parse(line.slice(6));
                const event: StoryStreamingEvent = eventData;

                // Handle different event types
                if (event.type === 'progress') {
                  if (options.onProgress) {
                    options.onProgress(event);
                  }
                  setAiStatus(AI_STATUS.LOADING);
                } else if (event.type === 'content') {
                  fullStory += event.content || '';
                  if (options.onContent) {
                    options.onContent(event.content || '');
                  }
                  setAiStatus(AI_STATUS.LOADING);
                } else if (event.type === 'complete') {
                  fullStory = event.story || fullStory;
                  setAiStatus(AI_STATUS.IDLE);
                  setShowAIBusyModal(false);

                  resolve({
                    completeText: fullStory,
                    chapters: [] // Backend agent returns complete story, not chapters
                  });
                  return;
                } else if (event.type === 'error') {
                  throw new Error(event.error || 'Story generation failed');
                } else if (event.type === 'stream_end') {
                  // Stream ended normally
                  break;
                }

                // Call progress callback for all events
                if (options.onProgress) {
                  options.onProgress(event);
                }

              } catch (parseError) {
                console.warn('Failed to parse SSE event:', line, parseError);
              }
            }
          }
        }

        // If we reach here without a complete event, treat as successful completion
        if (fullStory) {
          setAiStatus(AI_STATUS.IDLE);
          setShowAIBusyModal(false);
          resolve({
            completeText: fullStory,
            chapters: []
          });
        } else {
          throw new Error('Story generation completed without content');
        }

      } catch (error) {
        setAiStatus(AI_STATUS.ERROR);
        setShowAIBusyModal(false);

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
 * Generate a story using the backend story generator agent (non-streaming)
 */
export async function generateStoryWithAgentNonStreaming(
  scenario: Scenario,
  options: StoryGenerationOptions = {}
): Promise<StoryGenerationResponse> {

  const token = getToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const maxTokens = MaxTokensService.getMaxTokens(TokenContext.STORY_GENERATION, options.max_tokens);
  const request: StoryGenerationRequest = {
    scenario,
    generation_options: {
      target_length: options.target_length || maxTokens,
      writing_style_override: options.writing_style_override,
      temperature: options.temperature || 0.7,
      seed: options.seed,
      max_tokens: maxTokens
    }
  };

  const response = await fetch(`${API_BASE}/api/agent/story/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Story generation failed' }));
    throw new Error(errorData.detail || 'Story generation failed');
  }

  return await response.json();
}

/**
 * Get cost estimate for story generation
 */
export async function getStoryGenerationCostEstimate(scenario: Scenario): Promise<{
  estimated_cost: number;
  factors: {
    base_cost: number;
    character_cost: number;
    location_cost: number;
    timeline_cost: number;
    backstory_cost: number;
    storyarc_cost: number;
    synopsis_length_cost: number;
  };
}> {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const params = new URLSearchParams({
    title: scenario.title || '',
    synopsis: scenario.synopsis || '',
    character_count: (scenario.characters?.length || 0).toString(),
    location_count: (scenario.locations?.length || 0).toString(),
    has_timeline: (!!scenario.timeline?.length).toString(),
    has_backstory: (!!scenario.backstory).toString(),
    has_storyarc: (!!scenario.storyarc).toString()
  });

  const response = await fetch(`${API_BASE}/api/agent/story/cost-estimate?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Cost estimation failed' }));
    throw new Error(errorData.detail || 'Cost estimation failed');
  }

  return await response.json();
}

/**
 * Legacy compatibility wrapper - replaces the old generateStory function
 * This maintains the same interface as the old storyGenerator.ts
 */
export async function generateStory(
  scenario: Scenario,
  options: StoryGenerationOptions = {},
  setAiStatus: (status: AI_STATUS) => void = () => {},
  setShowAIBusyModal: (show: boolean) => void = () => {}
): Promise<{ result: Promise<GeneratedStory>; cancelGeneration: () => void }> {
  return generateStoryWithAgent(scenario, options, setAiStatus, setShowAIBusyModal);
}

export default {
  generateStory,
  generateStoryWithAgent,
  generateStoryWithAgentNonStreaming,
  getStoryGenerationCostEstimate
};