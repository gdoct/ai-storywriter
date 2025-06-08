# bug: streaming response is not showing in the frontend until completion

# Steps to reproduce
1. Start the application.
2. Log in as "test-user" with no password
3. Navigate to the backstory tab. (this is on all tabs, but the backstory is the simplest to test)
4. Click on the "Generate Backstory" button.
5. Observe that the response is not displayed until the entire generation is complete.
# Expected behavior
The expected behavior is that the frontend should display the streamed response from the backend as it comes in, rather than waiting for the entire generation to complete.
# Actual behavior
The actual behavior is that the frontend does not display the streamed response until the entire generation is complete, which leads to a delay in showing the generated backstory.
# Additional information
The backend is correctly sending the streamed response in chunks, but the frontend is not updating the display until the entire response is received. This could be due to how the frontend handles the incoming SSE (Server-Sent Events) or how it processes and renders the streamed data.