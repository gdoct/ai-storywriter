import { LLMConfig, BackendType } from '../types/LLMTypes';
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
  // client-side convenience flag indicating if Google is linked
  isGoogleLinked?: boolean;
}

export interface BYOKCredentials {
  provider: 'github' | 'openai';
  apiKey: string;
  baseUrl?: string;
}

// User LLM Settings - NEW APPROACH using user endpoints
export async function getUserLLMSettings(): Promise<any> {
  try {
    const response = await apiRequest('/api/user/llm', { method: 'GET' });
    return response.data;
  } catch (error) {
    console.error('Error fetching user LLM settings:', error);
    return {
      llm_mode: 'member',
      byok_provider: null,
      available_byok_providers: [],
      member_mode_providers: []
    };
  }
}

// LLM Settings (DEPRECATED - keeping for admin usage only)
export async function getSavedSettings(): Promise<LLMConfig | null> {
  // For regular users, we should get user settings instead
  try {
    const userLLMSettings = await getUserLLMSettings();
    
    // For member mode users, we need to check what provider is actually available
    let backendType: BackendType = 'lmstudio'; // Default fallback
    
    if (userLLMSettings.llm_mode === 'byok' && userLLMSettings.byok_provider) {
      if (userLLMSettings.byok_provider === 'openai') {
        backendType = 'chatgpt';
      } else if (userLLMSettings.byok_provider === 'github') {
        backendType = 'github';
      }
    } else if (userLLMSettings.member_mode_providers?.length > 0) {
      // Use the first available provider
      const provider = userLLMSettings.member_mode_providers[0];
      if (provider.provider_name === 'lmstudio') {
        backendType = 'lmstudio';
      } else if (provider.provider_name === 'ollama') {
        backendType = 'ollama';
      } else if (provider.provider_name === 'openai') {
        backendType = 'chatgpt';
      } else if (provider.provider_name === 'github') {
        backendType = 'github';
      }
    }
    
    // Convert to LLMConfig format for backward compatibility
    const config: LLMConfig = {
      backendType: backendType,
      lmstudio: { url: 'http://localhost:1234' },
      ollama: { url: 'http://localhost:11434' },
      chatgpt: { apiKey: '' },
      github: { githubToken: '' },
      showThinking: userLLMSettings.show_thinking || false,
    };
    
    return config;
  } catch (error) {
    // Fallback to admin endpoint for admin users
    try {
      return await fetchLLMSettings();
    } catch (adminError) {
      console.error('Error fetching settings (admin fallback also failed):', adminError);
      return null;
    }
  }
}

export async function saveSettings(config: LLMConfig): Promise<LLMConfig | null> {
  return await saveLLMSettings(config);
}

export async function getShowThinkingSetting(): Promise<boolean> {
  try {
    // Try to get user's show thinking preference first
    const userLLMSettings = await getUserLLMSettings();
    return userLLMSettings?.show_thinking || false;
  } catch (error) {
    // Fallback to admin settings for backward compatibility
    try {
      const config = await fetchLLMSettings();
      return config?.showThinking || false;
    } catch (adminError) {
      console.error('Error getting show thinking setting:', adminError);
      return false;
    }
  }
}

// User Settings
export async function getUserSettings(): Promise<UserSettings> {
  try {
    const response = await apiRequest('/api/user/settings', { method: 'GET' });
    const backendData = response.data;
    
    // Convert snake_case to camelCase for frontend
    const frontendSettings: UserSettings = {
      username: backendData.username || '',
      email: backendData.email || '',
      firstName: backendData.first_name || '',
      lastName: backendData.last_name || '',
      notifications: backendData.notifications || {
        email: true,
        marketing: false
      },
      llmMode: backendData.llm_mode || 'member',
      byokProvider: backendData.byok_provider
      ,
      isGoogleLinked: !!backendData.google_id || (backendData.auth_provider === 'google')
    };
    
    return frontendSettings;
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
    // Convert camelCase to snake_case for backend
    const backendSettings = {
      username: settings.username,
      email: settings.email,
      first_name: settings.firstName,
      last_name: settings.lastName,
      notifications: settings.notifications,
      llm_mode: settings.llmMode,
      byok_provider: settings.byokProvider
    };

    await apiRequest('/api/user/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify(backendSettings)
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

export async function isUserInBYOKMode(): Promise<boolean> {
  try {
    const userSettings = await getUserSettings();
    return userSettings.llmMode === 'byok';
  } catch (error) {
    console.error('Error checking user BYOK mode:', error);
    return false;
  }
}

export function getBYOKHeaders(): Record<string, string> {
  const credentials = getBYOKCredentials();
  if (!credentials || !credentials.apiKey) {
    return {};
  }
  
  const headers: Record<string, string> = {
    'X-BYOK-API-Key': credentials.apiKey
  };
  
  if (credentials.baseUrl) {
    headers['X-BYOK-Base-URL'] = credentials.baseUrl;
  }
  
  return headers;
}
