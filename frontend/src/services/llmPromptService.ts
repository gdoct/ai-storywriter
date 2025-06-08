// All prompt generation logic for LLM scenario/storywriting
import { Scenario, StyleSettings } from '../types/ScenarioTypes';
import { formatScenarioAsMarkdown } from '../utils/scenarioToMarkdown';

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

export function createBackstoryPrompt(scenario: Scenario): string {
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
}

export function createChapterPrompt(scenario: Scenario, chapterNumber: number, previousChapters?: string): string {
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
}

export function createStoryArcPrompt(scenario: Scenario): string {
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
  const markdown = formatScenarioAsMarkdown(scenario);
  let prompt = `You are a masterful story architect. Write a high-level story arc for a ${writingStyle.genre} story based on the following scenario.\n\n`;
  prompt += `The story arc should outline the main plot points, character arcs, and key events from beginning to end.\n\n`;
  prompt += `Do not include any markdown, formatting, or meta-commentary - only the story arc itself.\n\nScenario details:\n\n`;
  prompt += markdown;
  return prompt;
}

export function createRewriteStoryArcPrompt(scenario: Scenario): string {
  if (!scenario) {
    console.error("Error: scenario is null or undefined");
    scenario = {
      id: 'error-fallback',
      userId: 'system',
      createdAt: new Date(),
      writingStyle: { genre: "General Fiction" }
    };
  }
  const currentStoryArc = scenario.storyarc || "";
  const writingStyle = scenario.writingStyle || { genre: "General Fiction" };
  let prompt = `You are a masterful story architect specializing in improving story arcs for ${writingStyle.genre} fiction. Rewrite the following story arc to be more compelling, clear, and high-level.\n\n`;
  prompt += `"${currentStoryArc}"\n\n`;
  prompt += `Keep the core plot points and character arcs, but improve structure and flow.\n`;
  prompt += `Do not include any markdown, formatting, or meta-commentary - only the rewritten story arc itself.`;
  return prompt;
}

export function createScenesPrompt(scenario: Scenario): string {
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
  return prompt;
}

export function createRewriteBackstoryPrompt(scenario: Scenario): string {
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
