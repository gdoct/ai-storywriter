import { Scenario } from '../types/ScenarioTypes';
import { chatCompletion } from './llmService';
import { getSelectedModel } from './modelSelection';
import { createScenario } from './scenario';
import { createSimilarScenarioPrompt } from './llmPromptService';
import { getRandomScenarioImage } from './scenarioImageService';
import axios from './http';
import JSON5 from 'json5';
import { jsonrepair } from 'jsonrepair';

export interface ScenarioSelections {
  retainCharacters: boolean;
  retainLocations: boolean;
  retainNotes: boolean;
  selectedCharacters: string[];
  selectedLocations: string[];
  count: number;
}

export interface GenerationProgress {
  currentIndex: number;
  totalCount: number;
  isRetrying: boolean;
  retryCount: number;
  onProgress?: (progress: GenerationProgress) => void;
  onAbort?: () => void;
}

/**
 * Get a random character portrait URL
 */
const getRandomCharacterImage = async (gender?: string): Promise<{ url: string }> => {
  const response = await axios.get<{ url: string }>('/api/images/random', {
    params: {
      genre: 'general',
      type: 'character',
      ...(gender && { gender })
    }
  });
  return response.data;
};

/**
 * Generate a single similar scenario with retry logic
 */
export const generateSingleScenario = async (
  fullScenario: Scenario, 
  selections: ScenarioSelections, 
  controller: AbortController,
  progress?: GenerationProgress
): Promise<Scenario> => {
  const MAX_RETRIES = 3;
  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    if (controller.signal.aborted) {
      throw new Error('Generation aborted');
    }

    try {
      // Update progress
      if (progress?.onProgress) {
        progress.onProgress({
          ...progress,
          isRetrying: attempts > 0,
          retryCount: attempts
        });
      }

      const prompt = createSimilarScenarioPrompt(fullScenario, selections);
      const selectedModel = getSelectedModel();
      const response = await chatCompletion(prompt, { 
        model: selectedModel || 'default-model',
        temperature: 0.8,
        max_tokens: 4000  // Increased for complex scenario generation
      });
      
      if (!response) {
        throw new Error('No response from AI service');
      }
      
      console.log(`Raw AI response (attempt ${attempts + 1}):`, response);
      
      // Parse the JSON response
      let newScenarioData: any;
      try {
        // Check for obvious truncation patterns before parsing
        if (response.includes('... (truncated)') || response.includes('...truncated') || response.includes('[truncated]')) {
          throw new Error('Response appears to be truncated');
        }

        // Extract JSON from markdown code blocks if present
        let jsonString = response.trim();
        
        // Handle markdown code blocks by extracting content between { and }
        if (jsonString.includes('```')) {
          const startIndex = jsonString.indexOf('{');
          const endIndex = jsonString.lastIndexOf('}');
          if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
            throw new Error('Could not extract JSON from markdown code block');
          }
          jsonString = jsonString.substring(startIndex, endIndex + 1);
        } else {
          // For non-markdown responses, try to extract JSON between first { and last }
          const startIndex = jsonString.indexOf('{');
          const endIndex = jsonString.lastIndexOf('}');
          if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
            jsonString = jsonString.substring(startIndex, endIndex + 1);
          }
        }

        // Clean up the JSON string more carefully to preserve structure
        const originalLength = jsonString.length;
        jsonString = jsonString
          .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '') // Remove control chars but keep \n, \r, \t
          .trim();

        // Additional checks for truncation after cleaning
        if (!jsonString.startsWith('{') || !jsonString.endsWith('}')) {
          throw new Error('Response does not appear to be complete JSON');
        }
        
        // Check if significant content was removed during cleaning
        if (originalLength - jsonString.length > 100) {
          throw new Error('Too many characters removed during cleaning, response may be corrupted');
        }

        // Parse JSON with improved error handling - try jsonrepair first, then JSON5
        try {
          newScenarioData = JSON.parse(jsonString);
        } catch (jsonError) {
          try {
            const repairedJson = jsonrepair(jsonString);
            newScenarioData = JSON.parse(repairedJson);
          } catch (repairError) {
            newScenarioData = JSON5.parse(jsonString);
          }
        }
        console.log(`Parsed scenario data (attempt ${attempts + 1}):`, newScenarioData);
        
        // Validate that required fields are present and complete
        if (!newScenarioData.title || !newScenarioData.characters || !Array.isArray(newScenarioData.characters)) {
          throw new Error('Generated scenario is missing required fields');
        }

        // Check that character data is complete
        // Ensure character fields are present; replace missing/undefined values with blanks
        for (let i = 0; i < newScenarioData.characters.length; i++) {
          const char = newScenarioData.characters[i] || {};
          newScenarioData.characters[i] = {
            ...char,
            name: typeof char.name === 'string' ? char.name : '',
            backstory: typeof char.backstory === 'string' ? char.backstory : '',
            gender: typeof char.gender === 'string' ? char.gender : '',
            role: typeof char.role === 'string' ? char.role : '',
            description: typeof char.description === 'string' ? char.description : '',
            // keep any other fields as-is
          };
        }

      } catch (parseError) {
        console.error('Failed to parse AI response:', response);
        console.error('Parse error:', parseError);
        attempts++;
        if (attempts >= MAX_RETRIES) {
          throw new Error(`Invalid response format from AI service after 3 attempts. Last error: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        }
        // Continue to retry
        continue;
      }
      
      // Reset retry state on success
      if (progress?.onProgress) {
        progress.onProgress({
          ...progress,
          isRetrying: false,
          retryCount: 0
        });
      }
      
      // Convert storyarc from array to string if needed
      const storyarc = Array.isArray(newScenarioData.storyarc) 
        ? newScenarioData.storyarc.map((item: string) => `• ${item}`).join('\n')
        : newScenarioData.storyarc;

      // Assign scenario image based on genre
      let scenarioImageUrl = '';
      try {
        if (newScenarioData.writingStyle?.genre) {
          const imageResult = await getRandomScenarioImage(newScenarioData.writingStyle.genre);
          scenarioImageUrl = imageResult.url;
        }
      } catch (error) {
        console.warn('Failed to get random scenario image:', error);
        // Continue without image - not a critical failure
      }

      // Ensure all characters have unique IDs and appropriate portrait images
      const charactersWithIdsAndImages = await Promise.all(
        (newScenarioData.characters || []).map(async (character: any, index: number) => {
          let characterImageUrl = '';

          // normalize character name and gender to avoid runtime errors
          const charName = typeof character?.name === 'string' ? character.name : '';
          const charGender = typeof character?.gender === 'string' && character.gender.trim().length > 0
            ? character.gender.toLowerCase()
            : undefined;
          
          // Check if this character was retained from the original scenario
          // selectedCharacters contains character IDs, so we need to find the original character by matching names
          const originalCharacter = selections.retainCharacters && charName
            ? fullScenario.characters.find(c => 
                c.name === charName && selections.selectedCharacters.includes(c.id || '')
              ) || null
            : null;
          
          if (originalCharacter?.photoUrl) {
            // Retain the original character's image
            characterImageUrl = originalCharacter.photoUrl;
          } else {
            // Get a new random image matching the character's gender
            try {
              const portraitResult = await getRandomCharacterImage(charGender);
              characterImageUrl = portraitResult?.url || '';
            } catch (error) {
              console.warn(`Failed to get random character image for character ${index}:`, error);
              // Continue without image - not a critical failure
            }
          }

          // Use crypto.randomUUID when available for safer unique IDs, fallback otherwise
          const generatedId =
            character.id ||
            (typeof (globalThis as any).crypto?.randomUUID === 'function'
              ? (globalThis as any).crypto.randomUUID()
              : `char_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 11)}`);

          return {
            ...character,
            id: generatedId,
            photoUrl: characterImageUrl
          };
        })
      );

      // Ensure all locations have unique IDs
      const locationsWithIds = (newScenarioData.locations || []).map((location: any, index: number) => ({
        ...location,
        id: location.id || `loc_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 11)}`
      }));

      const createdScenario = await createScenario({
        title: newScenarioData.title,
        synopsis: newScenarioData.synopsis,
        writingStyle: newScenarioData.writingStyle,
        characters: charactersWithIdsAndImages,
        locations: locationsWithIds,
        backstory: newScenarioData.backstory,
        storyarc: storyarc,
        notes: newScenarioData.notes,
        imageUrl: scenarioImageUrl || undefined
      } as Scenario);
      
      return createdScenario;
      
    } catch (error) {
      attempts++;
      if (attempts >= MAX_RETRIES || controller.signal.aborted) {
        throw error;
      }
      // Continue to retry
    }
  }
  
  throw new Error('Failed to generate scenario after maximum retries');
};

/**
 * Generate multiple similar scenarios with progress tracking
 */
export const generateSimilarScenarios = async (
  fullScenario: Scenario,
  selections: ScenarioSelections,
  onProgress?: (progress: GenerationProgress) => void,
  onAbort?: () => void
): Promise<Scenario[]> => {
  const controller = new AbortController();
  const createdScenarios: Scenario[] = [];

  try {
    for (let i = 0; i < selections.count; i++) {
      if (controller.signal.aborted) {
        throw new Error('Generation aborted');
      }

      const progress: GenerationProgress = {
        currentIndex: i + 1,
        totalCount: selections.count,
        isRetrying: false,
        retryCount: 0,
        onProgress,
        onAbort: () => {
          controller.abort();
          onAbort?.();
        }
      };

      const createdScenario = await generateSingleScenario(fullScenario, selections, controller, progress);
      createdScenarios.push(createdScenario);
    }

    return createdScenarios;
    
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error('Generation was aborted');
    }
    throw error;
  }
};