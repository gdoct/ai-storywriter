import { LLMConfig } from '../types/LLMTypes';
import { fetchLLMSettings, saveLLMSettings } from './llmBackend';
import apiRequest from './http';

export interface UserSettings {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  notifications: {
    email: boolean;
    marketing: boolean;
  };
  llmMode: 'member' | 'byok';
  byokProvider?: 'github' | 'openai';
}

export interface BYOKCredentials {
  provider: 'github' | 'openai';
  apiKey: string;
  baseUrl?: string;
}

// LLM Settings (existing functionality)
export async function getSavedSettings(): Promise<LLMConfig | null> {
  return await fetchLLMSettings();
}

export async function saveSettings(config: LLMConfig): Promise<LLMConfig | null> {
  return await saveLLMSettings(config);
}

export async function getShowThinkingSetting(): Promise<boolean> {
  const config = await getSavedSettings();
  return config?.showThinking || false;
}

// User Settings
export async function getUserSettings(): Promise<UserSettings> {
  try {
    const response = await apiRequest('/api/user/settings', { method: 'GET' });
    return response.data;
  } catch (error) {
    console.error('Error fetching user settings:', error);
    // Return default settings as fallback
    const defaultSettings: UserSettings = {
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      notifications: {
        email: true,
        marketing: false
      },
      llmMode: 'member'
    };
    return defaultSettings;
  }
}

export async function saveUserSettings(settings: Partial<UserSettings>): Promise<void> {
  try {
    await apiRequest('/api/user/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify(settings)
    });
  } catch (error) {
    console.error('Error saving user settings:', error);
    throw new Error('Failed to save settings');
  }
}

// BYOK (Bring Your Own Key) functionality
const BYOK_STORAGE_KEY = 'storywriter_byok_credentials';

export function saveBYOKCredentials(credentials: BYOKCredentials): void {
  try {
    localStorage.setItem(BYOK_STORAGE_KEY, JSON.stringify(credentials));
  } catch (error) {
    console.error('Error saving BYOK credentials:', error);
    throw new Error('Failed to save API credentials');
  }
}

export function getBYOKCredentials(): BYOKCredentials | null {
  try {
    const stored = localStorage.getItem(BYOK_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error retrieving BYOK credentials:', error);
    return null;
  }
}

export function clearBYOKCredentials(): void {
  try {
    localStorage.removeItem(BYOK_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing BYOK credentials:', error);
  }
}

export function hasBYOKCredentials(): boolean {
  return getBYOKCredentials() !== null;
}
