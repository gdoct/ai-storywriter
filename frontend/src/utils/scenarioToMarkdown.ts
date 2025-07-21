import { Scenario } from "../types/ScenarioTypes";

/** ISSUE: is not rendering all data in the scenario object.
 * An example scenario json is below. it contains data from 3 custom tabs in the scenario editor:
 * customTab1, customTab2 and customTab3
 * this converter should render all data in the scenario object instead.
 * {
    "backstory": "backstory",
    "characters": [
        {
            "alias": "alias",
            "appearance": "appearance",
            "backstory": "backstory",
            "extraInfo": "extraInfo",
            "gender": "gender",
            "id": "id",
            "name": "name",
            "photoId": "photoId",
            "photoUrl": "photoUrl",
            "role": "role"
        },
        {
            "alias": "alias",
            "appearance": "...", 
            "backstory": "...",
            "extraInfo": "...",
            "gender": "...",
            "id": "...",
            "name": "...",
            "photoId": "...",
            "photoUrl": "...",
            "role": "..."
        }
    ],
    "createdAt": "createdAt",
    "id": "id",
    "imageUrl": "imageUrl",
    "notes": "notes",
    "synopsis": "synopsis",
    "title": "title",
    "userId": "userId",
    "visibleTabs": [...],
    "writingStyle": {
        "genre": "genre"
    },
    "customTab1": {},
    "customTab2": {},
    "customTab3": [],
}

should render to (in this specific order!)
 * 
# <title>

## Synopsis
<synopsis>

## Writing style
* Genre: <genre>
* Style: <style>
* Tone: <tone>
* Communication style: <communicationStyle>
* Theme: <theme>
* Other Notes: <other>

## Notes
<notes>

## Characters
.. character details

## Backstory
<backstory>

## Story Arc
<storyarc>

## CustomTab1
...
## CustomTab2 
...
## CustomTab3 
...
 */

export function scenarioStyleToMarkdown(scenario: Scenario): string {
    let markdown = `## Writing style\n`;
    
    if (scenario.writingStyle?.genre) {
        markdown += `* Genre: ${scenario.writingStyle.genre}\n`;
    }

    if (scenario.writingStyle?.style) {
        markdown += `* Style: ${scenario.writingStyle.style}\n`;
    }

    if (scenario.writingStyle?.tone) {
        markdown += `* Tone: ${scenario.writingStyle.tone}\n`;
    }

    if (scenario.writingStyle?.communicationStyle) {
        markdown += `* Communication style: ${scenario.writingStyle.communicationStyle}\n`;
    }

    if (scenario.writingStyle?.theme) {
        markdown += `* Theme: ${scenario.writingStyle.theme}\n`;
    }

    if (scenario.writingStyle?.other) {
        markdown += `* Other Notes: ${scenario.writingStyle.other}\n`;
    }
    markdown += `\n`;
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
        return `## Story Arc\n${scenario.storyarc}\n\n`;
    } else {
        return '';
    }
}

export function scenarioNotesToMarkdown(scenario: Scenario): string {
    if (scenario.notes) {
        return `## Notes\n${scenario.notes}\n\n`;
    } else {
        return '';
    }
}

export function scenarioBackstoryToMarkdown(scenario: Scenario): string {
    if (scenario.backstory) {
        return `## Backstory\n${scenario.backstory}\n\n`;
    } else {
        return '';
    }
}

function renderCustomTabsToMarkdown(scenario: any): string {
    let markdown = '';
    
    // Check for custom tabs (customTab1, customTab2, customTab3, etc.)
    const customTabKeys = Object.keys(scenario).filter(key => key.startsWith('customTab'));
    
    for (const tabKey of customTabKeys) {
        const tabData = scenario[tabKey];
        if (tabData !== undefined && tabData !== null) {
            // Extract tab name (e.g., "CustomTab1" from "customTab1")
            const tabName = tabKey.replace(/^customTab(\d+)$/, 'CustomTab$1');
            markdown += `## ${tabName}\n`;
            
            if (typeof tabData === 'string') {
                markdown += `${tabData}\n\n`;
            } else if (Array.isArray(tabData)) {
                if (tabData.length > 0) {
                    tabData.forEach((item, index) => {
                        if (typeof item === 'string') {
                            markdown += `- ${item}\n`;
                        } else if (typeof item === 'object') {
                            markdown += `### Item ${index + 1}\n`;
                            Object.entries(item).forEach(([key, value]) => {
                                markdown += `- **${key}**: ${value}\n`;
                            });
                            markdown += '\n';
                        }
                    });
                    markdown += '\n';
                } else {
                    markdown += 'No data provided.\n\n';
                }
            } else if (typeof tabData === 'object') {
                const entries = Object.entries(tabData);
                if (entries.length > 0) {
                    entries.forEach(([key, value]) => {
                        markdown += `- **${key}**: ${value}\n`;
                    });
                    markdown += '\n';
                } else {
                    markdown += 'No data provided.\n\n';
                }
            } else {
                markdown += `${String(tabData)}\n\n`;
            }
        }
    }
    
    return markdown;
}

export function formatScenarioAsMarkdown(scenario: Scenario): string {
    let markdown = `# ${scenario.title || "Random title"}\n\n`;
    
    if (scenario.synopsis) {
        markdown += `## Synopsis\n${scenario.synopsis}\n\n`;
    }

    markdown += scenarioStyleToMarkdown(scenario);
    markdown += scenarioNotesToMarkdown(scenario);
    markdown += scenarioCharactersToMarkdown(scenario);
    markdown += scenarioBackstoryToMarkdown(scenario);
    markdown += scenarioStoryArcToMarkdown(scenario);
    markdown += scenarioScenesToMarkdown(scenario);
    markdown += renderCustomTabsToMarkdown(scenario);

    return markdown;
}

export function formatScenarioAsMarkdownWithoutBackStory(scenario: Scenario): string {
    let markdown = `# ${scenario.title || "Random title"}\n\n`;
    
    if (scenario.synopsis) {
        markdown += `## Synopsis\n${scenario.synopsis}\n\n`;
    }

    markdown += scenarioStyleToMarkdown(scenario);
    markdown += scenarioNotesToMarkdown(scenario);
    markdown += scenarioCharactersToMarkdown(scenario);
    markdown += scenarioScenesToMarkdown(scenario);
    markdown += scenarioStoryArcToMarkdown(scenario);
    markdown += renderCustomTabsToMarkdown(scenario);

    return markdown;
}

export function formatScenarioAsMarkdownWithoutStoryArc(scenario: Scenario): string {
    let markdown = `# ${scenario.title || "Random title"}\n\n`;
    
    if (scenario.synopsis) {
        markdown += `## Synopsis\n${scenario.synopsis}\n\n`;
    }

    markdown += scenarioStyleToMarkdown(scenario);
    markdown += scenarioNotesToMarkdown(scenario);
    markdown += scenarioCharactersToMarkdown(scenario);
    markdown += scenarioScenesToMarkdown(scenario);
    markdown += scenarioBackstoryToMarkdown(scenario);
    markdown += renderCustomTabsToMarkdown(scenario);

    return markdown;
}