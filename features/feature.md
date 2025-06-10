# Feature: Split System Message from Prompt

## Overview

Currently, prompts for the LLM service are generated as a single string. To improve flexibility and clarity, we will separate the system message from the user prompt. This allows us to provide additional context or instructions to the model via a dedicated system message, while keeping the user’s input distinct.

## New Message Format

Requests to the backend will now use a `messages` array, where the system and user messages are separate objects:

```json
"messages": [
  {
    "role": "system",
    "content": "You are a helpful assistant."
  },
  {
    "role": "user",
    "content": "Why is the sky blue?"
  }
]
```

This is encapsulated in the following TypeScript interface:

```ts
export interface llmCompletionRequestMessage {
  systemMessage?: string;
  userMessage?: string;
}
```

## Scope

- The backend already supports this format; only frontend changes are required.
- All prompt generation and LLM service calls in the frontend must be updated to use the new format.
- The old format should no longer be supported.

---

## Implementation Plan

### 1. Type Definitions
- The `llmCompletionRequestMessage` interface is already defined and exported in a shared types file ( `src/types/LLMTypes.ts`).

### 2. Refactor Prompt Generation
- In `llmPromptService.ts`:
  - Refactor all prompt generation functions to return an object of type `llmCompletionRequestMessage` instead of a single string.
  - Ensure both `systemMessage` and `userMessage` are set appropriately.

### 3. Update LLM Service Calls
- In `llmService.ts`:
  - Update the `streamChatCompletion` and `chatCompletion` functions to accept a `llmCompletionRequestMessage` object.
  - Construct the `messages` array for the backend request using the separate `systemMessage` and `userMessage` fields.
  - Remove support for the old single-string prompt format.

### 4. Update All Usages
- Search the codebase for all usages of `streamChatCompletion` and `chatCompletion`.
- Update all callers to use the new `llmCompletionRequestMessage` format.
- Ensure that any UI components or tests that previously relied on the old prompt format are updated to handle the new structure.
- This includes updating any frontend components that display or send prompts to the LLM service.
### 5. Testing
- Run type checks (`npm run typecheck`) to ensure type safety.
- Manually test the UI to verify that prompts are sent in the new format and responses are handled correctly.

### 6. Documentation
- Update any relevant documentation or comments to reflect the new prompt structure.

---

## Summary Table

| Step | File(s) Affected                | Description                                      |
|------|--------------------------------|--------------------------------------------------|
| 1    | `src/types/LLMTypes.ts`              | Define/export `llmCompletionRequestMessage`       |
| 2    | `llmPromptService.ts`           | Refactor prompt generation                       |
| 3    | `llmService.ts`                 | Update LLM service functions                     |
| 4    | All frontend files using LLM    | Update all usages and tests                      |
| 5    | N/A                            | Typecheck, test, and verify                      |
| 6    | Docs/comments                   | Update documentation                             |
