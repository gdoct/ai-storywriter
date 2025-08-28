/**
 * Image Generation Service
 * Handles AI image generation requests
 */

import axios from 'axios';

export interface ImageGenerationRequest {
  prompt: string;
  model: string;
  n?: number;
  size?: string;
}

export interface ImageGenerationResponse {
  created: number;
  data: Array<{
    url: string;
    filename: string;
  }>;
}

/**
 * Generate an image using the backend API
 */
export async function generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
  try {
    const response = await axios.post('/v1/images/generations', request, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error || error.message;
      throw new Error(`Image generation failed: ${message}`);
    }
    throw error;
  }
}

/**
 * Create a prompt for scenario image generation
 */
export function createScenarioImagePrompt(scenario: any): string {
  const parts: string[] = [];

  // Add title if available
  if (scenario.title) {
    parts.push(`A scene from "${scenario.title}"`);
  }

  // Add setting/genre information
  if (scenario.setting) {
    parts.push(`set in ${scenario.setting}`);
  }

  if (scenario.genre) {
    parts.push(`in the ${scenario.genre} genre`);
  }

  // Add visual description if available
  if (scenario.visualDescription) {
    parts.push(scenario.visualDescription);
  }

  // Add location information if available
  if (scenario.locations && scenario.locations.length > 0) {
    const primaryLocation = scenario.locations[0];
    if (primaryLocation.visualDescription) {
      parts.push(`featuring ${primaryLocation.visualDescription}`);
    }
  }

  // Add character information if available
  if (scenario.characters && scenario.characters.length > 0) {
    const characterDescriptions = scenario.characters
      .filter((char: any) => char.appearance)
      .slice(0, 2) // Limit to first 2 characters to avoid overly long prompts
      .map((char: any) => char.appearance);
    
    if (characterDescriptions.length > 0) {
      parts.push(`with characters: ${characterDescriptions.join(', ')}`);
    }
  }

  // Create the final prompt
  let prompt = parts.join(', ');
  
  // Add style instructions
  prompt += '. High quality, detailed, cinematic composition, professional artwork';

  return prompt;
}

/**
 * Create a prompt for character image generation
 */
export function createCharacterImagePrompt(character: any, scenario?: any): string {
  const parts: string[] = [];

  // Start with character name
  if (character.name) {
    parts.push(`Portrait of ${character.name}`);
  } else {
    parts.push('Character portrait');
  }

  // Add appearance description
  if (character.appearance) {
    parts.push(character.appearance);
  }

  // Add role/background if available
  if (character.role) {
    parts.push(`who is a ${character.role}`);
  }

  if (character.background) {
    parts.push(character.background);
  }

  // Add scenario context if available
  if (scenario?.setting) {
    parts.push(`in a ${scenario.setting} setting`);
  }

  if (scenario?.genre) {
    parts.push(`${scenario.genre} style`);
  }

  // Create the final prompt
  let prompt = parts.join(', ');
  
  // Add style instructions for character portraits
  prompt += '. High quality portrait, detailed facial features, professional character art, cinematic lighting';

  return prompt;
}