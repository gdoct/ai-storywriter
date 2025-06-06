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
 * Generate a random seed for consistent generation but varied results
 * @returns A random integer seed
 */
function generateRandomSeed(): number {
  return Math.floor(Math.random() * 1000000);
}

/**
 * Creates a prompt specifically for generating a random writing style
 */
export function createWritingStylePrompt(): string {
  let prompt = "You are an expert in literary styles and genres. Create a random writing style configuration for a story.\n\n";
  prompt += "Provide a JSON object with the following fields:\n";
  prompt += "- style: a literary style (e.g., 'Modern')\n";
  prompt += "- genre: a specific writing genre \n";
  prompt += "- tone: the emotional tone of the writing in one word\n";
  prompt += "- language: the type of language used (e.g., 'Elaborate')\n";
  prompt += "- theme: a central theme of the story\n";
  prompt += "- other: additional specific instructions for the writing style\n\n";
  prompt += "Format your response as a valid JSON object WITHOUT any explanation or additional text.\n\n";
  prompt += "IMPORTANT: Your response must be in JSON format ONLY with the following structure:\n";
  prompt += "{\n";
  prompt += '  "style": "(style)",\n';
  prompt += '  "genre": "(genre)",\n';
  prompt += '  "tone": "(tone)",\n';
  prompt += '  "language": "(language)",\n';
  prompt += '  "theme": "(theme)",\n';
  prompt += '  "other": "(other)"\n';
  prompt += "}";
  
  return prompt;
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
    temperature?: number,
    seed?: number | null
  } = {}
): Promise<string> {
  // Configure the API with the latest settings
  const config = getLMStudioConfig();
  configureLMStudioAPI(config.baseUrl, config.modelName, config.seed);

  // Convert the scenario to a chapter prompt
  const messages = scenarioToChapterPrompt(scenario, chapterNumber, previousChapters);
  console.log(`Generated messages for Chapter ${chapterNumber} generation:`, messages);
  
  return new Promise<string>((resolve, reject) => {
    let chapterText = '';
    
    lmStudioAPI.streamChatCompletion(
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
        max_tokens: 2000,
        seed: options.seed
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
  configureLMStudioAPI(config.baseUrl, config.modelName, config.seed);

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

/**
 * Generate a story from a scenario using the LM Studio API (single call, no chapters)
 */
export async function generateStory(
  scenario: Scenario, 
  options: { 
    onProgress?: (text: string) => void,
    temperature?: number,
    numberOfChapters?: number, // ignored, kept for compatibility
    seed?: number | null
  } = {}
): Promise<{ result: Promise<GeneratedStory>; cancelGeneration: () => void }> {
  // Configure the API with the latest settings
  const config = getLMStudioConfig();
  configureLMStudioAPI(config.baseUrl, config.modelName, config.seed);

  const resultPromise = new Promise<GeneratedStory>(async (resolve, reject) => {
    try {
      let completeStory = '';
      const messages: ChatMessage[] = scenarioToPrompt(scenario);

      await new Promise<void>((resolveStory, rejectStory) => {
        lmStudioAPI.streamChatCompletion(
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
            max_tokens: 6000,
            seed: options.seed
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
    temperature?: number,
    seed?: number | null
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
        max_tokens: 1000,
        seed: options.seed
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
    temperature?: number,
    seed?: number | null
  } = {}
): Promise<{ result: Promise<string>; cancelGeneration: () => void }> {
  // Configure the API with the latest settings
  const config = getLMStudioConfig();
  configureLMStudioAPI(config.baseUrl, config.modelName, config.seed);

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
        max_tokens: 1000,
        seed: options.seed
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
    temperature?: number,
    seed?: number | null
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
        max_tokens: 2000,
        seed: options.seed
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
  let prompt = "You are a masterful storyteller specializing in improving existing content in the genre " + writingStyle.genre + ". Rewrite the following backstory:\n\n";
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
    temperature?: number,
    seed?: number | null
  } = {}
): Promise<{ result: Promise<string>; cancelGeneration: () => void }> {
  // Configure the API with the latest settings
  const config = getLMStudioConfig();
  configureLMStudioAPI(config.baseUrl, config.modelName, config.seed);

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
        max_tokens: 1000,
        seed: options.seed
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
    temperature?: number,
    seed?: number | null
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
        max_tokens: 1000,
        seed: options.seed
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
 * Generate a random writing style using the LM Studio API
 */
export async function generateRandomWritingStyle(
  options: {
    onProgress?: (text: string) => void,
    temperature?: number,
    seed?: number | null
  } = {}
): Promise<{ result: Promise<any>; cancelGeneration: () => void }> {
  // Configure the API with the latest settings
  const config = getLMStudioConfig();
  configureLMStudioAPI(config.baseUrl, config.modelName, options.seed);

  // Create the messages for writing style generation
  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: createWritingStylePrompt()
    }
  ];

  console.log('Generated messages for writing style generation:', messages);
  let abortController: { abort: () => void } | null = null;
  
  const resultPromise = new Promise<any>((resolve, reject) => {
    let jsonText = '';
    
    abortController = lmStudioAPI.streamChatCompletion(
      messages,
      {
        onChunk: (chunk, currentText) => {
          jsonText = currentText;
          if (options.onProgress) {
            try {
              // Try to parse the current text as JSON if possible
              // This might fail during streaming if the JSON is incomplete
              const parsedJson = JSON.parse(jsonText);
              options.onProgress(JSON.stringify(parsedJson, null, 2));
            } catch (e) {
              // If parsing fails, just return the raw text
              options.onProgress(jsonText);
            }
          }
        },
        onComplete: (fullText) => {
          try {
            // Remove Markdown code block markers if present
            let cleanedText = fullText.trim();
            if (cleanedText.startsWith('```json')) {
              cleanedText = cleanedText.replace(/^```json/, '').trim();
            }
            if (cleanedText.startsWith('```')) {
              cleanedText = cleanedText.replace(/^```/, '').trim();
            }
            if (cleanedText.endsWith('```')) {
              cleanedText = cleanedText.replace(/```$/, '').trim();
            }
            // Try to parse the cleaned response as JSON
            const parsedJson = JSON.parse(cleanedText);
            resolve(parsedJson);
          } catch (error) {
            console.error('Failed to parse writing style JSON:', error, fullText);
            reject(error);
          }
        },
        onError: (error) => {
          reject(error);
        }
      },
      {
        temperature: options.temperature ?? getStoredTemperature(),
        max_tokens: 500,
        seed: options.seed
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
 * Creates a prompt specifically for generating a character
 * @param scenario The current scenario for context
 * @param characterType The type of character to generate: "protagonist", "antagonist", or "supporting"
 */
export function createCharacterPrompt(scenario: Scenario, characterType: string): string {
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

  // Get writing style and other details from scenario
  const writingStyle = scenario.writingStyle || { genre: "General Fiction" };
  const genre = writingStyle.genre || "General Fiction";
  const existingCharacters = Array.isArray(scenario.characters) ? scenario.characters : [];
  
  // Create a prompt based on character type
  let prompt = `You are an expert character creator for ${genre} stories. Create a ${characterType} character with depth and interesting traits.\n\n`;
  
  if (characterType === "protagonist") {
    prompt += "Create a compelling protagonist who will engage readers and drive the story forward.\n";
    prompt += "The character should have clear motivations, flaws, strengths, and a strong narrative voice.\n";
  } else if (characterType === "antagonist") {
    prompt += "Create a nuanced antagonist who provides meaningful opposition to the protagonist.\n";
    prompt += "The character should have understandable motivations, complexity, and not be purely evil without reason.\n";
  } else if (characterType === "supporting") {
    prompt += "Create a memorable supporting character who adds depth to the story world.\n";
    prompt += "The character should have their own goals and personality while complementing the main characters.\n";
  }

  // Add context from existing characters, if any
  if (existingCharacters.length > 0) {
    prompt += "\nConsider these existing characters in the story:\n";
    existingCharacters.forEach((char, index) => {
      prompt += `Character ${index + 1}: ${char.name || char.alias || 'Unnamed'} - ${char.role || 'No specified role'}\n`;
    });
    prompt += "\nCreate a character that would interact well with these existing characters.\n";
  }

  // Request specific details
  prompt += "\nProvide the following information in JSON format:\n";
  prompt += "- name: A fitting name for this character\n";
  prompt += "- alias: An optional nickname or alias (can be empty string)\n";
  prompt += "- gender: The character's gender\n";
  prompt += "- role: Their specific role ('Protagonist', 'Antagonist', or 'Supporting')\n";
  prompt += "- appearance: A concise description of their physical appearance\n";
  prompt += "- backstory: A brief but compelling backstory for the character\n";
  prompt += "- extraInfo: Any additional traits, skills, or information\n\n";
  
  prompt += "Format your response as a valid JSON object WITHOUT any explanation or additional text.\n\n";
  prompt += "Ensure the JSON is well-formed and includes all required fields.\n";
  prompt += "Make sure that quotes inside the JSON string are properly escaped:\n";
  prompt += "IMPORTANT: Your response must be in JSON format ONLY with the following structure:\n";
  prompt += "{\n";
  prompt += '  "name": "(name)",\n';
  prompt += '  "alias": "(alias)",\n';
  prompt += '  "gender": "(gender)",\n';
  prompt += '  "role": "(role)",\n';
  prompt += '  "appearance": "(appearance)",\n';
  prompt += '  "backstory": "(backstory)",\n';
  prompt += '  "extraInfo": "(extraInfo)"\n';
  prompt += "}";
  
  return prompt;
}

/**
 * Generate a random character using the LM Studio API
 */
export async function generateRandomCharacter(
  scenario: Scenario,
  characterType: string,
  options: {
    onProgress?: (text: string) => void,
    temperature?: number,
    seed?: number | null
  } = {}
): Promise<{ result: Promise<any>; cancelGeneration: () => void }> {
  // Configure the API with the latest settings
  const config = getLMStudioConfig();
  configureLMStudioAPI(config.baseUrl, config.modelName, options.seed);

  // Create the messages for character generation
  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: createCharacterPrompt(scenario, characterType)
    }
  ];

  console.log('Generated messages for character generation:', messages);
  let abortController: { abort: () => void } | null = null;
  
  const resultPromise = new Promise<any>((resolve, reject) => {
    let jsonText = '';
    
    abortController = lmStudioAPI.streamChatCompletion(
      messages,
      {
        onChunk: (chunk, currentText) => {
          jsonText = currentText;
          if (options.onProgress) {
            try {
              // Try to parse the current text as JSON if possible
              // This might fail during streaming if the JSON is incomplete
              const parsedJson = JSON.parse(jsonText);
              options.onProgress(JSON.stringify(parsedJson, null, 2));
            } catch (e) {
              // If parsing fails, just return the raw text
              options.onProgress(jsonText);
            }
          }
        },
        onComplete: (fullText) => {
            // Remove Markdown code block markers if present
          let cleanedText = fullText.trim();
          try {
            
            if (cleanedText.startsWith('```json')) {
              cleanedText = cleanedText.replace(/^```json/, '').trim();
            }
            if (cleanedText.startsWith('```')) {
              cleanedText = cleanedText.replace(/^```/, '').trim();
            }
            if (cleanedText.endsWith('```')) {
              cleanedText = cleanedText.replace(/```$/, '').trim();
            }
            // Clean up common JSON issues: replace smart quotes, remove bad control characters
            cleanedText = cleanedText
              .replace(/[\u201c\u201d\u201e\u201f\u2033\u2036]/g, '"') // smart double quotes
              .replace(/[\u2018\u2019\u201a\u201b\u2032\u2035]/g, "'") // smart single quotes
              .split('').map(c => {
                const code = c.charCodeAt(0);
                if ((code >= 0 && code <= 31 && c !== '\n' && c !== '\r' && c !== '\t') || code === 127) {
                  return ' ';
                }
                return c;
              }).join('');
            // Log the cleaned text for debugging
            console.log('Attempting to parse character JSON:', cleanedText);
            
            // Try to parse the cleaned response as JSON
            const parsedJson = JSON.parse(cleanedText);
            console.log('Successfully parsed character JSON:', parsedJson);
            resolve(parsedJson);
          } catch (error) {
            console.error('Failed to parse character JSON:', error);
            console.error('Raw JSON text that failed to parse:', fullText);
            console.error('Cleaned JSON text that failed to parse:', cleanedText);
            reject(error);
          }
        },
        onError: (error) => {
          console.error('LM Studio API error during character generation:', error);
          reject(error);
        }
      },
      {
        temperature: options.temperature ?? getStoredTemperature(),
        max_tokens: 800,
        seed: options.seed
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
 * Creates a prompt specifically for generating a random scenario name
 */
export function createScenarioNamePrompt(options?: {theme?: string, genre?: string}): string {
  const theme = options?.theme || '';
  const genre = options?.genre || '';
  
  let prompt = "You are an expert storyteller. Create a compelling and creative title for a new story.\n\n";
  
  if (genre) {
    prompt += `The story will be in the ${genre} genre.\n\n`;
  }
  
  if (theme) {
    prompt += `The story will explore the theme of ${theme}.\n\n`;
  }
  
  prompt += "Give me only the title, without quotes, explanation, or any additional text.\n";
  prompt += "The title should be between 2-6 words, and be intriguing and memorable.\n";
  
  return prompt;
}

/**
 * Generate a random scenario title
 */
export async function generateRandomScenarioName(
  options?: {
    theme?: string,
    genre?: string,
    onProgress?: (text: string) => void,
    temperature?: number,
    seed?: number | null
  }
): Promise<{ result: Promise<string>; cancelGeneration: () => void }> {
  // Configure the API with the latest settings
  const config = getLMStudioConfig();
  // Ensure we have a seed - either use the provided one or generate a new one
  const effectiveSeed = options?.seed !== undefined ? options.seed : generateRandomSeed();
  configureLMStudioAPI(config.baseUrl, config.modelName, effectiveSeed);

  // Create the messages for title generation
  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: createScenarioNamePrompt(options)
    }
  ];

  console.log('Generated messages for scenario name generation');
  let abortController: { abort: () => void } | null = null;
  
  const resultPromise = new Promise<string>((resolve, reject) => {
    let titleText = '';
    
    abortController = lmStudioAPI.streamChatCompletion(
      messages,
      {
        onChunk: (chunk, currentText) => {
          titleText = currentText.trim();
          if (options?.onProgress) {
            options.onProgress(titleText);
          }
        },
        onComplete: (fullText) => {
          resolve(fullText.trim());
        },
        onError: (error) => {
          reject(error);
        }
      },
      {
        temperature: options?.temperature ?? getStoredTemperature(),
        max_tokens: 100,
        seed: options?.seed
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
 * Randomize and overwrite the characters in the current scenario.
 * Replaces scenario.characters with a new array of random characters.
 * @param scenario The scenario object to update
 * @param count Number of characters to generate (default: 3)
 * @param options Optional: onProgress, temperature
 */
export async function randomizeScenarioCharacters(
  scenario: Scenario,
  count: number = 3,
  options: {
    onProgress?: (text: string) => void,
    temperature?: number,
    seed?: number | null
  } = {}
): Promise<{ result: Promise<any[]>; cancelGeneration: () => void }> {
  let cancelled = false;
  const characterTypes = ["protagonist", "antagonist", "supporting"];
  while (characterTypes.length < count) characterTypes.push("supporting");

  // Prepare all character generation promises
  const charPromises: Array<Promise<any>> = [];
  const cancelFns: Array<() => void> = [];

  for (let i = 0; i < count; i++) {
    // Create a new options object with a unique seed for each character
    // If seed is provided, create variation by adding the index
    // If no seed is provided, generate a random one for each character
    const characterOptions = {
      ...options,
      seed: options.seed !== undefined ? 
        (options.seed === null ? generateRandomSeed() + i : options.seed + i) : 
        generateRandomSeed() + i
    };
    
    const genPromise = generateRandomCharacter(scenario, characterTypes[i], characterOptions);
    charPromises.push(
      genPromise.then(({ result, cancelGeneration }) => {
        cancelFns.push(cancelGeneration);
        return result;
      })
    );
  }

  const resultPromise = Promise.all(charPromises).then(async (results) => {
    // Each result is a Promise<any> (the .result from generateRandomCharacter)
    const characters = await Promise.all(results);
    if (!cancelled) {
      scenario.characters = characters;
    }
    return characters;
  });

  const cancelGeneration = () => {
    cancelled = true;
    cancelFns.forEach((fn) => fn());
  };

  return { result: resultPromise, cancelGeneration };
}

/**
 * Randomize and overwrite the writing style in the current scenario.
 * Replaces scenario.writingStyle with a new random writing style.
 * @param scenario The scenario object to update
 * @param options Optional: onProgress, temperature, seed
 */
export async function randomizeScenarioWritingStyle(
  scenario: Scenario,
  options: {
    onProgress?: (text: string) => void,
    temperature?: number,
    seed?: number | null
  } = {}
): Promise<{ result: Promise<any>; cancelGeneration: () => void }> {
  // If no seed is provided, generate a random one to ensure uniqueness
  const effectiveOptions = {
    ...options,
    seed: options.seed !== undefined ? options.seed : generateRandomSeed()
  };
  
  const { result, cancelGeneration } = await generateRandomWritingStyle(effectiveOptions);
  const wrappedResult = result.then((writingStyle) => {
    scenario.writingStyle = writingStyle;
    return writingStyle;
  });
  return { result: wrappedResult, cancelGeneration };
}
