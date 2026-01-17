/**
 * Rolling Stories Service - API calls for the rolling stories feature
 */
import axios from './http';

// Types
export interface RollingStory {
  id: number;
  scenario_id: string;
  user_id: string;
  title: string;
  status: 'draft' | 'in_progress' | 'completed' | 'abandoned';
  created_at: string;
  updated_at: string;
  paragraph_count?: number;
}

export interface RollingStoryDetail extends RollingStory {
  paragraphs: StoryParagraph[];
  bible: StoryBibleEntry[];
  events: StoryEvent[];
}

export interface StoryParagraph {
  id: number;
  rolling_story_id: number;
  sequence: number;
  content: string;
  created_at: string;
}

export interface StoryBibleEntry {
  id: number;
  rolling_story_id: number;
  category: 'character' | 'setting' | 'object';
  name: string;
  details: Record<string, unknown>;
  introduced_at: number;
  created_at: string;
}

export interface StoryEvent {
  id: number;
  rolling_story_id: number;
  paragraph_sequence: number;
  event_type: 'key_event' | 'decision' | 'consequence' | 'unresolved' | 'user_choice';
  summary: string;
  resolved: boolean;
  created_at: string;
}

export interface Choice {
  label: string;  // Short action label (2-5 words), e.g., "Pull the trigger"
  description: string;  // Longer description of the action
}

export interface GenerateRequest {
  bible: StoryBibleEntry[];
  events: StoryEvent[];
  chosen_action: string | null;  // The label of the chosen action
  chosen_action_description?: string;
  storyline_influence?: string;  // User's input to influence story direction
  paragraph_count?: number;  // Number of paragraphs to generate (default 3)
  choice_count?: number;  // Number of choices to generate (default 3, range 2-5)
}

export interface GenerateResponse {
  paragraphs: StoryParagraph[];
  bible_updates: StoryBibleEntry[];
  event_updates: StoryEvent[];
  choices: Choice[];
}

// API Functions

/**
 * Create a new rolling story from a scenario
 */
export const createRollingStory = async (
  scenarioId: string,
  title: string
): Promise<RollingStory> => {
  const response = await axios.post('/api/rolling-stories', {
    scenario_id: scenarioId,
    title,
  });
  return response.data;
};

/**
 * Get all rolling stories for the current user
 */
export const fetchRollingStories = async (): Promise<RollingStory[]> => {
  const response = await axios.get('/api/rolling-stories');
  return response.data;
};

/**
 * Get a rolling story with all details (paragraphs, bible, events)
 */
export const fetchRollingStoryDetail = async (
  storyId: number
): Promise<RollingStoryDetail> => {
  const response = await axios.get(`/api/rolling-stories/${storyId}`);
  return response.data;
};

/**
 * Update a rolling story's title or status
 */
export const updateRollingStory = async (
  storyId: number,
  updates: { title?: string; status?: RollingStory['status'] }
): Promise<RollingStory> => {
  const response = await axios.put(`/api/rolling-stories/${storyId}`, updates);
  return response.data;
};

/**
 * Delete a rolling story
 */
export const deleteRollingStory = async (storyId: number): Promise<void> => {
  await axios.delete(`/api/rolling-stories/${storyId}`);
};

/**
 * Get story bible entries
 */
export const fetchStoryBible = async (
  storyId: number,
  category?: string
): Promise<StoryBibleEntry[]> => {
  const params = category ? { category } : {};
  const response = await axios.get(`/api/rolling-stories/${storyId}/bible`, { params });
  return response.data;
};

/**
 * Update a story bible entry
 */
export const updateBibleEntry = async (
  storyId: number,
  entryId: number,
  updates: { name?: string; details?: Record<string, unknown> }
): Promise<StoryBibleEntry> => {
  const response = await axios.put(
    `/api/rolling-stories/${storyId}/bible/${entryId}`,
    updates
  );
  return response.data;
};

/**
 * Get story events
 */
export const fetchStoryEvents = async (
  storyId: number,
  eventType?: string,
  limit?: number
): Promise<StoryEvent[]> => {
  const params: Record<string, unknown> = {};
  if (eventType) params.event_type = eventType;
  if (limit) params.limit = limit;
  const response = await axios.get(`/api/rolling-stories/${storyId}/events`, { params });
  return response.data;
};

/**
 * Generate next 8 paragraphs + choices (non-streaming)
 */
export const generateParagraphs = async (
  storyId: number,
  request: GenerateRequest
): Promise<GenerateResponse> => {
  const response = await axios.post(
    `/api/rolling-stories/${storyId}/generate`,
    request
  );
  return response.data;
};

export interface Storyline {
  current_situation: string;
  tension_level: string;
  active_threads: string[];
  next_beat: string;
  pacing_notes: string;
  user_influence?: string;
}

/**
 * Stream paragraph generation with Server-Sent Events
 * @param storyId - The rolling story ID
 * @param request - The generation request
 * @param abortSignal - Optional AbortSignal to cancel the request
 */
export const streamGenerateParagraphs = async function* (
  storyId: number,
  request: GenerateRequest,
  abortSignal?: AbortSignal
): AsyncGenerator<{
  type: string;
  content?: string;
  message?: string;
  choices?: Choice[];
  storyline?: Storyline;
  error?: string;
  paragraphs?: StoryParagraph[];
  bible_updates?: StoryBibleEntry[];
  event_updates?: StoryEvent[];
}> {
  const token = localStorage.getItem('token');

  const response = await fetch(`/api/rolling-stories/${storyId}/generate/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(request),
    signal: abortSignal,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          return;
        }
        try {
          const parsed = JSON.parse(data);
          yield parsed;
        } catch {
          // Ignore parse errors for incomplete data
        }
      }
    }
  }
};
