import { Scenario } from '../types/ScenarioTypes';
import { getToken } from './security';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export interface Story {
  id: string;
  content: string;
  timestamp: string;
  scenario_id: string;
}

export interface StoryPreview {
  id: string;
  text: string;
  full_text_available: boolean;
  created_at: string;
}

export const saveStory = async (scenario: Scenario, content: string): Promise<Story> => {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE}/api/story/${scenario.id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ 
      content,
      scenario: scenario
    })
  });

  if (!response.ok) {
    throw new Error('Failed to save story');
  }

  return response.json();
};

export const getStoriesByScenario = async (scenarioId: string): Promise<Story[]> => {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  // First get the story previews
  const response = await fetch(`${API_BASE}/api/story/${scenarioId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch stories');
  }

  const previews: StoryPreview[] = await response.json();
  
  // For each story, get the full content
  const stories: Story[] = [];
  for (const preview of previews) {
    const fullStory = await getStoryById(preview.id);
    stories.push({
      id: fullStory.id,
      content: fullStory.text,
      timestamp: fullStory.created_at,
      scenario_id: fullStory.scenario_id
    });
  }
  
  return stories;
};

export const getStoryById = async (storyId: string): Promise<{id: string, text: string, created_at: string, scenario_id: string}> => {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE}/api/story/single/${storyId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch story');
  }

  return response.json();
};

export const deleteStory = async (storyId: string): Promise<void> => {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE}/api/story/delete/${storyId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to delete story');
  }
};
