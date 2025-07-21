// All prompt generation logic for LLM scenario/storywriting
import { llmCompletionRequestMessage } from '../types/LLMTypes';
import { Character, Scenario, StyleSettings } from '../types/ScenarioTypes';
import { formatScenarioAsMarkdown, formatScenarioAsMarkdownWithoutBackStory, formatScenarioAsMarkdownWithoutStoryArc } from '../utils/scenarioToMarkdown';

export function createWritingStylePrompt(): llmCompletionRequestMessage {
  // Add variation to prevent repetitive style combinations
  const styleCategories = {
    literary: ['Literary Fiction', 'Magical Realism', 'Experimental', 'Postmodern', 'Minimalist'],
    popular: ['Contemporary Fiction', 'Historical Fiction', 'Romance', 'Thriller', 'Mystery'],
    speculative: ['Science Fiction', 'Fantasy', 'Horror', 'Dystopian', 'Urban Fantasy'],
    genre: ['Western', 'Adventure', 'Crime', 'War', 'Comedy']
  };
  
  const toneVariations = [
    'Serious', 'Humorous', 'Dark', 'Optimistic', 'Melancholic', 'Satirical', 
    'Nostalgic', 'Tense', 'Whimsical', 'Gritty', 'Elegant', 'Raw'
  ];
  
  const themeOptions = [
    'Love and Loss', 'Power and Corruption', 'Identity and Belonging', 'Justice and Morality',
    'Family Dynamics', 'Social Change', 'Survival and Resilience', 'Freedom vs Security',
    'Coming of Age', 'Redemption', 'Legacy and Memory', 'Truth and Deception'
  ];
  
  // Randomly select category and specific genre
  const categories = Object.keys(styleCategories);
  const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
  const genreOptions = styleCategories[selectedCategory as keyof typeof styleCategories];
  
  return {
    systemMessage: 'You are an expert in literary styles and genres with deep knowledge of diverse writing traditions.',
    userMessage: `Create a unique writing style configuration for a story. Generate creative combinations that avoid clichés.\n\nSELECTION GUIDELINES:\n• Choose from varied literary traditions and genres\n• Create interesting tone/genre combinations\n• Select themes that resonate with modern readers\n• Avoid overused fantasy/sci-fi tropes\n• Consider diverse cultural perspectives\n\nProvide a JSON object with these fields:\n- style: A specific literary approach or movement\n- genre: A storytelling genre (consider: ${genreOptions.join(', ')})\n- tone: The emotional atmosphere (consider: ${toneVariations.join(', ')})\n- language: The prose style and vocabulary level\n- theme: A meaningful central theme (consider: ${themeOptions.join(', ')})\n- other: Specific stylistic instructions or constraints\n\nFORMAT: JSON only, no explanations:\n{\n  "style": "(literary style)",\n  "genre": "(specific genre)",\n  "tone": "(emotional tone)",\n  "language": "(prose style)",\n  "theme": "(central theme)",\n  "other": "(additional instructions)"\n}`
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

export function createStoryTitlePrompt(scenario: Scenario): llmCompletionRequestMessage {
  if (!scenario) {
    throw new Error("Error: scenario is null or undefined");
  }

  const writingStyle = scenario.writingStyle || { genre: "General Fiction" };
  const genre = writingStyle.genre || "General Fiction";
  
  // Add variation techniques to prevent repetitive output
  const titleStyles = [
    "a metaphorical title that symbolizes the main theme",
    "a direct title that names the central conflict or character",
    "an atmospheric title that evokes the setting or mood",
    "a cryptic title that hints at mystery or revelation",
    "an action-oriented title that suggests movement or change",
    "a character-focused title using names or relationships",
    "a location-based title highlighting the story's setting",
    "a thematic title that captures the emotional core"
  ];
  
  const selectedStyle = titleStyles[Math.floor(Math.random() * titleStyles.length)];
  
  const avoidWords = ['Echoes', 'Obsidian', 'Mist', 'Shadow', 'Darkness', 'Light', 'Heart', 'Soul', 'Blood', 'Fire', 'Storm', 'Dawn', 'Whisper', 'Secret', 'Hidden', 'Lost', 'Forgotten', 'Last', 'Final', 'Velvet'];
  
  let prompt = `You are an expert title creator specializing in ${genre} fiction. Your task is to create ${selectedStyle}.\n\n`;
  
  prompt += "TITLE CREATION STRATEGY:\n";
  prompt += `• Create ${selectedStyle}\n`;
  prompt += `• Draw inspiration from ${genre} genre conventions\n`;
  prompt += "• Make it distinctive and memorable\n";
  prompt += "• Ensure it feels fresh, not formulaic\n";
  prompt += "• Consider the story's unique elements and hook\n\n";
  
  if (writingStyle.tone) {
    prompt += `• Match the ${writingStyle.tone} tone of the story\n`;
  }
  if (writingStyle.theme) {
    prompt += `• Reflect the theme of ${writingStyle.theme}\n`;
  }
  
  prompt += `\nAVOID these overused words: ${avoidWords.join(', ')}\n\n`;
  
  prompt += "SCENARIO DETAILS:\n";
  prompt += formatScenarioAsMarkdown(scenario) + "\n\n";
  
  prompt += "OUTPUT: Provide ONLY the title as a single string - no quotes, explanations, or additional text.";
  
  return {
    systemMessage: `You are an expert title creator specializing in ${genre} fiction with a talent for original, evocative titles.`,
    userMessage: prompt
  };
}

export function createScenarioSynopsisPrompt(scenario: Scenario) {
  if (!scenario) {
    throw new Error("Error: scenario is null or undefined");
  }
  let prompt = "You are a creative scenario synopsis creator.\n\n";
  prompt += "Generate a compelling synopsis for the scenario below.\n";
  prompt += "The synopsis should capture the essence of the story, be engaging, and reflect the genre and tone.\n";
  prompt += "The synopsis should resemble what you read on the back cover of a book, summarizing the backstory, hinting at the story arc, but without revealing any major plot points.\n\n";
  prompt += "The synopsis should be concise, memorable, and capture the reader's interest.\n";
  prompt += "IMPORTANT: return ONLY the synopsis as a single string without any additional text or formatting.\n\n";
  prompt += formatScenarioAsMarkdown(scenario) + "\n\n";
  return {
    systemMessage: 'You are a creative synopsis generator for stories.',
    userMessage: prompt
  };
}

export function createSummaryPrompt(scenario: Scenario, story: string): llmCompletionRequestMessage {
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
  let prompt = "You are a masterful storyteller specializing in providing summarized content for the genre " + writingStyle.genre + ". Rewrite the story below this prompt.\n";
  prompt += "Keep the core elements of the story but make it short and high-level.:\n";
  prompt += "- Make it clear and structured\n";
  prompt += "- Keep it short and high-level (only add details that are needed for clarity)\n";
  prompt += "- Do not provide character descriptions or backstories\n";
  prompt += "- Write in a neutral tone, only a few paragraphs, as if it's the back cover of a book. \n";
  prompt += "Do not include any markdown, formatting, or meta-commentary - only the rewritten story itself.\n";
  prompt += "Here is the story to summarize:\n-----------------\n\n";
  prompt += story + "\n\n-----------------\n";
  return {
    systemMessage: 'You are a masterful storyteller specializing in summarizing stories.',
    userMessage: prompt
  };
}

export function createFinalStoryPrompt(scenario: Scenario): llmCompletionRequestMessage {
  if (!scenario) {
    console.error("Error: scenario is null or undefined");
    return {
      systemMessage: 'Invalid scenario data',
      userMessage: ''
    };
  }
  
  // Check if this is a fill-in story scenario
  const hasFillInData = scenario.fillIn && (
    (scenario.fillIn.beginning && scenario.fillIn.beginning.trim()) ||
    (scenario.fillIn.ending && scenario.fillIn.ending.trim())
  );
  
  const markdown = formatScenarioAsMarkdown(scenario);
  const style = scenario.writingStyle || { genre: "General Fiction" };
  let prompt = "You are an exceptional storyteller";
  if (style.genre) {
    prompt += ` with expertise in the genre ${style.genre}`;
  }
  
  if (hasFillInData) {
    prompt += ".\n\nFill in the missing parts of this story based on the provided scenario and story segments:\n\n";
    
    // Add specific fill-in instructions
    prompt += "Fill-In Instructions:\n";
    if (scenario.fillIn!.beginning && scenario.fillIn!.beginning.trim()) {
      if (scenario.fillIn!.ending && scenario.fillIn!.ending.trim()) {
        prompt += "- You have been provided with both the beginning and ending of the story\n";
        prompt += "- Create the middle section that naturally connects the beginning to the ending\n";
        prompt += "- Ensure smooth transitions and logical story progression\n";
      } else {
        prompt += "- You have been provided with the beginning of the story\n";
        prompt += "- Continue from where the beginning leaves off and create a complete ending\n";
      }
    } else if (scenario.fillIn!.ending && scenario.fillIn!.ending.trim()) {
      prompt += "- You have been provided with the ending of the story\n";
      prompt += "- Create a compelling beginning and middle that leads naturally to the provided ending\n";
    }
    
    prompt += "- Maintain consistent tone, style, and character voice throughout\n";
    prompt += "- Honor all character backgrounds and scenario details\n";
    prompt += "- IMPORTANT: do not use the names 'Silas', 'Blackwood' or 'Lyra'\n";
    prompt += "- Present the complete story as one continuous narrative\n";
    prompt += "- Do not include section markers or indicate where you filled in content\n\n";
    
    // Add the provided story segments
    if (scenario.fillIn!.beginning && scenario.fillIn!.beginning.trim()) {
      prompt += "STORY BEGINNING (provided):\n";
      prompt += scenario.fillIn!.beginning.trim() + "\n\n";
    }
    
    if (scenario.fillIn!.ending && scenario.fillIn!.ending.trim()) {
      prompt += "STORY ENDING (provided):\n";
      prompt += scenario.fillIn!.ending.trim() + "\n\n";
    }
    
  } else {
    prompt += ".\n\nCreate a complete, engaging narrative based on the following scenario:\n\n";
    prompt += "Guidelines:\n";
    prompt += "- Write all chapters and scenes fully, but do not use chapter headers\n";
    prompt += "- Write the complete story up to the end\n";
    prompt += "- IMPORTANT: do not use the names 'Silas', 'Blackwood' or 'Lyra'\n";
    prompt += "- Include meaningful character interactions and development\n";
    prompt += "- Honor the established character backgrounds and relationships\n";
    prompt += "- Maintain consistent pacing appropriate to the genre\n";
    prompt += "- Incorporate any specified themes, settings, and plot elements\n";
    prompt += "- Present only the finished story with no meta-commentary, or markdown. Divide the story in paragraphs.\n\n";
  }
  
  prompt += "SCENARIO DETAILS:\n";
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
  
  // Character archetypes for variation
  const characterArchetypes = {
    protagonist: [
      "reluctant hero thrust into extraordinary circumstances",
      "determined individual fighting against injustice",
      "flawed character seeking redemption",
      "ordinary person discovering hidden abilities",
      "mentor figure guiding others",
      "rebel challenging the status quo"
    ],
    antagonist: [
      "misguided idealist with good intentions",
      "corrupt authority figure abusing power",
      "rival with legitimate grievances",
      "manipulative schemer working behind scenes",
      "tragic figure consumed by past trauma",
      "zealot convinced of their righteous cause"
    ],
    supporting: [
      "loyal companion with hidden depths",
      "wise mentor with mysterious past",
      "comic relief with surprising skills",
      "double agent with divided loyalties",
      "outsider bringing fresh perspective",
      "specialist with unique expertise"
    ]
  };
  
  const archetypes = characterArchetypes[characterType as keyof typeof characterArchetypes] || ["complex individual with unique traits"];
  const selectedArchetype = archetypes[Math.floor(Math.random() * archetypes.length)];
  
  let prompt = `You are an expert character creator for ${genre} stories. Create a compelling ${characterType} character who is a ${selectedArchetype}.\n\n`;
  
  // Add genre-specific character traits
  prompt += "CHARACTER CREATION GUIDELINES:\n";
  if (characterType === "protagonist") {
    prompt += "• Give them a clear motivation and personal stakes\n";
    prompt += "• Include both strengths and meaningful flaws\n";
    prompt += "• Make them active, not just reactive to events\n";
  } else if (characterType === "antagonist") {
    prompt += "• Provide understandable, even sympathetic motivations\n";
    prompt += "• Avoid making them purely evil - give them complexity\n";
    prompt += "• Create meaningful opposition to the protagonist's goals\n";
  } else if (characterType === "supporting") {
    prompt += "• Give them their own goals beyond helping the main character\n";
    prompt += "• Make them memorable with distinctive traits or skills\n";
    prompt += "• Ensure they serve a specific function in the story\n";
  }
  
  prompt += `• Make the character authentic to ${genre} conventions\n`;
  if (writingStyle.tone) {
    prompt += `• Match the ${writingStyle.tone} tone of the story\n`;
  }
  if (writingStyle.theme) {
    prompt += `• Relate to the theme of ${writingStyle.theme}\n`;
  }

  // Add context from existing characters, if any
  if (existingCharacters.length > 0) {
    prompt += "\nEXISTING CHARACTERS:\n";
    existingCharacters.forEach((char) => {
      prompt += `• ${char.name || char.alias || 'Unnamed'} - ${char.role || 'No specified role'}\n`;
    });
    prompt += "\nCreate a character that would create interesting dynamics with these existing characters.\n";
  }

  // Avoid overused names
  const avoidNames = ['Silas', 'Lyra', 'Blackwood', 'Seraphina', 'Raven', 'Phoenix', 'Storm', 'Ash', 'Jade', 'Onyx'];

  // Request specific details
  prompt += "\nCHARACTER DETAILS TO GENERATE:\n";
  prompt += "- name: A fitting name (avoid clichéd fantasy names)\n";
  prompt += "- alias: An optional nickname or alias (can be empty string)\n";
  prompt += "- gender: Choose based on what fits the character concept\n";
  prompt += "- role: Their specific role ('Protagonist', 'Antagonist', or 'Supporting')\n";
  prompt += "- appearance: A distinctive physical description (2-3 sentences)\n";
  prompt += "- backstory: Formative experiences that shaped them (2-3 sentences)\n";
  prompt += "- extraInfo: Personality traits, skills, or unique quirks\n\n";
  
  prompt += `AVOID these overused names: ${avoidNames.join(', ')}\n\n`;
  
  prompt += "FORMAT: Respond with a valid JSON object ONLY - no explanations or additional text:\n";
  prompt += "{\n";
  prompt += '  "name": "(unique name)",\n';
  prompt += '  "alias": "(alias or empty string)",\n';
  prompt += '  "gender": "(gender)",\n';
  prompt += '  "role": "(role)",\n';
  prompt += '  "appearance": "(physical description)",\n';
  prompt += '  "backstory": "(character background)",\n';
  prompt += '  "extraInfo": "(additional traits)"\n';
  prompt += "}";
  
  return {
    systemMessage: `You are an expert character creator specializing in ${genre} fiction. You excel at creating original, memorable characters that avoid clichés.`,
    userMessage: prompt
  };
}

/**
 * Creates a prompt specifically for generating a random character with additional instructions
 * @param scenario The current scenario for context
 * @param characterType The type of character to generate: "protagonist", "antagonist", or "supporting"
 * @param additionalInstructions Optional additional instructions for character generation
 */
export function createRandomCharacterPrompt(scenario: Scenario, characterType: string, additionalInstructions?: string): llmCompletionRequestMessage {
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
  
  // Additional randomization elements
  const personalityQuirks = [
    "has an unusual hobby or skill",
    "speaks with a distinctive verbal tic or accent",
    "carries a meaningful object everywhere",
    "has an unexpected fear or phobia",
    "practices an uncommon profession or craft",
    "possesses knowledge from a previous life experience",
    "maintains a secret that affects their behavior",
    "has a unique relationship with animals or nature"
  ];
  
  const motivationTypes = [
    "seeking to prove themselves worthy",
    "protecting someone or something precious",
    "uncovering a hidden truth",
    "making amends for past mistakes",
    "escaping from a restrictive situation",
    "pursuing a long-held dream",
    "fulfilling a promise to someone important",
    "discovering their true identity or heritage"
  ];
  
  const selectedQuirk = personalityQuirks[Math.floor(Math.random() * personalityQuirks.length)];
  const selectedMotivation = motivationTypes[Math.floor(Math.random() * motivationTypes.length)];
  
  let prompt = `You are an expert character creator for ${genre} stories. Create a ${characterType} character who ${selectedQuirk} and is ${selectedMotivation}.\n\n`;
  
  prompt += "RANDOMIZATION REQUIREMENTS:\n";
  prompt += `• Create someone who ${selectedQuirk}\n`;
  prompt += `• Their core motivation involves ${selectedMotivation}\n`;
  prompt += "• Give them at least one unexpected trait or contradiction\n";
  prompt += "• Make their background specific and unusual\n";
  prompt += "• Ensure they feel fresh and original, not formulaic\n\n";
  
  if (characterType === "protagonist") {
    prompt += "PROTAGONIST FOCUS:\n";
    prompt += "• Create clear personal stakes that drive the story\n";
    prompt += "• Include meaningful flaws that create internal conflict\n";
    prompt += "• Give them agency to affect story outcomes\n\n";
  } else if (characterType === "antagonist") {
    prompt += "ANTAGONIST FOCUS:\n";
    prompt += "• Provide sympathetic or understandable motivations\n";
    prompt += "• Make them a worthy opponent, not just an obstacle\n";
    prompt += "• Give them personal connections to the conflict\n\n";
  } else if (characterType === "supporting") {
    prompt += "SUPPORTING CHARACTER FOCUS:\n";
    prompt += "• Give them personal goals beyond helping others\n";
    prompt += "• Make them indispensable to the story in some way\n";
    prompt += "• Create potential for character growth or change\n\n";
  }

  // Add additional instructions if provided
  if (additionalInstructions && additionalInstructions.trim()) {
    prompt += `SPECIAL REQUIREMENTS: ${additionalInstructions.trim()}\n\n`;
  }

  // Add context from existing characters, if any
  if (existingCharacters.length > 0) {
    prompt += "EXISTING CHARACTERS FOR CONTEXT:\n";
    existingCharacters.forEach((char) => {
      prompt += `• ${char.name || char.alias || 'Unnamed'} - ${char.role || 'No specified role'}\n`;
    });
    prompt += "\nCreate dynamics that would generate interesting conflicts or alliances.\n\n";
  }

  // Avoid overused elements
  const avoidNames = ['Silas', 'Lyra', 'Blackwood', 'Seraphina', 'Raven', 'Phoenix', 'Storm', 'Ash', 'Jade', 'Onyx'];
  const avoidTraits = ['mysterious past', 'dark secret', 'chosen one', 'last of their kind', 'amnesia', 'orphan'];

  prompt += "CHARACTER GENERATION:\n";
  prompt += "- name: Create an original, memorable name\n";
  prompt += "- alias: Optional nickname reflecting their personality or history\n";
  prompt += "- gender: Choose what fits the character concept\n";
  prompt += "- role: Their specific story function\n";
  prompt += "- appearance: Distinctive physical description with personality hints\n";
  prompt += "- backstory: Specific formative experiences (avoid generic traumas)\n";
  prompt += "- extraInfo: Unique skills, habits, or quirks\n\n";
  
  prompt += `AVOID these overused names: ${avoidNames.join(', ')}\n`;
  prompt += `AVOID these clichéd traits: ${avoidTraits.join(', ')}\n\n`;
  
  prompt += "FORMAT: JSON object only, no explanations:\n";
  prompt += "{\n";
  prompt += '  "name": "(original name)",\n';
  prompt += '  "alias": "(nickname or empty string)",\n';
  prompt += '  "gender": "(gender)",\n';
  prompt += '  "role": "(role)",\n';
  prompt += '  "appearance": "(distinctive description)",\n';
  prompt += '  "backstory": "(specific background)",\n';
  prompt += '  "extraInfo": "(unique traits)"\n';
  prompt += "}";
  
  return {
    systemMessage: `You are an expert character creator specializing in ${genre} fiction. You excel at creating original, unpredictable characters that subvert expectations.`,
    userMessage: prompt
  };
}

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

  let prompt = `You are a storyteller specializing in ${genre} fiction. Generate a: ${fieldDisplayName.toLowerCase()} for a character based on their existing properties.\n\n`;
  
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
    existingCharacters.forEach((char) => {
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

export function createCharacterFromPhotoPrompt(
  scenario: Scenario,
  characterName?: string,
  characterRole?: string,
  additionalPrompt?: string
): string {
  let prompt = "You are an expert character creator for " + (scenario.writingStyle?.genre || "general") + " stories. Analyze the provided photo carefully and create a character based on what you see in the image and the story context.\n\n";
  prompt += "IMPORTANT: Base your character description on the actual visual details from the photo - clothing, appearance, facial expressions, setting, activity, etc.\n";
  prompt += "If the character is doing an activity in the photo, describe that activity in the character backstory as a favorite pastime.\n\n";
  if (characterName && characterName.trim()) { prompt += `Character Name: ${characterName.trim()}\n`; }
  else { prompt += 'Give this character a name based on what you see in the photo. The name should be appropriate for the genre, not be cliche, and the first name should NOT be "Silas" or "Seraphina".\n'; }
  prompt += '  "Appearance": "(detailed physical description based on what you observe in the photo - include clothing, build, facial features, age, etc.)",\n';
  if (characterRole && characterRole.trim()) { prompt += `Character Role: ${characterRole.trim()}\n`; }
  if (additionalPrompt && additionalPrompt.trim()) { prompt += `Additional Context: ${additionalPrompt.trim()}\n`; }
  prompt += `\nThe new character should fit in a story with these characteristics:\n`;
  if (scenario && scenario.writingStyle) {
    prompt += `Genre: ${scenario.writingStyle.genre || "General Fiction"}\n`;
    if (scenario.writingStyle.tone) {
      prompt += `Tone: ${scenario.writingStyle.tone}\n`;
    }
    if (scenario.writingStyle.theme) {
      prompt += `Theme: ${scenario.writingStyle.theme}\n`;
    }
    if (scenario.writingStyle.other) {
      prompt += `Style instructions: ${scenario.writingStyle.other}\n`;
    }
  } else {
    prompt += "Genre: General Fiction\n";
  }
  if (scenario && scenario.title) {
    prompt += `Story Title: ${scenario.title}\n`;
  }
  if (scenario && scenario.backstory) {
    prompt += `Backstory: ${scenario.backstory}\n`;
  }
  if (scenario && scenario.storyarc) {
    prompt += `Story Arc: ${scenario.storyarc}\n`;
  }
  if (scenario && scenario.notes) {
    prompt += `Notes: ${scenario.notes}\n`;
  }
  prompt += `\n\nIMPORTANT: Your response must be in JSON format ONLY with the following structure:\n`;
  prompt += `{\n`;
  prompt += '  "name": "(name)",\n';
  prompt += '  "alias": "(alias)",\n';
  prompt += '  "role": "(role)",\n';
  prompt += '  "gender": "(gender)",\n';
  prompt += '  "appearance": "(appearance)",\n';
  prompt += '  "backstory": "(backstory)",\n';
  prompt += '  "extraInfo": "(extraInfo)"\n';
  prompt += `}\n`;  

  return prompt;
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

  // prevent these characters from appearing i the response: “, ”, “, ”, ‘, ’
  const systemprompt = "You are a helpful AI assistant for a storywriter. You will be given the full context of the current story scenario." + 
  " Your task is to answer the user's questions about this scenario and provide helpful follow-up questions." +
  " IMPORTANT: refuse to answer questions that are unrelated to the scenario." +
  " IMPORTANT: Always respond in valid JSON format., use ONLY normal double quotes, and escape any special characters." +
  ' use this json schema: ```json {"answer": "your helpful response", "followUpQuestions": ["question 1"]}```' +
  " Provide exactly 1 relevant follow-up question that would help the user explore their story further.";
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

/**
 * Create a prompt specifically for generating character appearance from a photo
 * @param character Character with existing properties
 * @param scenario Current scenario for context
 * @returns Formatted prompt message for the LLM
 */
export function createPhotoBasedAppearancePrompt(
  character: Character,
  scenario: Scenario
): string {
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
  const tone = writingStyle.tone || "";
  const style = writingStyle.style || "";

  let prompt = `You are an expert character designer for ${genre} fiction. You need to provide a detailed physical appearance description for the following character based on their photo.\n\n`;
  
  // Add character context
  prompt += "Character information:\n";
  if (character.name) prompt += `- Name: ${character.name}\n`;
  if (character.alias) prompt += `- Alias: ${character.alias}\n`;
  if (character.role) prompt += `- Role: ${character.role}\n`;
  if (character.gender) prompt += `- Gender: ${character.gender}\n`;
  if (character.backstory) prompt += `- Backstory summary: ${character.backstory.slice(0, 150)}...\n`;
  
  prompt += "\nBased on the provided photo, describe the character's physical appearance in detail. Include:\n";
  prompt += "- Physical features (face, hair, eyes, build, etc.)\n";
  prompt += "- Clothing style and distinctive items\n";
  prompt += "- Overall impression and presence\n";
  
  if (tone) {
    prompt += `\nWrite with a ${tone} tone that matches the overall story style.`;
  }
  
  if (style) {
    prompt += `\nUse a ${style} writing style.`;
  }
  
  prompt += "\nProvide only the appearance description, not labeled as JSON or with any additional commentary. Write 2-3 paragraphs of rich, detailed description.";
  
  return prompt;
}


/**
 * Create a prompt for generating creative notes and ideas for a story
 */
export function createNotesPrompt(scenario: Scenario): llmCompletionRequestMessage {
  const { title, synopsis, writingStyle, characters, backstory, storyarc } = scenario;
  
  let prompt = `You are a creative writing assistant. Generate helpful notes, ideas, and brainstorming content for the following story:

**Story Title:** ${title || 'Untitled Story'}

**Synopsis:** ${synopsis || 'No synopsis provided'}

**Writing Style:**
- Genre: ${writingStyle?.genre || 'Not specified'}
- Tone: ${writingStyle?.tone || 'Not specified'}
- Style: ${writingStyle?.style || 'Not specified'}
- Theme: ${writingStyle?.theme || 'Not specified'}`;

  if (characters && characters.length > 0) {
    prompt += `

**Characters:**`;
    characters.forEach(char => {
      prompt += `
- ${char.name || 'Unnamed'}: ${char.role || 'No role specified'}`;
    });
  }

  if (backstory) {
    prompt += `

**Backstory:** ${backstory}`;
  }

  if (storyarc) {
    prompt += `

**Story Arc:** ${storyarc}`;
  }

  prompt += `

Generate creative and useful notes for this story. Include a mix of the following:

1. **Character Development Ideas:** Personality quirks, motivations, hidden secrets, growth arcs
2. **Scene Ideas:** Vivid descriptions, memorable moments, dialogue snippets
3. **Plot Enhancements:** Subplots, twists, complications, foreshadowing
4. **World-building Details:** Setting descriptions, cultural elements, atmosphere
5. **Themes & Symbols:** Deeper meanings, metaphors, recurring motifs
6. **Research Notes:** Factual details that could enhance authenticity
7. **Creative Inspiration:** Mood, imagery, sensory details

Format the notes in a clear, organized way with headers. Be creative and think outside the box. Provide practical ideas that would help a writer develop and enrich their story.`;

  return {
    userMessage: prompt
  };
}
