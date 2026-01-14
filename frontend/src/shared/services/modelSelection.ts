// Service for managing the currently selected models across different AI types
// This stores model selections in localStorage and maintains consistency

const TEXT_MODEL_KEY = 'storywriter_selected_model';
const MULTIMODAL_SETTINGS_KEY = 'storywriter_multimodal_settings';
const IMAGE_SETTINGS_KEY = 'storywriter_image_settings';

export type ModelType = 'text' | 'multimodal' | 'image';

export interface ModelSettings {
  text?: {
    model: string;
    temperature?: number;
    seed?: number | null;
  };
  multimodal?: {
    enabled: boolean;
    model: string;
    temperature?: number;
  };
  image?: {
    enabled: boolean;
    model: string;
    size?: string;
    quality?: string;
    style?: string;
  };
}

// Legacy functions for text generation (backwards compatibility)
export function getSelectedModel(): string | null {
  return localStorage.getItem(TEXT_MODEL_KEY);
}

export function setSelectedModel(model: string): void {
  localStorage.setItem(TEXT_MODEL_KEY, model);

  // Dispatch event to notify other components
  window.dispatchEvent(new CustomEvent('storywriter-model-changed', {
    detail: { type: 'text', model }
  }));
}

export function clearSelectedModel(): void {
  localStorage.removeItem(TEXT_MODEL_KEY);
}

// New functions for managing all model types
export function getModelSettings(): ModelSettings {
  const settings: ModelSettings = {};

  // Text model
  const textModel = localStorage.getItem(TEXT_MODEL_KEY);
  if (textModel) {
    const temperature = localStorage.getItem('storywriter_temperature');
    settings.text = {
      model: textModel,
      temperature: temperature ? parseFloat(temperature) : undefined
    };
  }

  // Multimodal settings
  const multimodalSettings = localStorage.getItem(MULTIMODAL_SETTINGS_KEY);
  if (multimodalSettings) {
    try {
      settings.multimodal = JSON.parse(multimodalSettings);
    } catch (error) {
      console.error('Failed to parse multimodal settings:', error);
    }
  }

  // Image settings
  const imageSettings = localStorage.getItem(IMAGE_SETTINGS_KEY);
  if (imageSettings) {
    try {
      settings.image = JSON.parse(imageSettings);
    } catch (error) {
      console.error('Failed to parse image settings:', error);
    }
  }

  return settings;
}

export function getSelectedModelByType(type: ModelType): string | null {
  switch (type) {
    case 'text':
      return getSelectedModel();
    case 'multimodal': {
      const settings = localStorage.getItem(MULTIMODAL_SETTINGS_KEY);
      if (settings) {
        try {
          const parsed = JSON.parse(settings);
          return parsed.model || null;
        } catch {
          return null;
        }
      }
      return null;
    }
    case 'image': {
      const settings = localStorage.getItem(IMAGE_SETTINGS_KEY);
      if (settings) {
        try {
          const parsed = JSON.parse(settings);
          return parsed.model || null;
        } catch {
          return null;
        }
      }
      return null;
    }
    default:
      return null;
  }
}

export function setModelByType(type: ModelType, model: string, additionalSettings?: any): void {
  switch (type) {
    case 'text':
      setSelectedModel(model);
      break;
    case 'multimodal': {
      const existing = localStorage.getItem(MULTIMODAL_SETTINGS_KEY);
      let settings = {};
      if (existing) {
        try {
          settings = JSON.parse(existing);
        } catch {
          settings = {};
        }
      }

      const newSettings = { ...settings, model, ...additionalSettings };
      localStorage.setItem(MULTIMODAL_SETTINGS_KEY, JSON.stringify(newSettings));

      // Dispatch event
      window.dispatchEvent(new CustomEvent('storywriter-model-changed', {
        detail: { type: 'multimodal', model, settings: newSettings }
      }));
      break;
    }
    case 'image': {
      const existing = localStorage.getItem(IMAGE_SETTINGS_KEY);
      let settings = {};
      if (existing) {
        try {
          settings = JSON.parse(existing);
        } catch {
          settings = {};
        }
      }

      const newSettings = { ...settings, model, ...additionalSettings };
      localStorage.setItem(IMAGE_SETTINGS_KEY, JSON.stringify(newSettings));

      // Dispatch event
      window.dispatchEvent(new CustomEvent('storywriter-model-changed', {
        detail: { type: 'image', model, settings: newSettings }
      }));
      break;
    }
  }
}
