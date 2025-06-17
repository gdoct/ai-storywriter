# Bug: Chat Completion Proxy display garbled while streaming, but show normal after completion

## Status: FIXED ✅

# Description
When using the chat completion proxy, the response appears garbled during streaming. However, once the streaming is complete, the response displays correctly.

# Steps to Reproduce
1. open the BackStoryTab (frontend/src/components/ScenarioEditor/tabs/BackstoryTab.tsx)
2. initiate a chat completion request ('Generate backstory')
3. observe the response during streaming is garbled. some words are recognizable, but the overall text is not coherent.
4. once the chat completion request is finished, the text suddenly appears normal and coherent.

# Expected Behavior
The response should be coherent and readable during the streaming process, not just after completion.

# Root Cause Analysis
The issue was in multiple streaming functions that incorrectly assumed the callback parameter was always the full accumulated text. However, `streamChatCompletionWithStatus` passes:
- During streaming: incremental text chunks with `isDone = false`
- At completion: full accumulated text with `isDone = true`

Multiple functions were using `.slice(fullText.length)` on incremental chunks, causing garbled text.

# Fix Applied
Fixed all streaming functions to properly handle incremental vs full text:

## Backend (reverted unnecessary changes):
- `backend/llm_services/llm_proxy_controller.py` - reverted to original

## Frontend Functions Fixed:
1. **`frontend/src/services/storyGenerator.ts`**:
   - `generateBackstory` ✅ 
   - `rewriteBackstory` ✅
   - `generateStoryArc` ✅
   - `rewriteStoryArc` ✅
   - `streamPromptCompletionWithStatus` ✅
   - `generateStory` ✅
   - `generateRandomWritingStyle` ✅
   - `generateRandomCharacter` ✅

2. **`frontend/src/services/characterFieldGenerator.ts`**:
   - `generateCharacterField` ✅

3. **`frontend/src/components/ScenarioEditor/common/ChatAgent.tsx`**:
   - Both streaming callback usages ✅

## Pattern Applied:
Changed from:
```typescript
(text) => {
  if (options.onProgress) options.onProgress(text.slice(fullText.length));
  fullText = text;
}
```

To:
```typescript
(text, isDone) => {
  if (isDone) {
    fullText = text;
  } else {
    fullText += text;
    if (options.onProgress) options.onProgress(text);
  }
}
```

# Testing
- ✅ Backend has no Python syntax errors
- ✅ Frontend passes TypeScript type checking
- ✅ All affected tabs should now show proper streaming text:
  - BackStoryTab
  - StoryArcTab  
  - CharactersTab
  - ChatAgent

# further information
this bug was introduced after working on the file llm_services/llm_proxy_controller.py in the backend. it now decodes the result from the streaming response chunks in order to count tokens, and then return the original chunk, but somehow this bug was introduced. we intend to keep the proxy controller unchanged.

# suspected modules
- ~~frontend/src/services/llmService.ts~~ (No changes needed)
- ~~frontend/src/components/ScenarioEditor/tabs/BackstoryTab.tsx~~ (No changes needed)
- ~~backend/llm_services/llm_proxy_controller.py~~ (Reverted)
- frontend/src/services/storyGenerator.ts ✅ FIXED (8 functions)
- frontend/src/services/characterFieldGenerator.ts ✅ FIXED
- frontend/src/components/ScenarioEditor/common/ChatAgent.tsx ✅ FIXED