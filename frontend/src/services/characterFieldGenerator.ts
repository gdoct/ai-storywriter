// Service for generating individual character field values
import { Character, Scenario } from '../types/ScenarioTypes';
import { createCharacterFieldPrompt } from './llmPromptService';
import { streamChatCompletion } from './llmService';
import { getSelectedModel } from './modelSelection';

/**
 * Generate a value for a specific character field using AI
 * @param scenario Current scenario for context
 * @param character Character being edited
 * @param fieldName Name of the field to generate
 * @param fieldDisplayName Human-readable field name
 * @param options Generation options
 * @returns Promise with result and cancel function
 */
export async function generateCharacterField(
  scenario: Scenario,
  character: Character,
  fieldName: string,
  fieldDisplayName: string,
  options: {
    onProgress?: (text: string) => void,
    temperature?: number
  } = {}
): Promise<{ result: Promise<string>; cancelGeneration: () => void }> {
  let cancelled = false;
  let cancelGeneration = () => { cancelled = true; };

  const promptObj = createCharacterFieldPrompt(scenario, character, fieldName, fieldDisplayName);
  
  const resultPromise = new Promise<string>(async (resolve, reject) => {
    try {
      const selectedModel = getSelectedModel();
      let fullText = '';
      
      await streamChatCompletion(
        promptObj,
        (text) => {
          if (!cancelled) {
            // Send the full accumulated text to onProgress
            if (options.onProgress) {
              options.onProgress(text);
            }
            fullText = text;
          }
        },
        { 
          model: selectedModel || undefined,
          temperature: options.temperature || 0.8, 
          max_tokens: 200  // Keep field values concise
        }
      );
      
      if (!cancelled) {
        // Clean up the result - remove any markdown formatting or extra whitespace
        let cleaned = fullText.trim();
        
        // Remove quotes if the entire response is wrapped in them
        if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
            (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
          cleaned = cleaned.slice(1, -1);
        }
        
        resolve(cleaned);
      }
    } catch (e) { 
      if (!cancelled) {
        reject(e);
      }
    }
  });

  return { result: resultPromise, cancelGeneration };
}
