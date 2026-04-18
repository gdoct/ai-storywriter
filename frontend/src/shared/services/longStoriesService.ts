/**
 * Long Stories Service - API calls for the long story generation feature
 */
import axios from './http';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LongStory {
  id: number;
  scenario_id: string;
  user_id: string;
  title: string;
  status: 'draft' | 'arc_ready' | 'in_progress' | 'completed' | 'abandoned';
  synopsis: string | null;
  story_arc: string | null;  // JSON string: [{chapter_number, title, one_liner}]
  created_at: string;
  updated_at: string;
}

export interface LongStoryListItem extends LongStory {
  chapter_count: number;
}

export interface LongStoryChapter {
  id: number;
  long_story_id: number;
  chapter_number: number;
  title: string;
  one_liner: string | null;
  storyline: string | null;  // JSON string: {setup, main_event, conclusion}
  content: string | null;
  status: 'pending' | 'generating' | 'complete';
  created_at: string;
  updated_at: string;
}

export interface LongStoryDetail extends LongStory {
  chapters: LongStoryChapter[];
}

export interface ChapterArcItem {
  chapter_number: number;
  title: string;
  one_liner: string;
}

export interface ChapterStoryline {
  chapter_number: number;
  title: string;
  setup: string;
  main_event: string;
  conclusion: string;
}

// ── Streaming event types ─────────────────────────────────────────────────────

/** Events emitted by the arc-generation stream (Phase 1). */
export type LongStoryArcEvent =
  | { type: 'status'; message: string }
  | { type: 'synopsis'; content: string }
  | { type: 'arc'; chapters: ChapterArcItem[] }
  | { type: 'arc_ready'; total_chapters?: number }
  | { type: 'error'; error: string };

/** Events emitted by the chapter-generation stream (Phase 2 / single chapter). */
export type LongStoryEvent =
  | { type: 'status'; message: string }
  | { type: 'synopsis'; content: string }
  | { type: 'arc'; chapters: ChapterArcItem[] }
  | { type: 'chapter_start'; chapter_number: number; title: string; storyline: ChapterStoryline }
  | { type: 'token'; content: string }
  | { type: 'chapter_complete'; chapter_number: number; title: string; is_last?: boolean; total_chapters?: number }
  | { type: 'complete'; total_chapters: number }
  | { type: 'error'; error: string };

// ── API functions ─────────────────────────────────────────────────────────────

export const createLongStory = async (
  scenarioId: string,
  title: string
): Promise<LongStory> => {
  const response = await axios.post('/api/long-stories', {
    scenario_id: scenarioId,
    title,
  });
  return response.data;
};

export const fetchLongStories = async (): Promise<LongStoryListItem[]> => {
  const response = await axios.get('/api/long-stories');
  return response.data;
};

export const fetchLongStoryDetail = async (storyId: number): Promise<LongStoryDetail> => {
  const response = await axios.get(`/api/long-stories/${storyId}`);
  return response.data;
};

export const updateLongStory = async (
  storyId: number,
  updates: { title?: string; status?: LongStory['status'] }
): Promise<LongStory> => {
  const response = await axios.put(`/api/long-stories/${storyId}`, updates);
  return response.data;
};

export const deleteLongStory = async (storyId: number): Promise<void> => {
  await axios.delete(`/api/long-stories/${storyId}`);
};

/**
 * Save user-edited chapter arc (titles + one-liners) before chapter generation.
 * Resets pending chapters in the DB to match; completed chapters are preserved.
 */
export const updateStoryArc = async (
  storyId: number,
  chapters: ChapterArcItem[]
): Promise<void> => {
  await axios.put(`/api/long-stories/${storyId}/arc`, { chapters });
};

/**
 * Phase 1: Stream arc generation (synopsis + chapter arc) over SSE.
 * Call this before chapter generation to get the arc for user review.
 */
export const streamGenerateArc = async function* (
  storyId: number,
  abortSignal?: AbortSignal
): AsyncGenerator<LongStoryArcEvent> {
  const token = localStorage.getItem('token');

  const response = await fetch(`/api/long-stories/${storyId}/generate/arc/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    signal: abortSignal,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

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
        if (data === '[DONE]') return;
        try {
          yield JSON.parse(data) as LongStoryArcEvent;
        } catch {
          // Ignore parse errors for incomplete chunks
        }
      }
    }
  }
};

/**
 * Save a specific version of chapter content as canonical (for continuity).
 * Call this before generating the next chapter when the user has selected
 * a non-latest version of the current chapter.
 */
export const setChapterContent = async (
  storyId: number,
  chapterNumber: number,
  content: string
): Promise<void> => {
  await axios.put(`/api/long-stories/${storyId}/chapter/${chapterNumber}/content`, { content });
};

/**
 * Generate (or regenerate) a single chapter by number over SSE.
 * Requires arc to already be saved (status arc_ready or later).
 * Reads continuity from the previous chapter already in the DB.
 */
export const streamGenerateChapter = async function* (
  storyId: number,
  chapterNumber: number,
  abortSignal?: AbortSignal
): AsyncGenerator<LongStoryEvent> {
  const token = localStorage.getItem('token');

  const response = await fetch(
    `/api/long-stories/${storyId}/generate/chapter/${chapterNumber}/stream`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal: abortSignal,
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

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
        if (data === '[DONE]') return;
        try {
          yield JSON.parse(data) as LongStoryEvent;
        } catch {
          // ignore incomplete chunks
        }
      }
    }
  }
};

/**
 * Phase 2: Stream chapter generation over SSE.
 * Requires arc to already be saved (status arc_ready or later).
 * Yields typed events as the pipeline progresses.
 */
export const streamGenerateLongStory = async function* (
  storyId: number,
  abortSignal?: AbortSignal
): AsyncGenerator<LongStoryEvent> {
  const token = localStorage.getItem('token');

  const response = await fetch(`/api/long-stories/${storyId}/generate/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
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
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data) as LongStoryEvent;
          yield parsed;
        } catch {
          // Ignore parse errors for incomplete chunks
        }
      }
    }
  }
};
