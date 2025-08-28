import { getToken } from './security';

interface LocationContext {
  name?: string;
  visualDescription?: string;
  background?: string;
  extraInfo?: string;
}

/**
 * Generate a specific field for a location using an image
 */
export async function generateLocationField(
  imageFile: Blob,
  fieldName: string,
  locationContext: LocationContext,
  onStreamChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<void> {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('field_name', fieldName);
    formData.append('location_context', JSON.stringify(locationContext));
    
    const token = await getToken();
    const response = await fetch('/api/location-field/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
      signal
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate location field');
    }

    if (!response.body) {
      throw new Error('No response body received');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                onStreamChunk(parsed.choices[0].delta.content);
              }
            } catch (e) {
              // Skip malformed JSON
              console.warn('Failed to parse SSE data:', e);
              console.warn('Failed to parse SSE data:', data);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw error;
    }
    console.error('Location field generation error:', error);
    throw new Error(error.message || 'Failed to generate location field');
  }
}

/**
 * Create a location description prompt for a specific field
 */
export function createLocationFieldPrompt(fieldName: string, locationContext: LocationContext): string {
  const contextStr = Object.entries(locationContext)
    .filter(([key, value]) => value && key !== fieldName)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  const contextSection = contextStr ? `\n\nExisting location information:\n${contextStr}` : '';

  switch (fieldName) {
    case 'visualDescription':
      return `Analyze this image and provide a vivid, detailed description of the location's physical appearance and atmosphere. Focus on:
- Architectural details and structures
- Natural features and landscape
- Lighting, weather, and mood
- Colors, textures, and materials
- Scale and spatial relationships
- Any notable features or focal points

Write in a descriptive, immersive style that would help a reader visualize this location clearly.${contextSection}`;

    case 'background':
      return `Based on this image, create a rich background history for this location. Consider:
- Historical significance and origins
- Cultural or social importance
- Past events that may have occurred here
- Who built or inhabited this place
- How it has changed over time
- Its role in the broader world or story
- Legends, myths, or stories associated with it

Write in an informative style that provides context and depth.${contextSection}`;

    case 'extraInfo':
      return `Analyze this image and provide additional storytelling details about this location. Include:
- Unique or mysterious elements
- Hidden secrets or features
- Practical considerations (accessibility, dangers, resources)
- Sensory details (sounds, smells, textures)
- Potential story hooks or plot elements
- Connections to other places or characters
- Any other interesting or useful information

Focus on details that would be useful for storytelling and world-building.${contextSection}`;

    default:
      return `Analyze this image and provide detailed information about the location for the field "${fieldName}".${contextSection}`;
  }
}