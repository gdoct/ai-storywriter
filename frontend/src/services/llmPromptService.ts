// All prompt generation logic for LLM scenario/storywriting
import { llmCompletionRequestMessage } from '../types/LLMTypes';
import { Character, Scenario, StyleSettings } from '../types/ScenarioTypes';
import { formatScenarioAsMarkdown, formatScenarioAsMarkdownWithoutBackStory, formatScenarioAsMarkdownWithoutStoryArc } from '../utils/scenarioToMarkdown';

export function createWritingStylePrompt(): llmCompletionRequestMessage {
  return {
    systemMessage: 'You are an expert in literary styles and genres.',
    userMessage: `Create a random writing style configuration for a story.\n\nProvide a JSON object with the following fields:\n- style: a literary style (e.g., 'Modern')\n- genre: a specific writing genre \n- tone: the emotional tone of the writing in one word\n- language: the type of language used (e.g., 'Elaborate')\n- theme: a central theme of the story\n- other: additional specific instructions for the writing style\n\nFormat your response as a valid JSON object WITHOUT any explanation or additional text.\n\nIMPORTANT: Your response must be in JSON format ONLY with the following structure:\n{\n  "style": "(style)",\n  "genre": "(genre)",\n  "tone": "(tone)",\n  "language": "(language)",\n  "theme": "(theme)",\n  "other": "(other)"\n}`
  };
}

export function createBackstoryPrompt(scenario: Scenario): llmCompletionRequestMessage {
    if (!scenario) {
    console.error("Error: scenario is null or undefined");
    scenario = {
      id: 'error-fallback',
      userId: 'system',
      createdAt: new Date(),
      writingStyle: { genre: "General Fiction" }
    };
  }
  const writingStyle = scenario.writingStyle || { genre: "General Fiction" };
  
  // Build a more targeted prompt based on writing style
  let genreContext = writingStyle.genre || "General Fiction";
  let styleContext = "";
  if (writingStyle.tone) styleContext += ` with a ${writingStyle.tone.toLowerCase()} tone`;
  if (writingStyle.theme) styleContext += ` focusing on themes of ${writingStyle.theme.toLowerCase()}`;
  
  let prompt = `Create a compelling backstory for this ${genreContext} scenario${styleContext}.\n\n`;
  
  // Add scenario context
  prompt += "SCENARIO DETAILS:\n";
  prompt += formatScenarioAsMarkdownWithoutBackStory(scenario) + "\n\n";
  
  // Clear, specific requirements
  prompt += "REQUIREMENTS:\n";
  prompt += "• Write 2-3 concise paragraphs that establish the story's foundation\n";
  prompt += "• Focus on the key events, conflicts, or circumstances that set up the main story\n";
  prompt += "• Preserve all essential character relationships and motivations\n";
  prompt += "• Write in a neutral, engaging tone suitable for a book synopsis\n";
  prompt += "• Include only the most important background details needed for story context\n\n";
  
  prompt += "OUTPUT: Provide only the backstory text - no formatting, headers, or commentary.\n";
  return {
    systemMessage: `You are an expert storyteller specializing in ${genreContext} fiction. Create compelling backstories that establish story foundations without overwhelming detail.`,
    userMessage: prompt
  };
}


export function createRewriteBackstoryPrompt(scenario: Scenario): llmCompletionRequestMessage {
  if (!scenario) {
    console.error("Error: scenario is null or undefined");
    scenario = {
      id: 'error-fallback',
      userId: 'system',
      createdAt: new Date(),
      writingStyle: { genre: "General Fiction" }
    };
  }
  const currentBackstory = scenario.backstory || "";
  const writingStyle = scenario.writingStyle || { genre: "General Fiction" };
  let prompt = "You are a masterful storyteller specializing in providing summarized content for the genre " + writingStyle.genre + ". Rewrite the following backstory:\n\n";
  prompt += "\"" + currentBackstory + "\"\n\n";
  prompt += "Keep the core elements of the backstory but make it short and high-level. improve it by:\n";
  prompt += "- Making it clear and structured\n";
  prompt += "- Keeping it short and high-level (only add details that are needed for clarity)\n";
  prompt += "- Preserving all key plot points and character relationships\n";
  prompt += "- Write in a neutral tone, only a few paragraphs, as if it's the back cover of a book. \n\n";
  prompt += "Do not include any markdown, formatting, or meta-commentary - only the rewritten backstory itself.\n";
  return {
    systemMessage: 'You are a masterful storyteller specializing in improving existing content.',
    userMessage: prompt
  };
}

export function createScenarioPrompt(scenario: Scenario): llmCompletionRequestMessage {
  if (!scenario) {
    console.error("Error: scenario is null or undefined");
    return {
      systemMessage: 'Invalid scenario data',
      userMessage: ''
    };
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
  prompt += "- Present only the finished story with no meta-commentary, or markdown. Divide the story in paragraphs.\n\n";
  prompt += markdown;
  return {
    systemMessage: 'You are an exceptional storyteller.',
    userMessage: prompt
  };
}

export function createContinueStoryPrompt(scenario: Scenario, summaryOfPreviousChapters: string): llmCompletionRequestMessage {

  if (!scenario) {
    console.error("Error: scenario is null or undefined");
    return {
      systemMessage: 'Invalid scenario data',
      userMessage: ''
    };
  }
  const markdown = formatScenarioAsMarkdownWithoutBackStory(scenario);
  const style = scenario.writingStyle || { genre: "General Fiction" };
  let prompt = "You are an exceptional storyteller";
  if (style.genre) {
    prompt += ` with expertise in ${style.genre} fiction`;
  }
  prompt += ".\n\nContinue the story based on the following scenario and previous chapters:\n\n";
  prompt += "Guidelines:\n";
  prompt += "- Focus on continuing the narrative from where it left off.\n";
  prompt += "- Do not begin with a chapter heading.\n";
  prompt += "- Create a cohesive continuation that advances the story.\n";
  prompt += "- Include meaningful character interactions and development.\n";
  prompt += "- Honor the established character backgrounds and relationships.\n";
  prompt += "- Maintain consistent pacing appropriate to the genre.\n";
  prompt += "- Continue the story coherently from where the previous chapter ended.\n\n";
  prompt += "- Ensure that the continuation seamlessly integrates with the established narrative and character arcs.\n\n";
  prompt += "- Do not include any markdown, formatting, or meta-commentary - only the continuation of the story.\n";
  prompt += "- Make sure to maintain the established tone and style throughout the continuation.\n";
  prompt += "- If there are any unresolved plot points, address them in the continuation.\n";
  prompt += "- Ensure that the continuation is engaging and keeps the reader invested in the story.\n";
  
  prompt += "\nScenario details:\n";
  prompt += markdown;

  prompt += "Here is the summary of previous written chapters:\n\n";
  prompt += summaryOfPreviousChapters + "\n\n";
  return {
    systemMessage: 'You are an exceptional storyteller.',
    userMessage: prompt
  };
}

export function createChapterPrompt(scenario: Scenario, chapterNumber: number, previousChapters?: string): llmCompletionRequestMessage {
  if (!scenario) {
    console.error("Error: scenario is null or undefined");
    return {
      systemMessage: 'Invalid scenario data',
      userMessage: ''
    };
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
  return {
    systemMessage: 'You are an exceptional storyteller.',
    userMessage: prompt
  };
}

export function createStoryArcPrompt(scenario: Scenario): llmCompletionRequestMessage {
  if (!scenario) {
    console.error("Error: scenario is null or undefined");
    scenario = {
      id: 'error-fallback',
      userId: 'system',
      createdAt: new Date(),
      writingStyle: { genre: "General Fiction" }
    };
  }
  const writingStyle: StyleSettings = scenario.writingStyle || { genre: "General Fiction" };
  
  // Build context-aware prompt based on writing style
  let genreContext = writingStyle.genre || "General Fiction";
  let styleContext = "";
  if (writingStyle.tone) styleContext += ` with a ${writingStyle.tone.toLowerCase()} tone`;
  if (writingStyle.theme) styleContext += ` exploring themes of ${writingStyle.theme.toLowerCase()}`;
  
  let prompt = `Create a comprehensive story arc for this ${genreContext} narrative${styleContext}.\n\n`;
  
  // Add scenario context
  prompt += "SCENARIO DETAILS:\n";
  prompt += formatScenarioAsMarkdownWithoutStoryArc(scenario) + "\n\n";
  
  // Clear, structured requirements
  prompt += "STORY ARC REQUIREMENTS:\n";
  prompt += "• Structure as a bullet-point outline covering the complete narrative journey\n";
  prompt += "• Include major plot points from setup through resolution\n";
  prompt += "• Show character development arcs for main characters\n";
  prompt += "• Identify key conflicts, turning points, and climactic moments\n";
  prompt += `• Follow ${genreContext} genre conventions and pacing expectations\n`;
  prompt += "• Ensure logical progression and cause-and-effect relationships\n";
  prompt += "• Cover beginning, middle, and end with appropriate story beats\n\n";
  
  prompt += "OUTPUT FORMAT: Provide a structured bullet-point list only - no explanations, headers, or commentary.\n";
  return {
    systemMessage: `You are an expert story architect specializing in ${genreContext} fiction. Create well-structured narrative arcs that follow genre conventions and engage readers.`,
    userMessage: prompt
  };
}

export function createRewriteStoryArcPrompt(scenario: Scenario): llmCompletionRequestMessage {
 if (!scenario) {
    console.error("Error: scenario is null or undefined");
    scenario = {
      id: 'error-fallback',
      userId: 'system',
      createdAt: new Date(),
      writingStyle: { genre: "General Fiction" }
    };
  }
  const writingStyle: StyleSettings = scenario.writingStyle || { genre: "General Fiction" };
  
  // Build context-aware prompt based on writing style
  let genreContext = writingStyle.genre || "General Fiction";
  let styleContext = "";
  if (writingStyle.tone) styleContext += ` with a ${writingStyle.tone.toLowerCase()} tone`;
  if (writingStyle.theme) styleContext += ` exploring themes of ${writingStyle.theme.toLowerCase()}`;
  
  let prompt = `Rewrite the story arc for this ${genreContext} narrative${styleContext}.\n\n`;
  
  // Add scenario context
  prompt += "SCENARIO DETAILS:\n";
  prompt += formatScenarioAsMarkdown(scenario) + "\n\n";
  
  // Clear, structured requirements
  prompt += "STORY ARC REQUIREMENTS:\n";
  prompt += "• Focus on improving the existing story arc while preserving core elements\n";
  prompt += "• Structure as a bullet-point outline covering the complete narrative journey\n";
  prompt += "• Include major plot points from setup through resolution\n";
  prompt += "• Show character development arcs for main characters\n";
  prompt += "• Identify key conflicts, turning points, and climactic moments\n";
  prompt += `• Follow ${genreContext} genre conventions and pacing expectations\n`;
  prompt += "• Ensure logical progression and cause-and-effect relationships\n";
  prompt += "• Cover beginning, middle, and end with appropriate story beats\n\n";
  
  prompt += "OUTPUT FORMAT: Provide a structured bullet-point list only - no explanations, headers, or commentary.\n";
  return {
    systemMessage: `You are an expert story architect specializing in ${genreContext} fiction. Create well-structured narrative arcs that follow genre conventions and engage readers.`,
    userMessage: prompt
  };
}

export function createScenesPrompt(scenario: Scenario): llmCompletionRequestMessage {
  if (!scenario) {
    console.error("Error: scenario is null or undefined");
    scenario = {
      id: 'error-fallback',
      userId: 'system',
      createdAt: new Date(),
      writingStyle: { genre: "General Fiction" }
    };
  }
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
  let prompt = `You are an expert story outliner and screenplay writer. Based on the story elements provided, create a structured sequence of scenes.\n\n`;
  prompt += `For a ${writingStyle.genre} story, generate a sequence of 5-10 scenes that follow the story arc.\n\n`;
  prompt += `For each scene, provide: title, description, location, time of day, and any relevant character names.\n\n`;
  prompt += `IMPORTANT: Your response must be in JSON format ONLY with the following structure:\n`;
  prompt += `\n{\n  "scenes": [\n    {\n      "title": "Scene Title",\n      "description": "Brief description of what happens in this scene",\n      "location": "Where the scene takes place",\n      "time": "Time of day or relative timing",\n      "characters": ["Character1", "Character2"]\n    },\n    ...more scenes...\n  ]\n}\n`;
  prompt += `Do not include any explanatory text outside of the JSON structure.\n\n`;
  prompt += `Here is the scenario:\n\n`;
  prompt += markdown;
  return {
    systemMessage: 'You are an expert story outliner and screenplay writer.',
    userMessage: prompt
  };
}


/**
 * Creates a prompt specifically for generating a character
 * @param scenario The current scenario for context
 * @param characterType The type of character to generate: "protagonist", "antagonist", or "supporting"
 */
export function createCharacterPrompt(scenario: Scenario, characterType: string): llmCompletionRequestMessage {
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
  
  return {
    systemMessage: 'You are an expert character creator.',
    userMessage: prompt
  };
}

/**
 * Creates a prompt for generating a specific character field value
 * @param scenario The current scenario for context
 * @param character The character being edited (with current field values)
 * @param fieldName The name of the field to generate (e.g., 'name', 'backstory', 'appearance')
 * @param fieldDisplayName The human-readable field name for the prompt
 */
export function createCharacterFieldPrompt(
  scenario: Scenario, 
  character: Character, 
  fieldName: string, 
  fieldDisplayName: string
): llmCompletionRequestMessage {
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

  let prompt = `You are a storyteller specializing in ${genre} fiction. Generate a ${fieldDisplayName.toLowerCase()} for a character based on their existing properties.\n\n`;
  
  // Add character context
  prompt += "Character properties:\n";
  if (character.name && character.name.trim()) {
    prompt += `- Name: ${character.name}\n`;
  }
  if (character.alias && character.alias.trim()) {
    prompt += `- Alias: ${character.alias}\n`;
  }
  if (character.role && character.role.trim()) {
    prompt += `- Role: ${character.role}\n`;
  }
  if (character.gender && character.gender.trim()) {
    prompt += `- Gender: ${character.gender}\n`;
  }
  if (character.appearance && character.appearance.trim() && fieldName !== 'appearance') {
    prompt += `- Appearance: ${character.appearance}\n`;
  }
  if (character.backstory && character.backstory.trim() && fieldName !== 'backstory') {
    prompt += `- Backstory: ${character.backstory}\n`;
  }
  if (character.extraInfo && character.extraInfo.trim() && fieldName !== 'extraInfo') {
    prompt += `- Extra Info: ${character.extraInfo}\n`;
  }

  // Add story context
  prompt += `\nStory context:\n`;
  prompt += `- Genre: ${genre}\n`;
  if (scenario.title) {
    prompt += `- Story Title: ${scenario.title}\n`;
  }
  if (writingStyle.tone) {
    prompt += `- Tone: ${writingStyle.tone}\n`;
  }
  if (writingStyle.theme) {
    prompt += `- Theme: ${writingStyle.theme}\n`;
  }

  // Add context from other characters
  if (existingCharacters.length > 0) {
    prompt += `\nOther characters in the story:\n`;
    existingCharacters.forEach((char, index) => {
      if (char.id !== character.id) { // Don't include the character being edited
        prompt += `- ${char.name || char.alias || 'Unnamed'} (${char.role || 'No role specified'})\n`;
      }
    });
  }

  // Field-specific instructions
  switch (fieldName) {
    case 'name':
      prompt += `\nGenerate a ${fieldDisplayName.toLowerCase()} that fits the character's gender, role, and the ${genre} genre. `;
      prompt += `The name should feel authentic to the story world and complement the existing character traits.\n`;
      break;
    case 'alias':
      prompt += `\nGenerate an ${fieldDisplayName.toLowerCase()} or nickname that reflects the character's personality, role, or background. `;
      prompt += `It should feel natural and fit the ${genre} setting.\n`;
      break;
    case 'role':
      prompt += `\nDetermine an appropriate ${fieldDisplayName.toLowerCase()} for this character in the story. `;
      prompt += `Consider their other traits and how they might function in a ${genre} narrative.\n`;
      break;
    case 'gender':
      prompt += `\nDetermine an appropriate ${fieldDisplayName.toLowerCase()} for this character. `;
      prompt += `Consider their name, role, and how they fit into the story.\n`;
      break;
    case 'appearance':
      prompt += `\nDescribe the character's ${fieldDisplayName.toLowerCase()} in 2-3 sentences. `;
      prompt += `Focus on distinctive physical features that match their personality and role. `;
      prompt += `Keep it concise but vivid, appropriate for ${genre} fiction.\n`;
      break;
    case 'backstory':
      prompt += `\nCreate a compelling ${fieldDisplayName.toLowerCase()} for this character in 2-3 sentences. `;
      prompt += `Include formative experiences that shaped them and explain their current role in the story. `;
      prompt += `Make it relevant to the ${genre} genre and story context.\n`;
      break;
    case 'extraInfo':
      prompt += `\nProvide additional character details such as skills, personality traits, motivations, or quirks. `;
      prompt += `Include 2-3 interesting details that would make this character memorable and three-dimensional. `;
      prompt += `Keep it relevant to their role and the ${genre} setting.\n`;
      break;
    default:
      prompt += `\nGenerate an appropriate ${fieldDisplayName.toLowerCase()} for this character.\n`;
  }

  prompt += `\nRespond with ONLY the ${fieldDisplayName.toLowerCase()} - no explanations, formatting, or additional text.`;

  return {
    systemMessage: 'You are an expert storyteller and character creator.',
    userMessage: prompt
  };
}

export function createContextAwareChatPrompt(scenario: Scenario, userMessage: string, chathistory: string): llmCompletionRequestMessage {
  if (!scenario) {
    console.error("Error: scenario is null or undefined");
    scenario = {
      id: 'error-fallback',
      userId: 'system',
      createdAt: new Date(),
      writingStyle: { genre: "General Fiction" }
    };
  }
  const systemprompt = "You are a helpful AI assistant for a storywriter. You will be given the full context of the current story scenario." + 
  " Your task is to answer the user's questions about this scenario and provide helpful follow-up questions." +
  " IMPORTANT: Always respond in the following JSON format:" +
  ' {"answer": "your helpful response", "followUpQuestions": ["question 1", "question 2", "question 3"]}' +
  " Provide 2-3 relevant follow-up questions that would help the user explore their story further.";
const userprompt = `
--- SCENARIO CONTEXT START ---
${JSON.stringify(scenario)}
--- SCENARIO CONTEXT END ---

--- CHAT HISTORY START ---
${chathistory}
--- CHAT HISTORY END ---

USER: ${userMessage}

Remember to respond in JSON format with both "answer" and "followUpQuestions" fields.
`;

return {
    systemMessage: systemprompt,
    userMessage: userprompt
  };
}
