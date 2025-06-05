import { Scenario } from "../types/ScenarioTypes";

export function scenarioStyleToMarkdown(scenario: Scenario): string {
    let markdown = `## Writing style\n\n`;
    
    if (scenario.writingStyle?.genre) {
        markdown += `   - Genre: ${scenario.writingStyle.genre}\n`;
    }

    if (scenario.writingStyle?.style) {
        markdown += `   - Style: ${scenario.writingStyle.style}\n`;
    }

    if (scenario.writingStyle?.tone) {
        markdown += `   - Tone: ${scenario.writingStyle.tone}\n`;
    }

    if (scenario.writingStyle?.language) {
        markdown += `   - Language: ${scenario.writingStyle.language}\n`;
    }

    if (scenario.writingStyle?.theme) {
        markdown += `   - Theme: ${scenario.writingStyle.theme}\n`;
    }

    if (scenario.writingStyle?.other) {
        markdown += `   - Other Notes: ${scenario.writingStyle.other}\n`;
    }
    markdown += `---\n\n`;
    return markdown;
}


export function scenarioCharactersToMarkdown(scenario: Scenario): string {
    let markdown = `## Characters\n\n`;

    if (scenario.characters && scenario.characters.length > 0) {
        scenario.characters.forEach((char) => {
            markdown += `### Character: ${char.name || char.alias || "(random character)"}\n`;
            markdown += `- **Name**: ${char.name || "Create a name for this character."}\n`;
            markdown += `- **Alias**: ${char.alias || "N/A"}\n`;
            markdown += `- **Role**: ${char.role || "N/A"}\n`;
            markdown += `- **Gender**: ${char.gender || "random"}\n\n`;
            if (char.appearance?.trim()) { markdown += `#### Appearance\n${char.appearance || "No description provided."}\n`; }
            if (char.backstory?.trim()) { markdown += `#### Backstory\n${char.backstory || "No backstory provided."}\n`; }
            if (char.extraInfo?.trim()) { markdown += `#### Extra Info\n${char.extraInfo || "No extra information provided."}\n`; }
            markdown += `---\n\n`;
        });
    } else {
        markdown += `This scenario has not specified any characters.\n`;
    }

    return markdown;
}

export function scenarioScenesToMarkdown(scenario: Scenario): string {
    let markdown = ``;

    if (scenario.scenes && scenario.scenes.length > 0) {
        markdown = `## Scenes\n\n`;
        // Sort scenes by order before processing
        const sortedScenes = [...scenario.scenes].sort((a, b) => 
            (a.order !== undefined && b.order !== undefined) ? a.order - b.order : 0
        );
        
        sortedScenes.forEach((scene) => {
            markdown += `### ${scene.title || "Untitled Scene"}\n`;
            markdown += `${scene.description || "No description provided."}\n\n`;
            if (scene.location) {
            markdown += `#### Location\n${scene.location}\n\n`;
            }
            if (scene.time) {
            markdown += `#### Time\n${scene.time}\n\n`;
            }
            if (scene.notes) {
            markdown += `### Notes\n${scene.notes}\n\n`;
            }
            if (scene.characters && scene.characters.length > 0) {
                markdown += `#### Characters participating in this Scene\n`;
            scene.characters.forEach((char) => {
                markdown += `- ${char}\n`;
            });
            markdown += `\n`;
            }
            markdown += `---\n\n`;
        });
    }
    return markdown;
}

export function scenarioStoryArcToMarkdown(scenario: Scenario): string {
    if (scenario.storyarc) {
        return `# Story Arc\n` + `${scenario.storyarc}\n---\n\n`;
    } else {
        return '';
    }
}

export function scenarioNotesToMarkdown(scenario: Scenario): string {
    if (scenario.notes) {
        return `# Notes\n` + `${scenario.notes}\n---\n\n`;
    } else {
        return '';
    }
}

export function scenarioBackstoryToMarkdown(scenario: Scenario): string {
    if (scenario.backstory) {
        return `# Backstory\n` + `${scenario.backstory}\n---\n\n`;
    } else {
        return '';
    }
}

export function formatScenarioAsMarkdown(scenario: Scenario): string {
    let markdown = `# Title: ${scenario.title || "Random title"}\n`;
    if (scenario.synopsis) {
        markdown += `## Synopsis\n${scenario.synopsis}\n\n`;
    } 

    markdown += scenarioStyleToMarkdown(scenario);
    markdown += scenarioCharactersToMarkdown(scenario);
    markdown += scenarioScenesToMarkdown(scenario);
    markdown += scenarioStoryArcToMarkdown(scenario);
    markdown += scenarioNotesToMarkdown(scenario);
    markdown += scenarioBackstoryToMarkdown(scenario);

  return markdown;
}
