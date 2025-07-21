# Dynamic Tabs
this feature is a refactoring feature. the goal is to provide a way that tabs can add specify how the data should be formatted for markdown rendering.

this should allow for the scenarioToMarkdown converter to allow custom tabs without knowing about these tabs.

## example:
say we have developed a new tab named "StoryTwists". this tab allows users to define unexpected plot twists in their story. the data provided by this tab could include a list of twists, each with a description and potential impact on the story.

the "StoryTwists" tab could specify its data format as follows:

```json
{
    "twists": [
        {
            "description": "The protagonist discovers a hidden talent.",
            "impact": "This revelation changes the course of the story."
        },
        {
            "description": "A trusted ally betrays the protagonist.",
            "impact": "This betrayal leads to a major conflict."
        }
    ]
}
```

the scenarioToMarkdown converter would then use this format to render the data from the "StoryTwists" tab in a consistent manner, without needing to know the specifics of the tab's implementation.