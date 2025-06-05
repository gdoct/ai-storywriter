import { ChatMessage } from '../types/LMStudioTypes';
import { GeneratedStory, Scenario, StyleSettings } from '../types/ScenarioTypes';
import { formatScenarioAsMarkdown } from '../utils/scenarioToMarkdown';
import { configureLMStudioAPI, lmStudioAPI } from './lmstudioapi';
import { getLMStudioConfig } from './settings';

// Helper function to get stored temperature with fallback
function getStoredTemperature(): number {
  const savedTemp = localStorage.getItem('storywriter_temperature');
  return savedTemp ? parseFloat(savedTemp) : 0.8;
}

/**
 * Creates a prompt specifically for generating a backstory based on the scenario
 */
export function createBackstoryPrompt(scenario: Scenario): string {
  // Verify scenario is not null or undefined
  if (!scenario) {
    console.error("Error: scenario is null or undefined");
    scenario = {
      id: 'error-fallback',
      userId: 'system',
      createdAt: new Date(),
      writingStyle: { genre: "General Fiction" }
    };
  }
  
  // create a new scenario copying the scenario's writingStyle and the characters and the notes
  const writingStyle: StyleSettings = scenario.writingStyle || { genre: "General Fiction" };
  const newScenario: any = {
    title: scenario.title || "Random title",
    writingStyle: writingStyle,
    characters: Array.isArray(scenario.characters) ? scenario.characters.map(char => ({
      name: char.name || '',
      alias: char.alias || '',
      role: char.role || '',
      appearance: char.appearance || '',
      gender: char.gender || '',
      id: char.id || '',
      backstory: char.backstory || "",
      extraInfo: char.extraInfo || ""
    })) : [],
    notes: scenario.notes || ""
  };
  const markdown = formatScenarioAsMarkdown(newScenario);
  let prompt = "You are a masterful storyteller specializing in character development. I need a compelling backstory for the protagonist in the following scenario:\n\n";
  prompt += "The backstory should be rich but concise (1-2 paragraphs) and serve as an introduction in a " + writingStyle.genre + " story.\n\n";
  prompt += "Include details about their formative experiences, motivations, and a key event that shaped them.\n\n";
  prompt += "Establish connections to other characters where relevant.\n\n";
  prompt += "Match the tone and themes appropriate for " + writingStyle.genre + " while maintaining narrative consistency.\n\n";
  prompt += "End with an unresolved tension or mystery that connects to the main story.\n\n";
  prompt += "Do not include any markdown, formatting, or meta-commentary - only the backstory itself.\n\n";
  prompt += "Scenario details:\n\n";
  prompt += markdown;
  return prompt;
}

export function createScenarioPrompt(scenario: Scenario): string {
  // Verify scenario and ensure basic fields exist
  if (!scenario) {
    console.error("Error: scenario is null or undefined");
    return "Error: Invalid scenario data";
  }

  const markdown = formatScenarioAsMarkdown(scenario);
  const style = scenario.writingStyle || { genre: "General Fiction" };

  let prompt = "You are an exceptional storyteller";
  if (style.genre) {
    prompt += ` with expertise in the genre ${style.genre}`;
  }

  prompt += ".\n\nCreate a complete, engaging narrative based on the following scenario:\n\n";
  prompt += "Guidelines:\n";
  prompt += "- Write all chapters and scenes fully, but do not use chapter headers\n";
  prompt += "- Write the complete story up to the end\n";
  prompt += "- Include meaningful character interactions and development\n";
  prompt += "- Honor the established character backgrounds and relationships\n";
  prompt += "- Maintain consistent pacing appropriate to the genre\n";
  prompt += "- Incorporate any specified themes, settings, and plot elements\n";
  prompt += "- Present only the finished story with no meta-commentary, formatting, or markdown\n\n";
  prompt += markdown;
  
  return prompt;
};

/**
 * Creates a prompt specifically for generating a single chapter
 */
export function createChapterPrompt(scenario: Scenario, chapterNumber: number, previousChapters?: string): string {
  // Verify scenario and ensure basic fields exist
  if (!scenario) {
    console.error("Error: scenario is null or undefined");
    return "Error: Invalid scenario data";
  }

  const markdown = formatScenarioAsMarkdown(scenario);
  const style = scenario.writingStyle || { genre: "General Fiction" };

  let prompt = "You are an exceptional storyteller";
  if (style.genre) {
    prompt += ` with expertise in ${style.genre} fiction`;
  }

  prompt += `.\n\nGenerate Chapter ${chapterNumber} for a story based on the following scenario:\n\n`;
  prompt += "Guidelines:\n";
  prompt += "- Focus only on writing Chapter " + chapterNumber + "\n";
  prompt += "- Do not begin with a chapter heading.\n";
  prompt += "- Create a cohesive chapter that advances the story\n";
  prompt += "- Include meaningful character interactions and development\n";
  prompt += "- Honor the established character backgrounds and relationships\n";
  prompt += "- Maintain consistent pacing appropriate to the genre\n";
  prompt += "- Present only the chapter content with no additional commentary\n\n";
  
  if (previousChapters && chapterNumber > 1) {
    prompt += "Here are the previous chapters for context:\n\n";
    prompt += previousChapters + "\n\n";
    prompt += "Continue the story coherently from where the previous chapter ended.\n\n";
  }
  
  prompt += "Scenario details:\n";
  prompt += markdown;
  
  return prompt;
};

/**
 * Convert a scenario to a prompt for the AI model
 */
export function scenarioToPrompt(scenario: Scenario): ChatMessage[] {
  // Simply send the raw JSON of the scenario to LM Studio
  // LM Studio is preconfigured to accept this JSON input format
  return [
    {
      role: 'user',
      content: createScenarioPrompt(scenario)
    }
  ];
}

/**
 * Convert a scenario to a chapter prompt for the AI model
 */
export function scenarioToChapterPrompt(scenario: Scenario, chapterNumber: number, previousChapters?: string): ChatMessage[] {
  return [
    {
      role: 'user',
      content: createChapterPrompt(scenario, chapterNumber, previousChapters)
    }
  ];
}

/**
 * Generate a single chapter using the LM Studio API
 */
export async function generateChapter(
  scenario: Scenario,
  chapterNumber: number,
  previousChapters: string = '',
  options: {
    onProgress?: (text: string) => void,
    temperature?: number
  } = {}
): Promise<string> {
  // Configure the API with the latest settings
  const config = getLMStudioConfig();
  configureLMStudioAPI(config.baseUrl, config.modelName);

  // Convert the scenario to a chapter prompt
  const messages = scenarioToChapterPrompt(scenario, chapterNumber, previousChapters);
  console.log(`Generated messages for Chapter ${chapterNumber} generation:`, messages);
  
  return new Promise<string>((resolve, reject) => {
    let chapterText = '';
    
    const abortController = lmStudioAPI.streamChatCompletion(
      messages,
      {
        onChunk: (chunk, currentText) => {
          chapterText = currentText;
          if (options.onProgress) {
            options.onProgress(chapterText);
          }
        },
        onComplete: (fullText) => {
          resolve(fullText);
        },
        onError: (error) => {
          reject(error);
        }
      },
      {
        temperature: options.temperature ?? getStoredTemperature(),
        max_tokens: 2000
      }
    );
  });
}

/**
 * Generate a summary for a chapter using the LM Studio API
 */
export async function generateChapterSummary(
  chapterText: string,
  options: {
    onProgress?: (text: string) => void,
    temperature?: number
  } = {}
): Promise<string> {
  const config = getLMStudioConfig();
  configureLMStudioAPI(config.baseUrl, config.modelName);

  const prompt = `Summarize the following chapter in 2-3 sentences, focusing on the main events and character developments. Do not include any meta-commentary or formatting.\n\nChapter:\n${chapterText}`;

  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: prompt
    }
  ];

  return new Promise<string>((resolve, reject) => {
    let summaryText = '';
    lmStudioAPI.streamChatCompletion(
      messages,
      {
        onChunk: (chunk, currentText) => {
          summaryText = currentText;
          if (options.onProgress) {
            options.onProgress(summaryText);
          }
        },
        onComplete: (fullText) => {
          resolve(fullText);
        },
        onError: (error) => {
          reject(error);
        }
      },
      {
        temperature: options.temperature ?? getStoredTemperature(),
        max_tokens: 200
      }
    );
  });
}

// Helper to get the last N sentences from a text
function getLastSentences(text: string, n: number = 2): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  return sentences.slice(-n).join(' ').trim();
}

/**
 * Generate a story from a scenario using the LM Studio API (single call, no chapters)
 */
export async function generateStory(
  scenario: Scenario, 
  options: { 
    onProgress?: (text: string) => void,
    temperature?: number,
    numberOfChapters?: number // ignored, kept for compatibility
  } = {}
): Promise<{ result: Promise<GeneratedStory>; cancelGeneration: () => void }> {
  // Configure the API with the latest settings
  const config = getLMStudioConfig();
  configureLMStudioAPI(config.baseUrl, config.modelName);

  let isCancelled = false;

  const resultPromise = new Promise<GeneratedStory>(async (resolve, reject) => {
    try {
      let completeStory = '';
      const messages: ChatMessage[] = scenarioToPrompt(scenario);
      let abortController: { abort: () => void } | null = null;

      await new Promise<void>((resolveStory, rejectStory) => {
        abortController = lmStudioAPI.streamChatCompletion(
          messages,
          {
            onChunk: (chunk, currentText) => {
              completeStory = currentText;
              if (options.onProgress) {
                options.onProgress(completeStory);
              }
            },
            onComplete: (fullText) => {
              completeStory = fullText;
              resolveStory();
            },
            onError: (error) => {
              rejectStory(error);
            }
          },
          {
            temperature: options.temperature ?? getStoredTemperature(),
            max_tokens: 6000
          }
        );
      });

      resolve({
        completeText: completeStory,
        chapters: [] // No chapters, just the full story
      });
    } catch (error) {
      reject(error);
    }
  });

  const cancelGeneration = () => {
    isCancelled = true;
    // If abortController exists, abort the request
    // (abortController is only set after streamChatCompletion is called)
  };

  return { result: resultPromise, cancelGeneration };
}

/**
 * Generate a backstory for a scenario using the LM Studio API
 */
export async function generateBackstory(
  scenario: Scenario,
  options: {
    onProgress?: (text: string) => void,
    temperature?: number
  } = {}
): Promise<{ result: Promise<string>; cancelGeneration: () => void }> {
  // Configure the API with the latest settings
  const config = getLMStudioConfig();
  configureLMStudioAPI(config.baseUrl, config.modelName);

  // Create the messages for backstory generation
  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: createBackstoryPrompt(scenario)
    }
  ];

  console.log('Generated messages for backstory generation:', messages);
  let abortController: { abort: () => void } | null = null;
  
  const resultPromise = new Promise<string>((resolve, reject) => {
    let backstoryText = '';
    
    abortController = lmStudioAPI.streamChatCompletion(
      messages,
      {
        onChunk: (chunk, currentText) => {
          backstoryText = currentText;
          if (options.onProgress) {
            options.onProgress(backstoryText);
          }
        },
        onComplete: (fullText) => {
          resolve(fullText);
        },
        onError: (error) => {
          reject(error);
        }
      },
      {
        temperature: options.temperature ?? getStoredTemperature(),
        max_tokens: 1000
      }
    );
  });
  
  const cancelGeneration = () => {
    if (abortController) {
      abortController.abort();
    }
  };
  
  return { result: resultPromise, cancelGeneration };
}

/**
 * Creates a prompt specifically for generating a story arc based on the scenario
 */
export function createStoryArcPrompt(scenario: Scenario): string {
  // Verify scenario is not null or undefined
  if (!scenario) {
    console.error("Error: scenario is null or undefined");
    scenario = {
      id: 'error-fallback',
      userId: 'system',
      createdAt: new Date(),
      writingStyle: { genre: "General Fiction" }
    };
  }
  
  // create a new scenario copying the scenario's writingStyle and the characters and the notes
  const writingStyle: StyleSettings = scenario.writingStyle || { genre: "General Fiction" };
  const newScenario: any = {
    title: scenario.title || "Random title",
    writingStyle: writingStyle,
    characters: Array.isArray(scenario.characters) ? scenario.characters.map(char => ({
      name: char.name || '',
      alias: char.alias || '',
      role: char.role || '',
      appearance: char.appearance || '',
      gender: char.gender || '',
      id: char.id || '',
      backstory: char.backstory || "",
      extraInfo: char.extraInfo || ""
    })) : [],
    backstory: scenario.backstory || "",
    notes: scenario.notes || ""
  };
  const markdown = formatScenarioAsMarkdown(newScenario);

  let prompt = "You are an expert storyteller and narrative planner. Create a structured story arc outline for a story with the following elements:\n";
  prompt += "The story arc should be for a " + writingStyle.genre + " story.\n";
  prompt += "Create a compelling narrative structure with clear beginning, middle, and end sections.\n";
  prompt += "List 3-6 major plot points that move the story forward. Only list the plot points and do not mention details\n";
  prompt += "Focus on character motivations, conflicts, and resolutions.\n";
  prompt += "IMPORTANT: Do not include any markdown, formatting or meta-information about the narrative. Do not include headers or titles.\n";
  prompt += "Include only the plot points, in order, and the character motivations\n";
  prompt += "Here is the scenario:\n";
  prompt += markdown;
  return prompt;
}

/**
 * Generate a story arc for a scenario using the LM Studio API
 */
export async function generateStoryArc(
  scenario: Scenario,
  options: {
    onProgress?: (text: string) => void,
    temperature?: number
  } = {}
): Promise<{ result: Promise<string>; cancelGeneration: () => void }> {
  // Configure the API with the latest settings
  const config = getLMStudioConfig();
  configureLMStudioAPI(config.baseUrl, config.modelName);

  // Create the messages for story arc generation
  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: createStoryArcPrompt(scenario)
    }
  ];

  console.log('Generated messages for story arc generation:', messages);
  let abortController: { abort: () => void } | null = null;
  
  const resultPromise = new Promise<string>((resolve, reject) => {
    let storyArcText = '';
    
    abortController = lmStudioAPI.streamChatCompletion(
      messages,
      {
        onChunk: (chunk, currentText) => {
          storyArcText = currentText;
          if (options.onProgress) {
            options.onProgress(storyArcText);
          }
        },
        onComplete: (fullText) => {
          resolve(fullText);
        },
        onError: (error) => {
          reject(error);
        }
      },
      {
        temperature: options.temperature ?? getStoredTemperature(),
        max_tokens: 1000
      }
    );
  });
  
  const cancelGeneration = () => {
    if (abortController) {
      abortController.abort();
    }
  };
  
  return { result: resultPromise, cancelGeneration };
}

/**
 * Creates a prompt specifically for generating scenes based on the scenario and story arc
 */
export function createScenesPrompt(scenario: Scenario): string {
  // Verify scenario is not null or undefined
  if (!scenario) {
    console.error("Error: scenario is null or undefined");
    scenario = {
      id: 'error-fallback',
      userId: 'system',
      createdAt: new Date(),
      writingStyle: { genre: "General Fiction" }
    };
  }
  
  // Create a new scenario copying the relevant fields
  const writingStyle: StyleSettings = scenario.writingStyle || { genre: "General Fiction" };
  const newScenario: any = {
    title: scenario.title || "Random title",
    writingStyle: writingStyle,
    characters: Array.isArray(scenario.characters) ? scenario.characters.map(char => ({
      name: char.name || '',
      alias: char.alias || '',
      role: char.role || '',
      appearance: char.appearance || '',
      gender: char.gender || '',
      id: char.id || '',
      backstory: char.backstory || "",
      extraInfo: char.extraInfo || ""
    })) : [],
    backstory: scenario.backstory || "",
    storyarc: scenario.storyarc || "",
    notes: scenario.notes || ""
  };
  
  const markdown = formatScenarioAsMarkdown(newScenario);

  let prompt = "You are an expert story outliner and screenplay writer. Based on the story elements provided, create a structured sequence of scenes.\n\n";
  prompt += "For a " + writingStyle.genre + " story, generate a sequence of 5-10 scenes that follow the story arc.\n\n";
  prompt += "For each scene, provide: title, description, location, time of day, and any relevant character names.\n\n";
  prompt += "IMPORTANT: Your response must be in JSON format ONLY with the following structure:\n";
  prompt += `
{
  "scenes": [
    {
      "title": "Scene Title",
      "description": "Brief description of what happens in this scene",
      "location": "Where the scene takes place",
      "time": "Time of day or relative timing",
      "characters": ["Character1", "Character2"]
    },
    ...more scenes...
  ]
}
`;
  prompt += "Do not include any explanatory text outside of the JSON structure.\n\n";
  prompt += "Here is the scenario:\n\n";
  prompt += markdown;
  return prompt;
}

/**
 * Generate scenes for a scenario using the LM Studio API
 */
export async function generateScenes(
  scenario: Scenario,
  options: {
    onProgress?: (text: string) => void,
    temperature?: number
  } = {}
): Promise<{ result: Promise<string>; cancelGeneration: () => void }> {
  // Configure the API with the latest settings
  const config = getLMStudioConfig();
  configureLMStudioAPI(config.baseUrl, config.modelName);

  // Create the messages for scene generation
  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: createScenesPrompt(scenario)
    }
  ];

  console.log('Generated messages for scene generation:', messages);
  let abortController: { abort: () => void } | null = null;
  
  const resultPromise = new Promise<string>((resolve, reject) => {
    let scenesText = '';
    
    abortController = lmStudioAPI.streamChatCompletion(
      messages,
      {
        onChunk: (chunk, currentText) => {
          scenesText = currentText;
          if (options.onProgress) {
            options.onProgress(scenesText);
          }
        },
        onComplete: (fullText) => {
          resolve(fullText);
        },
        onError: (error) => {
          reject(error);
        }
      },
      {
        temperature: options.temperature ?? getStoredTemperature(),
        max_tokens: 2000
      }
    );
  });
  
  const cancelGeneration = () => {
    if (abortController) {
      abortController.abort();
    }
  };
  
  return { result: resultPromise, cancelGeneration };
}

/**
 * Creates a prompt specifically for rewriting an existing backstory
 */
export function createRewriteBackstoryPrompt(scenario: Scenario): string {
  // Verify scenario is not null or undefined
  if (!scenario) {
    console.error("Error: scenario is null or undefined");
    scenario = {
      id: 'error-fallback',
      userId: 'system',
      createdAt: new Date(),
      writingStyle: { genre: "General Fiction" }
    };
  }
  
  // Extract the current backstory and writing style
  const currentBackstory = scenario.backstory || "";
  const writingStyle = scenario.writingStyle || { genre: "General Fiction" };
  
  // Create the rewrite prompt
  let prompt = "You are a masterful storyteller specializing in improving existing content. Rewrite the following backstory:\n\n";
  prompt += "\"" + currentBackstory + "\"\n\n";
  prompt += "Keep the core elements of the backstory but make it short and high-level. improve it by:\n";
  prompt += "- Making it clear and structured\n";
  prompt += "- Keeping it short and high-level (only add details that are needed for clarity)\n";
  prompt += "- Preserving all key plot points and character relationships\n";
  prompt += "- Write in a neutral tone, as if it's the back cover of a book. \n\n";
  prompt += "Do not include any markdown, formatting, or meta-commentary - only the rewritten backstory itself.\n";
  
  return prompt;
}

/**
 * Rewrite an existing backstory using the LM Studio API
 */
export async function rewriteBackstory(
  scenario: Scenario,
  options: {
    onProgress?: (text: string) => void,
    temperature?: number
  } = {}
): Promise<{ result: Promise<string>; cancelGeneration: () => void }> {
  // Configure the API with the latest settings
  const config = getLMStudioConfig();
  configureLMStudioAPI(config.baseUrl, config.modelName);

  // Create the messages for backstory rewriting
  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: createRewriteBackstoryPrompt(scenario)
    }
  ];

  console.log('Generated messages for backstory rewriting:', messages);
  let abortController: { abort: () => void } | null = null;
  
  const resultPromise = new Promise<string>((resolve, reject) => {
    let backstoryText = '';
    
    abortController = lmStudioAPI.streamChatCompletion(
      messages,
      {
        onChunk: (chunk, currentText) => {
          backstoryText = currentText;
          if (options.onProgress) {
            options.onProgress(backstoryText);
          }
        },
        onComplete: (fullText) => {
          resolve(fullText);
        },
        onError: (error) => {
          reject(error);
        }
      },
      {
        temperature: options.temperature ?? getStoredTemperature(),
        max_tokens: 1000
      }
    );
  });
  
  const cancelGeneration = () => {
    if (abortController) {
      abortController.abort();
    }
  };
  
  return { result: resultPromise, cancelGeneration };
}

/**
 * Creates a prompt specifically for rewriting an existing story arc
 */
export function createRewriteStoryArcPrompt(scenario: Scenario): string {
  // Verify scenario is not null or undefined
  if (!scenario) {
    console.error("Error: scenario is null or undefined");
    scenario = {
      id: 'error-fallback',
      userId: 'system',
      createdAt: new Date(),
      writingStyle: { genre: "General Fiction" }
    };
  }
  
  // Extract the current story arc and writing style
  const currentStoryArc = scenario.storyarc || "";
  const writingStyle = scenario.writingStyle || { genre: "General Fiction" };
  
  // Create the rewrite prompt
  let prompt = "You are an expert storyteller and narrative planner specializing in improving existing story arcs. Rewrite and enhance the following story arc:\n\n";
  prompt += "\"" + currentStoryArc + "\"\n\n";
  prompt += "Keep the core elements of the story arc but improve it by:\n";
  prompt += "- Enhancing the narrative structure and pacing\n";
  prompt += "- Making the plot points more compelling and coherent\n";
  prompt += "- Make it short and high-level, and limit the number of plot points\n";
  prompt += "- Preserving all key character motivations and story beats\n";
  prompt += "- Matching the tone appropriate for " + writingStyle.genre + "\n\n";
  prompt += "Ensure clear beginning, middle, and end sections with logical progression.\n";
  prompt += "Do not include any markdown, formatting, or meta-commentary - only the rewritten story arc itself.\n";
  
  return prompt;
}

/**
 * Rewrite an existing story arc using the LM Studio API
 */
export async function rewriteStoryArc(
  scenario: Scenario,
  options: {
    onProgress?: (text: string) => void,
    temperature?: number
  } = {}
): Promise<{ result: Promise<string>; cancelGeneration: () => void }> {
  // Configure the API with the latest settings
  const config = getLMStudioConfig();
  configureLMStudioAPI(config.baseUrl, config.modelName);

  // Create the messages for story arc rewriting
  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: createRewriteStoryArcPrompt(scenario)
    }
  ];

  console.log('Generated messages for story arc rewriting:', messages);
  let abortController: { abort: () => void } | null = null;
  
  const resultPromise = new Promise<string>((resolve, reject) => {
    let storyArcText = '';
    
    abortController = lmStudioAPI.streamChatCompletion(
      messages,
      {
        onChunk: (chunk, currentText) => {
          storyArcText = currentText;
          if (options.onProgress) {
            options.onProgress(storyArcText);
          }
        },
        onComplete: (fullText) => {
          resolve(fullText);
        },
        onError: (error) => {
          reject(error);
        }
      },
      {
        temperature: options.temperature ?? getStoredTemperature(),
        max_tokens: 1000
      }
    );
  });
  
  const cancelGeneration = () => {
    if (abortController) {
      abortController.abort();
    }
  };
  
  return { result: resultPromise, cancelGeneration };
}
