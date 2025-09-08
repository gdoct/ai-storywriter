import axios from 'axios';
import { Scenario } from '../types/ScenarioTypes';
import { getToken } from './security';

// Auto-detect if we're running in dev mode or production
const isDevMode = window.location.port === '3000';
const backendUrl = import.meta.env.VITE_API_URL;
const API_BASE = isDevMode && backendUrl ? backendUrl : '';

export interface ScenarioImageUploadResponse {
  imageId: string;
  imageUrl: string;
  message: string;
}

export interface ScenarioWithImageUploadResponse {
  scenario: Scenario;
  imageId: string;
  imageUrl: string;
  message: string;
}

export const uploadScenarioImage = async (scenarioId: string, imageFile: File): Promise<ScenarioImageUploadResponse> => {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch(`${API_BASE}/api/scenario/${scenarioId}/upload-image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    let errorMessage = 'Failed to upload image';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      errorMessage = `Server error: ${response.status} ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

export const deleteScenarioImage = async (scenarioId: string): Promise<void> => {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE}/api/scenario/${scenarioId}/delete-image`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    let errorMessage = 'Failed to delete image';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      errorMessage = `Server error: ${response.status} ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }
};

export const uploadImageWithScenarioData = async (scenario: Scenario, imageFile: File): Promise<ScenarioWithImageUploadResponse> => {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('scenarioData', JSON.stringify(scenario));

  const response = await fetch(`${API_BASE}/api/scenario/upload-image-with-data`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    let errorMessage = 'Failed to upload image with scenario data';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      errorMessage = `Server error: ${response.status} ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

/**
 * Get a random scenario background image URL for a specific genre
 */
export const getRandomScenarioImage = async (genre: string): Promise<{ url: string }> => {
  const params = {
    genre: genre || 'general',
    type: 'cover' // Updated to 'cover' as per backend requirements
  };

  const response = await axios.get<{ url: string }>(`${API_BASE}/api/images/random`, {
    params
  });

  return response.data;
};
