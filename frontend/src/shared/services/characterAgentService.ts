// frontend/src/services/characterAgentService.ts
import { getToken } from './security';
import { Character, Scenario } from '../types/ScenarioTypes';

export interface CharacterField {
  field_name: string;
  value: any;
  status: 'generating' | 'streaming' | 'completed' | 'error';
  error?: string;
}

export interface CharacterStreamingEvent {
  event_type: 'field_update' | 'image_generated' | 'complete' | 'error';
  character_id?: string;
  field?: CharacterField;
  image_uri?: string;
  error?: string;
  complete?: boolean;
}

export interface CharacterGenerationOptions {
  scenario: Scenario;
  imageFile?: File;
  imageUri?: string;
  generateImage?: boolean;
  imageGenerationOptions?: Record<string, any>;
}

export interface CharacterModificationOptions {
  scenario: Scenario;
  characterId: string;
  fieldsToModify: string[];
  imageFile?: File;
  imageUri?: string;
  generateImage?: boolean;
  imageGenerationOptions?: Record<string, any>;
}

// Auto-detect if we're running in dev mode (localhost:3000) or production
const isDevMode = window.location.port === '3000';
const backendUrl = import.meta.env.VITE_API_URL;
const CHARACTER_AGENT_BASE = isDevMode && backendUrl
  ? `${backendUrl}/api/agent/character`
  : '/api/agent/character';

export type CharacterStreamCallback = (event: CharacterStreamingEvent) => void;

/**
 * Generate a new character using the character agent with streaming updates
 */
export async function generateCharacterWithAgent(
  options: CharacterGenerationOptions,
  onStream: CharacterStreamCallback
): Promise<void> {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication token required');
  }

  // Prepare form data
  const formData = new FormData();
  formData.append('scenario', JSON.stringify(options.scenario));
  formData.append('generate_image', String(options.generateImage || false));

  if (options.imageFile) {
    formData.append('image_file', options.imageFile);
  }

  if (options.imageUri) {
    formData.append('image_uri', options.imageUri);
  }

  if (options.imageGenerationOptions) {
    formData.append('image_generation_options', JSON.stringify(options.imageGenerationOptions));
  }

  try {
    const response = await fetch(`${CHARACTER_AGENT_BASE}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `Character generation failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        if (response.status === 402) {
          errorMessage = errorData.detail || 'Insufficient credits for character generation';
        } else if (response.status === 403) {
          errorMessage = errorData.detail || 'Character generation not enabled for your account';
        } else if (response.status === 429) {
          errorMessage = errorData.detail || 'Character agent is currently busy, please try again';
        } else {
          errorMessage = errorData.detail || errorData.error || errorMessage;
        }
      } catch (e) {
        console.error('Error parsing character agent error response:', e);
      }
      throw new Error(errorMessage);
    }

    if (!response.body) {
      throw new Error('No response body from character agent');
    }

    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;

            try {
              const event: CharacterStreamingEvent = JSON.parse(data);
              onStream(event);
            } catch (e) {
              if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
                console.error('Error parsing character agent SSE chunk:', e);
                console.error('Raw data was:', data);
                // Try to extract error message from malformed JSON
                if (data.includes('ValidationError') || data.includes('validation')) {
                  onStream({
                    event_type: 'error',
                    error: 'Character generation validation failed. Please check your input and try again.'
                  });
                  return;
                }
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    console.error('Character generation error:', error);
    throw error;
  }
}

/**
 * Modify an existing character using the character agent with streaming updates
 */
export async function modifyCharacterWithAgent(
  options: CharacterModificationOptions,
  onStream: CharacterStreamCallback
): Promise<void> {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication token required');
  }

  // Prepare form data
  const formData = new FormData();
  formData.append('scenario', JSON.stringify(options.scenario));
  formData.append('character_id', options.characterId);
  formData.append('fields_to_modify', JSON.stringify(options.fieldsToModify));
  formData.append('generate_image', String(options.generateImage || false));

  if (options.imageFile) {
    formData.append('image_file', options.imageFile);
  }

  if (options.imageUri) {
    formData.append('image_uri', options.imageUri);
  }

  if (options.imageGenerationOptions) {
    formData.append('image_generation_options', JSON.stringify(options.imageGenerationOptions));
  }

  try {
    const response = await fetch(`${CHARACTER_AGENT_BASE}/modify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `Character modification failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        if (response.status === 402) {
          errorMessage = errorData.detail || 'Insufficient credits for character modification';
        } else if (response.status === 403) {
          errorMessage = errorData.detail || 'Character modification not enabled for your account';
        } else if (response.status === 429) {
          errorMessage = errorData.detail || 'Character agent is currently busy, please try again';
        } else {
          errorMessage = errorData.detail || errorData.error || errorMessage;
        }
      } catch (e) {
        console.error('Error parsing character agent error response:', e);
      }
      throw new Error(errorMessage);
    }

    if (!response.body) {
      throw new Error('No response body from character agent');
    }

    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;

            try {
              const event: CharacterStreamingEvent = JSON.parse(data);
              onStream(event);
            } catch (e) {
              if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
                console.error('Error parsing character agent SSE chunk:', e);
                console.error('Raw data was:', data);
                // Try to extract error message from malformed JSON
                if (data.includes('ValidationError') || data.includes('validation')) {
                  onStream({
                    event_type: 'error',
                    error: 'Character generation validation failed. Please check your input and try again.'
                  });
                  return;
                }
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    console.error('Character modification error:', error);
    throw error;
  }
}

/**
 * Convert character agent fields to a Character object
 */
export function buildCharacterFromFields(characterId: string, fields: CharacterField[]): Character {
  const character: Character = {
    id: characterId,
    name: '',
    alias: '',
    role: '',
    gender: '',
    appearance: '',
    backstory: '',
    extraInfo: '',
  };

  // Map character agent fields to Character properties
  const fieldMapping: Record<string, keyof Character> = {
    'name': 'name',
    'age': 'extraInfo', // Age can be included in extraInfo
    'gender': 'gender',
    'appearance': 'appearance',
    'personality': 'extraInfo', // Personality can be included in extraInfo
    'background': 'backstory',
    'alias': 'alias',
    'role': 'role',
  };

  for (const field of fields) {
    if (field.status === 'completed' && field.value) {
      const targetProperty = fieldMapping[field.field_name];
      if (targetProperty) {
        if (targetProperty === 'extraInfo') {
          // Combine multiple fields into extraInfo
          const currentExtraInfo = character.extraInfo || '';
          const fieldLabel = field.field_name.charAt(0).toUpperCase() + field.field_name.slice(1);
          character.extraInfo = currentExtraInfo
            ? `${currentExtraInfo}\n\n${fieldLabel}: ${field.value}`
            : `${fieldLabel}: ${field.value}`;
        } else {
          (character as any)[targetProperty] = field.value;
        }
      }
    }
  }

  return character;
}

/**
 * Check character agent health
 */
export async function checkCharacterAgentHealth(): Promise<{ status: string; service: string }> {
  try {
    const response = await fetch(`${CHARACTER_AGENT_BASE}/health`);
    if (response.ok) {
      return await response.json();
    }
    throw new Error(`Health check failed: ${response.status}`);
  } catch (error) {
    console.error('Character agent health check failed:', error);
    throw error;
  }
}