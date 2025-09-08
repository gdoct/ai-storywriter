# feature : customize prompt tab

this is a new tab for the scenario editor that allows users to customize prompts for different scenarios.
### features
* allow system prompt customization (i.e. "insert this before the system prompt:")
* allow user prompt customization (i.e. "insert this before the user prompt:")
* keywords: specify custom keywords to be used for the story generation (keywords will be inserted after the system prompt)

promptsettings will be a property of the scenario object, and will be an object with the following structure:
```json
{
  "systemPromptPrefix": "string",
  "userPromptPrefix": "string",
  "keywords": "string"
}
```

the logic of this feature will be implemented in the front-end. create a function "createSystemPrompt" that takes in a system prompt and it returns the full system prompt with possible customization. create a similar function for the user prompt. then, everywhere we define a prompt, we will use these functions to generate the final prompt. this way, the customization will be applied consistently across the application. the main candidates are the storyGenerator, the llmPromptService and the llmService

### ux
the customize prompt tab will be implemented just like the other tabs. check the other tabs for reference. the tab will have the following fields:
* system prompt prefix: a text area for the system prompt prefix
* user prompt prefix: a text area for the user prompt prefix
* keywords: a text area for the keywords, comma separated

the import function/button should work just like the other tabs, so it can copy the prompt settings from other scenarios.