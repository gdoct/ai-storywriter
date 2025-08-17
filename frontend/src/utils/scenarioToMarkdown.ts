import { Scenario, TimelineEvent } from "../types/ScenarioTypes";

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

## Locations
.. location details

## Backstory
<backstory>

## Story Arc
<storyarc>

## Scenes
.. scene details

## Timeline & Events
.. timeline events in chronological order

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

export function scenarioLocationsToMarkdown(scenario: Scenario): string {
    let markdown = `## Locations\n\n`;

    if (scenario.locations && scenario.locations.length > 0) {
        scenario.locations.forEach((location) => {
            markdown += `### Location: ${location.name || "Unnamed Location"}\n`;
            if (typeof location.visualDescription === 'string' && location.visualDescription.trim()) {
                markdown += `#### Visual Description\n${location.visualDescription}\n\n`;
            }
            if (typeof location.background === 'string' && location.background.trim()) {
                markdown += `#### Background\n${location.background}\n\n`;
            }
            if (typeof location.extraInfo === 'string' && location.extraInfo.trim()) {
                markdown += `#### Additional Information\n${location.extraInfo}\n\n`;
            }
            markdown += `---\n\n`;
        });
    } else {
        markdown += `This scenario has not specified any locations.\n\n`;
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

function sortEventsByChronology(events: TimelineEvent[]): TimelineEvent[] {
    return [...events].sort((a, b) => {
        // If both events have dates, try to parse and compare them
        if (a.date && b.date) {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            
            // If dates are valid, sort by date
            if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
                return dateA.getTime() - dateB.getTime();
            }
            
            // If dates aren't parseable as Date objects, sort alphabetically
            return a.date.localeCompare(b.date);
        }
        
        // Events with dates come before events without dates
        if (a.date && !b.date) return -1;
        if (!a.date && b.date) return 1;
        
        // If neither has dates, maintain original order (stable sort)
        return 0;
    });
}

function renderEventToMarkdown(event: TimelineEvent): string {
    let markdown = `#### ${event.title}\n`;
    if (!event.includeInStory) {
        markdown += `**(Backstory Event: This event is for reference only, and should not be translated to a chapter)**\n`;
    } else {
        markdown += `**(Story Event)**\n`;
    }
    if (event.description?.trim()) {
        markdown += `${event.description}\n\n`;
    }
    
    if (event.date?.trim()) {
        markdown += `**Date:** ${event.date}\n\n`;
    }
    
    if (event.location?.trim()) {
        markdown += `**Location:** ${event.location}\n\n`;
    }
    
    if (event.charactersInvolved && event.charactersInvolved.length > 0) {
        markdown += `**Characters involved:**\n`;
        event.charactersInvolved.forEach(character => {
            markdown += `* ${character}\n`;
        });
        markdown += '\n';
    }
    
    markdown += '---\n\n';
    return markdown;
}

export function scenarioTimelineToMarkdown(scenario: Scenario): string {
    if (!scenario.timeline || scenario.timeline.length === 0) {
        return '';
    }

    let markdown = `## Timeline & Events\n\n`;

    // Combine and sort all events chronologically
    const sortedEvents = sortEventsByChronology(scenario.timeline);

    // Render events in chronological order with indication of type
    sortedEvents.forEach(event => {
        const eventType = event.includeInStory ? "Story Event" : "Backstory Event";
        markdown += `**(${eventType})**\n`;
        markdown += renderEventToMarkdown(event);
    });

    return markdown;
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
    markdown += scenarioLocationsToMarkdown(scenario);
    markdown += scenarioBackstoryToMarkdown(scenario);
    markdown += scenarioStoryArcToMarkdown(scenario);
    markdown += scenarioScenesToMarkdown(scenario);
    markdown += scenarioTimelineToMarkdown(scenario);
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
    markdown += scenarioLocationsToMarkdown(scenario);
    markdown += scenarioScenesToMarkdown(scenario);
    markdown += scenarioStoryArcToMarkdown(scenario);
    markdown += scenarioTimelineToMarkdown(scenario);
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
    markdown += scenarioLocationsToMarkdown(scenario);
    markdown += scenarioScenesToMarkdown(scenario);
    markdown += scenarioBackstoryToMarkdown(scenario);
    markdown += scenarioTimelineToMarkdown(scenario);
    markdown += renderCustomTabsToMarkdown(scenario);

    return markdown;
}