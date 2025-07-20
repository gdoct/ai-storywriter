import { Scenario, Randomizer } from '../types/ScenarioTypes';
import axios from './http';

export const fetchAllScenarios = async (): Promise<{ id: string; title: string; synopsis: string }[]> => {
  try {
    const response = await axios.get('/api/scenario');
    return response.data;
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    throw error;
  }
};

export const fetchScenarioById = async (id: string): Promise<Scenario> => {
  try {
    const response = await axios.get(`/api/scenario/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching scenario ${id}:`, error);
    throw error;
  }
};

export const createScenario = async (scenario: Scenario): Promise<Scenario> => {
  try {
    const response = await axios.post('/api/scenario', scenario);
    return response.data;
  } catch (error) {
    console.error('Error creating scenario:', error);
    throw error;
  }
};

export const updateScenario = async (scenario: Scenario): Promise<Scenario> => {
  try {
    const response = await axios.put(`/api/scenario/${scenario.id}`, scenario);
    return response.data;
  } catch (error) {
    console.error(`Error updating scenario ${scenario.id}:`, error);
    throw error;
  }
};

export const deleteScenario = async (id: string): Promise<void> => {
  try {
    await axios.delete(`/api/scenario/${id}`);
  } catch (error) {
    console.error(`Error deleting scenario ${id}:`, error);
    throw error;
  }
};

interface StoryResponse {
  content: string;
  timestamp: string;
}

export const fetchGeneratedStory = async (scenarioId: string, timestamp?: string): Promise<StoryResponse | null> => {
  try {
    const params = timestamp ? { timestamp } : {};
    const response = await axios.get(`/api/story/${scenarioId}`, { params });
    return response.data;
  } catch (error) {
    // If error is 404, just return null (no story found)
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    console.error(`Error fetching generated story for scenario ${scenarioId}:`, error);
    throw error;
  }
};

export interface StoryVersion {
  timestamp: string;
  formattedDate: string;
}

export const fetchScenarioStoryList = async (scenarioId: string): Promise<StoryVersion[]> => {
  try {
    const response = await axios.get(`/api/story/${scenarioId}/list`);
    return response.data;
  } catch (error) {
    // If error is 404, return empty array (no stories found)
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return [];
    }
    console.error(`Error fetching story list for scenario ${scenarioId}:`, error);
    throw error;
  }
};

export const saveGeneratedStory = async (scenarioId: string, content: string): Promise<void> => {
  try {
    await axios.post(`/api/story/${scenarioId}`, { content });
  } catch (error) {
    console.error(`Error saving generated story for scenario ${scenarioId}:`, error);
    throw error;
  }
};

export interface DBStory {
  id: number;
  text: string;
  created_at: string;
}

export const fetchDBStories = async (scenarioId: number | string): Promise<DBStory[]> => {
  try {
    console.log(`Fetching stories for scenario ${scenarioId} (type: ${typeof scenarioId})`);
    const response = await axios.get(`/api/story/${scenarioId}`);
    console.log("API response for stories:", response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.log(`No stories found for scenario ${scenarioId} (404)`);
      return [];
    }
    console.error(`Error fetching DB stories for scenario ${scenarioId}:`, error);
    throw error;
  }
};

export const fetchSingleDBStory = async (storyId: number): Promise<DBStory | null> => {
  try {
    console.log(`Fetching single story ${storyId}`);
    const response = await axios.get(`/api/story/single/${storyId}`);
    console.log("API response for single story:", response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.log(`Story ${storyId} not found (404)`);
      return null;
    }
    console.error(`Error fetching single story ${storyId}:`, error);
    throw error;
  }
};

export const saveDBStory = async (scenarioId: number | string, text: string): Promise<DBStory> => {
  try {
    console.log(`Saving story for scenario ${scenarioId} (type: ${typeof scenarioId})`);
    // Send the story with key "content" as expected by the backend
    const response = await axios.post(`/api/story/${scenarioId}`, { content: text });
    console.log("API response for save:", response.data);
    return response.data;
  } catch (error) {
    console.error(`Error saving DB story for scenario ${scenarioId}:`, error);
    throw error;
  }
};

export const deleteDBStory = async (storyId: number): Promise<void> => {
  try {
    await axios.delete(`/api/story/delete/${storyId}`);
  } catch (error) {
    console.error(`Error deleting DB story ${storyId}:`, error);
    throw error;
  }
};

// Randomizer utility functions
export const createRandomizer = (name: string, keywords: string[], selectedCount: number = 1): Randomizer => {
  return {
    id: crypto.randomUUID(),
    name,
    description: '',
    keywords,
    selectedCount: keywords.length > 0 ? Math.min(selectedCount, keywords.length) : 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const getRandomizedKeywords = (randomizer: Randomizer): string[] => {
  if (!randomizer.isActive || randomizer.keywords.length === 0) {
    return [];
  }
  
  const shuffled = [...randomizer.keywords].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, randomizer.selectedCount);
};

export const getRandomizedKeywordsFromAll = (randomizers: Randomizer[]): string[] => {
  const allKeywords: string[] = [];
  
  randomizers.forEach(randomizer => {
    const keywords = getRandomizedKeywords(randomizer);
    allKeywords.push(...keywords);
  });
  
  return allKeywords;
};

// Continue story functionality
export const createContinuationScenario = async (originalStoryId: number, originalScenarioId: string): Promise<Scenario> => {
  try {
    const response = await axios.post(`/api/story/continue/${originalStoryId}`, {
      originalScenarioId
    });
    return response.data;
  } catch (error) {
    console.error('Error creating continuation scenario:', error);
    throw error;
  }
};
