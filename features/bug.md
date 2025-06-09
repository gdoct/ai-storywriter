# bugs
there are three similar bugs, all related to the model selection in the frontend, probably with the same root cause.

## chat request not including the selected model
- **Issue**: When making a chat request in the frontend, the selected model is not included in the request.
- **Expected Behavior**: The request should include the selected model.
Instead, the model is either set to blank or 'gemma3:4b'.
The frontend does this when calling the function 'streamChatCompletion' in frontend/src/services/llmService.ts.
It gets the model information therough functions in the module frontend/src/services/llmBackend.ts, which in turn gets the model information from the backend.

## default model displayed is not the user-selected model
The frontend also persistently displays a model in the Footer component frontend/src/components/Footer/Footer.tsx. This may be the default model, but it is not the model that the user has selected in the settings tab (frontend/src/pages/Settings.tsx).
- **Steps to Reproduce**:
  1. Select a model in the frontend.
  2. Make a chat request.
  3. Check the request payload.

## selected model is not retained in the settings page
- **Issue**: When navigating to the settings page, the selected model is not retained.
This is because the dropdown is empty, because the model list has not been loaded yet from the ai service.
- **Expected Behavior**: The selected model should be retained and displayed in the settings page. 