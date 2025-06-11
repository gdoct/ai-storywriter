# AI Status State Variable Not Used Correctly

We implemented a feature to ensure only one AI request can be sent at a time, by using an AiStatusContext. But it's not used correctly.

## Reproduction Scenario
* Click on "generate backstory" in the BackstoryTab
* The AI starts generating a backstory
* The "generate story" button in the ReadingPane is still enabled
* The footer still says "ai available"

## Expected Behavior
* The "generate story" button in the ReadingPane should be disabled when the AI is busy
* The footer should say "ai busy" when the AI is busy

## Root Cause
- The AiStatusContext is not correctly shared or consumed by all components that need to react to AI status changes.
- The polling and update logic (useAiStatusPolling, llmService) may not be updating the context or its consumers properly.

## Steps to Fix

1. **Ensure a Single AiStatusContext Provider**
   - Wrap both the ScenarioWriter tab components and the ReadingPane component with a single AiStatusContext provider at a high enough level in the component tree.

2. **Correctly Consume AiStatusContext**
   - In the ReadingPane and ScenarioWriter tab components, use the AiStatusContext to determine if the AI is busy.
   - Disable the "generate story" button in ReadingPane when AI is busy.
   - Update the footer to show "ai busy" when appropriate.

3. **Update AI Status on Request Start/End**
   - In the llmService (or wherever AI requests are made), update the AiStatusContext state to "busy" when a request starts and "available" when it completes.

4. **Ensure useAiStatusPolling Updates Context**
   - The useAiStatusPolling hook should update the AiStatusContext state based on polling results.

5. **Test the Integration**
   - Verify that starting any AI operation disables all relevant buttons and updates the footer.
   - Ensure the status returns to "available" when the operation completes.

## Verification Checklist
- [ ] A single AiStatusContext is wrapped around the ScenarioWriter tab components and the ReadingPane component
- [ ] The ai status is updated correctly by the polling behavior in useAiStatusPolling hook
- [ ] The AiStatusContext provides the ai status correctly to its children
- [ ] The ai status is updated correctly when a request is sent and when it completes (in the llmService)
- [ ] The AiStatusContext is used correctly in the ScenarioWriter tab components and the ReadingPane component
- [ ] The "generate story" button in the ReadingPane is disabled when AI is busy
- [ ] The footer displays "ai busy" when AI is busy
