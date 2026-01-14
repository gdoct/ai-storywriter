// frontend/src/services/imageGenerationService.ts
import { getToken } from './security';
import { getBYOKHeaders, isUserInBYOKMode } from './settings';

export interface ImageGenerationOptions {
  model?: string;
  size?: string;
  quality?: string;
  style?: string;
  n?: number;
  signal?: AbortSignal;
}

export interface GeneratedImage {
  url?: string;
  b64_json?: string;
  revised_prompt?: string;
}

export interface ImageGenerationResult {
  images: GeneratedImage[];
  provider: string;
  model: string;
  prompt: string;
  created?: number;
}

export type ImageGenerationStreamCallback = (status: string, result?: ImageGenerationResult, error?: string) => void;

// Auto-detect if we're running in dev mode (localhost:3000) or production 
const isDevMode = window.location.port === '3000';
const backendUrl = import.meta.env.VITE_API_URL;
const IMAGE_PROXY_ENDPOINT = isDevMode && backendUrl
  ? `${backendUrl}/api/proxy/image/v1/generations`
  : '/api/proxy/image/v1/generations';

const IMAGE_MODELS_ENDPOINT = isDevMode && backendUrl
  ? `${backendUrl}/api/proxy/image/v1/models`
  : '/api/proxy/image/v1/models';

const IMAGE_STATUS_ENDPOINT = isDevMode && backendUrl
  ? `${backendUrl}/api/proxy/image/v1/status`
  : '/api/proxy/image/v1/status';

/**
 * Fetch available image generation models
 */
export async function fetchImageGenerationModels(): Promise<string[]> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    // Add BYOK headers if user is in BYOK mode
    const isInBYOKMode = await isUserInBYOKMode();
    if (isInBYOKMode) {
      const byokHeaders = getBYOKHeaders();
      Object.assign(headers, byokHeaders);
    }
    
    const response = await fetch(IMAGE_MODELS_ENDPOINT, {
      headers
    });
    
    if (!response.ok) {
      console.error('Failed to fetch image generation models:', response.status);
      return [];
    }
    
    const data = await response.json();
    return data.data ? data.data.map((model: any) => model.id) : [];
  } catch (error) {
    console.error('Error fetching image generation models:', error);
    return [];
  }
}

/**
 * Get image generation service status
 */
export async function getImageGenerationStatus(): Promise<{busy: boolean}> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(IMAGE_STATUS_ENDPOINT, {
      headers
    });
    
    if (!response.ok) {
      return { busy: false };
    }
    
    const data = await response.json();
    return { busy: data.busy || false };
  } catch (error) {
    console.error('Error checking image generation status:', error);
    return { busy: false };
  }
}

/**
 * Generate images from text prompt with streaming status updates
 */
export async function streamImageGeneration(
  prompt: string,
  onStream: ImageGenerationStreamCallback,
  options: ImageGenerationOptions = {}
): Promise<void> {
  try {
    // Create a chat-style message for the image generation API
    const messages = [
      {
        role: 'user',
        content: prompt
      }
    ];
    
    const payload: any = {
      model: options.model || 'dall-e-3',
      messages,
      temperature: 0.7, // Not used for image generation but required by API
      max_tokens: 1000,  // Not used for image generation but required by API
      // Image-specific options would be handled by the backend
      size: options.size,
      quality: options.quality,
      style: options.style,
      n: options.n || 1
    };
    
    if (!options.model || options.model.trim() === '') {
      throw new Error('Model must be specified for image generation');
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    // Add BYOK headers if user is in BYOK mode
    const isInBYOKMode = await isUserInBYOKMode();
    if (isInBYOKMode) {
      const byokHeaders = getBYOKHeaders();
      Object.assign(headers, byokHeaders);
    }
    
    const response = await fetch(IMAGE_PROXY_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: options.signal,
    });
    
    // Handle error status codes
    if (!response.ok) {
      let errorMessage = `Image generation failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        if (response.status === 402) {
          errorMessage = errorData.detail || 'Insufficient credits for image generation';
        } else if (response.status === 403) {
          errorMessage = errorData.detail || 'Image generation not enabled for your account';
        } else if (response.status === 429) {
          errorMessage = errorData.detail || 'Image generation service is currently busy, please try again';
        } else {
          errorMessage = errorData.detail || errorData.error || errorMessage;
        }
      } catch (e) {
        console.error('Error parsing image generation service error response:', e);
      }
      onStream('error', undefined, errorMessage);
      throw new Error(errorMessage);
    }
    
    if (!response.body) throw new Error('No response body from image generation service');
    
    const reader = response.body.getReader();
    let done = false;
    
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      
      if (value) {
        const chunk = new TextDecoder().decode(value);
        chunk.split('\n').forEach(line => {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            
            try {
              const parsed = JSON.parse(data);
              
              if (parsed.status) {
                onStream(parsed.status, parsed.result, parsed.error);
              } else if (parsed.error) {
                onStream('error', undefined, parsed.error);
              }
            } catch (e) {
              if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
                console.error('Error parsing image generation SSE chunk:', e);
              }
            }
          }
        });
      }
    }
  } catch (error) {
    console.error('Image generation error:', error);
    onStream('error', undefined, error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

/**
 * Generate images from text prompt (non-streaming)
 */
export async function generateImage(
  prompt: string,
  options: ImageGenerationOptions = {}
): Promise<ImageGenerationResult> {
  return new Promise((resolve, reject) => {
    let result: ImageGenerationResult | null = null;
    
    const handleStream = (status: string, streamResult?: ImageGenerationResult, error?: string) => {
      if (status === 'completed' && streamResult) {
        result = streamResult;
      } else if (status === 'error' || error) {
        reject(new Error(error || 'Image generation failed'));
      }
    };
    
    streamImageGeneration(prompt, handleStream, options)
      .then(() => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error('No result received from image generation'));
        }
      })
      .catch(reject);
  });
}

/**
 * Get supported image sizes for a given model/provider
 */
export function getSupportedImageSizes(model?: string): string[] {
  if (!model) return ['1024x1024'];
  
  if (model.includes('dall-e')) {
    return ['1024x1024', '1792x1024', '1024x1792'];
  } else if (model.includes('stable')) {
    return ['512x512', '768x768', '1024x1024', '1536x1536'];
  }
  
  return ['512x512', '1024x1024'];
}

/**
 * Get supported styles for a given model/provider
 */
export function getSupportedImageStyles(model?: string): string[] {
  if (!model) return [];
  
  if (model.includes('dall-e')) {
    return ['vivid', 'natural'];
  } else if (model.includes('stable')) {
    return ['photographic', 'digital-art', 'comic-book', 'fantasy-art'];
  }
  
  return [];
}

/**
 * Get supported quality options for a given model/provider
 */
export function getSupportedImageQualities(model?: string): string[] {
  if (!model) return ['standard'];
  
  if (model.includes('dall-e-3')) {
    return ['standard', 'hd'];
  }
  
  return ['standard'];
}

/**
 * Create a detailed prompt for character image generation
 */
export function createCharacterImagePrompt(character: any, scenario?: any): string {
  let prompt = '';

  // Start with basic character description
  if (character.name) {
    prompt += `A character named ${character.name}. `;
  }

  // Add physical description if available
  if (character.appearance) {
    prompt += `${character.appearance}. `;
  }

  // Add gender information
  if (character.gender) {
    prompt += `Gender: ${character.gender}. `;
  }

  // Add age information
  if (character.age) {
    prompt += `Age: ${character.age}. `;
  }

  // Add personality traits
  if (character.personality) {
    prompt += `Personality: ${character.personality}. `;
  }

  // Add scenario context if available
  if (scenario) {
    if (scenario.writingStyle?.genre) {
      prompt += `Genre: ${scenario.writingStyle.genre}. `;
    }
    if (scenario.setting) {
      prompt += `Setting: ${scenario.setting}. `;
    }
  }

  // Add default styling instructions
  prompt += 'High quality portrait, detailed, professional artwork style.';

  return prompt.trim();
}

/**
 * Create a detailed prompt for scenario image generation
 */
export function createScenarioImagePrompt(scenario: any): string {
  let prompt = '';

  // Start with the scenario title
  if (scenario.title) {
    prompt += `Scene from "${scenario.title}". `;
  }

  // Add setting information
  if (scenario.setting) {
    prompt += `${scenario.setting}. `;
  }

  // Add genre-specific styling
  if (scenario.writingStyle?.genre) {
    const genre = scenario.writingStyle.genre.toLowerCase();
    prompt += `${scenario.writingStyle.genre} genre. `;

    // Add genre-specific visual style hints
    if (genre.includes('fantasy')) {
      prompt += 'Fantasy art style, magical atmosphere. ';
    } else if (genre.includes('sci-fi') || genre.includes('science fiction')) {
      prompt += 'Sci-fi art style, futuristic elements. ';
    } else if (genre.includes('horror')) {
      prompt += 'Dark, atmospheric, suspenseful mood. ';
    } else if (genre.includes('romance')) {
      prompt += 'Romantic, warm lighting, emotional atmosphere. ';
    } else if (genre.includes('mystery')) {
      prompt += 'Mysterious, shadowy, intriguing atmosphere. ';
    }
  }

  // Add mood information
  if (scenario.writingStyle?.mood) {
    prompt += `Mood: ${scenario.writingStyle.mood}. `;
  }

  // Add description if available
  if (scenario.description) {
    // Take first 200 characters of description to avoid overly long prompts
    const shortDesc = scenario.description.length > 200
      ? scenario.description.substring(0, 200) + '...'
      : scenario.description;
    prompt += `${shortDesc}. `;
  }

  // Add default styling instructions
  prompt += 'High quality artwork, detailed, cinematic composition, professional illustration style.';

  return prompt.trim();
}