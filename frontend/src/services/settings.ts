import { LMStudioConfig } from '../types/LMStudioTypes';

const SETTINGS_KEY = 'storywriter_settings';

interface Settings {
  lmStudio: LMStudioConfig;
  // Add other settings here as needed
}

const defaultSettings: Settings = {
  lmStudio: {
    baseUrl: 'http://localhost:1234',
    modelName: 'default'
  }
};

export function getSavedSettings(): Settings {
  try {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
  } catch (error) {
    console.error('Error loading settings from localStorage:', error);
  }
  return defaultSettings;
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getLMStudioConfig(): LMStudioConfig {
  return getSavedSettings().lmStudio;
}

export function updateLMStudioConfig(config: Partial<LMStudioConfig>): void {
  const settings = getSavedSettings();
  settings.lmStudio = { ...settings.lmStudio, ...config };
  saveSettings(settings);
}
