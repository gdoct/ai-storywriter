# Feature: Graceful Handling of AI Backend HTTP 409 Conflict Errors

## 1. Overview

This feature implements a robust mechanism within the frontend application to handle HTTP 409 Conflict errors originating from the AI chat completion API. These errors occur when the AI backend, which supports only a single client connection at a time, receives a new request while already processing one. The goal is to inform the user gracefully and manage application state accordingly.

## 2. Background & Context

The AI backend is designed to serve one client request at a time for chat completion tasks. If a second client (or a new request from the same client before a previous one completes) attempts to use the AI service, the backend responds with an HTTP 409 Conflict error.

Currently, the frontend does not have specific handling for this scenario, which can lead to a confusing user experience. This feature aims to:

- Proactively inform users about the AI backend's availability.
- Clearly communicate when the AI backend is busy due to a 409 conflict.
- Prevent users from attempting AI-powered actions when the backend is known to be busy or unavailable.

This feature affects only the **frontend application**. The backend's behavior of returning a 409 error is considered correct and will not be changed.

## 3. Goals

- Implement polling for AI backend status.
- Provide a visual indicator of the AI backend's connection status.
- Disable AI-related UI elements when the backend is busy or unavailable.
- Display a user-friendly modal message when an AI operation fails due to a 409 Conflict error.
- Centralize AI backend status management for easy access by various components.

## 4. User Stories

- **As a user,** I want to see the current status of the AI backend (e.g., available, busy, offline) so I know if I can use AI features.
- **As a user,** if I try to use an AI feature while the backend is busy with another request, I want to be clearly informed via a modal that the AI is busy and I should try again later, instead of seeing a generic error or no feedback.
- **As a user,** I want AI-powered buttons (not their input fields) to be disabled if the AI backend is busy or unavailable, with a clear indication of why they are disabled, so I don't waste time trying to use them.

## 5. Functional Requirements

1. **AI Backend Status Polling:**
   - The frontend shall periodically poll a new backend endpoint `/proxy/llm/v1/status` to get the current status of the AI backend.
   - The polling interval should be configurable (e.g., every 5 seconds).
2. **Global AI Status State:**
   - A global state shall be maintained in the frontend to store the AI backend's status (e.g., `idle`, `busy`, `unavailable`, `error`).
   - This state should be updated based on the polling results and direct API call outcomes.
3. **Status Indicator:**
   - The `Footer` component shall display a visual status light indicating the AI backend's current state:
     - Green: AI is `idle` and available.
     - Yellow/Orange: AI is `busy`.
     - Red: AI is `unavailable` or an `error` occurred during status check.
4. **UI Element Disabling:**
   - All UI elements (buttons, input fields) that trigger AI generation tasks shall be disabled if the AI backend status is `busy`, `unavailable`, or `error`.
   - When disabled due to AI status, these elements should provide a visual cue (e.g., tooltip, animation, or an adjacent icon) explaining that the AI is busy or unavailable.
5. **409 Conflict Modal:**
   - When an API call to an AI generation endpoint (e.g., chat completion) returns an HTTP 409 Conflict error:
     - The global AI status shall be updated to `busy`.
     - A modal dialog shall be displayed to the user with a message like: "The AI is currently busy with another request. Please try again in a few moments."
     - The modal should be dismissible by the user.
    - When an API call to an AI generation endpoint (e.g., chat completion) completes without encountering a 409 Conflict error, the global AI status should be updated to `idle` or `available`, and the modal should not be shown.
6. **Error Handling in Services:**
   - The `llmService` (or equivalent service interacting with the AI backend) shall be updated to:
     - Handle HTTP 409 errors specifically for AI generation calls.
     - Handle other potential network or HTTP errors gracefully, updating the global AI status to `error` or `unavailable` as appropriate.

## 6. Technical Design & Implementation Plan

This implementation will primarily involve changes in the `frontend` project, specifically within React components, services, and potentially introducing a new context for state management.

**Affected Files/Modules (Potential):**

- `frontend/src/services/llmService.ts` (or similar)
- `frontend/src/components/Footer/Footer.tsx`
- Any components containing AI generation buttons/triggers.
- `frontend/src/App.tsx` or a top-level component for context provider setup.

**New Files/Modules (Potential):**

- `frontend/src/contexts/AIStatusContext.tsx` (or a similar state management solution like Zustand store)
- `frontend/src/components/Modals/AIBusyModal.tsx`

**Implementation Steps:**

**Step 1: Define AI Status State and Context/Store**

- **File:** `frontend/src/contexts/AIStatusContext.tsx` (or integrate into existing state management)
- **Details:**
  - Define an enum or string literals for AI status: `AI_STATUS = { IDLE: 'idle', BUSY: 'busy', UNAVAILABLE: 'unavailable', ERROR: 'error', LOADING: 'loading' }`.
  - Create a React Context or a state slice (e.g., with Zustand) to hold:
    - `aiStatus: AI_STATUS` (default to `LOADING` or `UNAVAILABLE` initially)
    - `setAiStatus: (status: AI_STATUS) => void`
    - `showAIBusyModal: boolean`
    - `setShowAIBusyModal: (show: boolean) => void`
    - `lastError: string | null` (for storing generic error messages if needed)
  - Provide this context at a high level in the component tree (e.g., in `App.tsx`).

**Step 2: Implement AI Backend Status Polling in `llmService`**

- **File:** `frontend/src/services/llmService.ts`
- **Details:**
  - Create a new function `fetchAIBackendStatus(): Promise<AI_STATUS>`.
    - This function calls `GET /proxy/llm/v1/status`.
    - Based on the response (or lack thereof), it should determine the status:
      - Successful response (e.g., 200 OK with a specific body indicating availability): `AI_STATUS.IDLE`.
      - Successful response (e.g., 200 OK with a specific body indicating busy): `AI_STATUS.BUSY`.
      - 409 Conflict on status endpoint (if possible, though less likely for a status check): `AI_STATUS.BUSY`.
      - Other errors (5xx, network error, timeout): `AI_STATUS.UNAVAILABLE` or `AI_STATUS.ERROR`.
  - In a React hook (e.g., `useAIStatusPolling.ts`) or a top-level component's `useEffect`:
    - Use `setInterval` to call `fetchAIBackendStatus` periodically (e.g., every 10 seconds).
    - On each successful fetch, update the global `aiStatus` using `setAiStatus` from the context.
    - Handle errors during polling and update `aiStatus` to `ERROR` or `UNAVAILABLE`.
    - Ensure the interval is cleared on component unmount.
    - Perform an initial status fetch on application load.

**Step 3: Update `llmService` for 409 Error Handling in AI Calls**

- **File:** `frontend/src/services/llmService.ts`
- **Details:**
  - Modify existing functions that make calls to AI generation endpoints (e.g., `getChatCompletion(prompt: string)`).
  - In the `catch` block for these API calls:
    - Check if the error is an HTTP error and if `error.response.status === 409`.
    - If it's a 409:
      - Call `setAiStatus(AI_STATUS.BUSY)`.
      - Call `setShowAIBusyModal(true)`.
      - Optionally, re-throw a custom error or return a specific marker that the component can use to know it was a 409.
    - For other errors, update `setAiStatus(AI_STATUS.ERROR)` and potentially set `lastError`.

**Step 4: Create the `AIBusyModal` Component**

- **File:** `frontend/src/components/Modals/AIBusyModal.tsx`
- **Details:**
  - A simple modal component (using your project's modal library or a new one).
  - It should display a message like: "The AI service is currently busy processing another request. Please try again in a few moments."
  - It should have a "Close" or "OK" button.
  - Its visibility will be controlled by `showAIBusyModal` from the `AIStatusContext`.
  - When closed, it should call `setShowAIBusyModal(false)`.
  - Render this modal conditionally in `App.tsx` or a layout component based on the context state.

**Step 5: Update `Footer` Component for Status Light**

- **File:** `frontend/src/components/Footer/Footer.tsx`
- **Details:**
  - Consume `aiStatus` from `AIStatusContext`.
  - Render a small colored circle or icon:
    - Green if `aiStatus` is `IDLE`.
    - Yellow/Orange if `aiStatus` is `BUSY` or `LOADING`.
    - Red if `aiStatus` is `UNAVAILABLE` or `ERROR`.
  - Optionally, add a tooltip to the status light to show the exact status text (e.g., "AI: Busy").

**Step 6: Update Components with AI Generation Buttons/Triggers**

- **Files:** Various components that use AI features.
- **Details:**
  - Consume `aiStatus` from `AIStatusContext`.
  - For each button/input related to AI:
    - Set the `disabled` prop to `true` if `aiStatus` is `BUSY`, `UNAVAILABLE`, `ERROR`, or `LOADING`.
    - Add a `title` attribute or a tooltip (e.g., using a tooltip library) that explains why it's disabled when the AI status is the cause. Examples:
      - "AI is currently busy. Please try again later."
      - "AI is unavailable. Please check connection or try again later."
      - "Checking AI status..."

**Step 7: Styling and UX**

- Ensure all new UI elements (status light, modal, disabled states) are styled according to the application's design system.
- Ensure clear visual feedback for all states.

**Step 8: Testing**

- Manually test all scenarios:
  - AI available -> AI features enabled, green light.
  - AI busy (simulated by backend or by triggering a long request and then another) -> AI features disabled, yellow light, modal on 409.
  - AI unavailable (simulated by stopping backend or network issues) -> AI features disabled, red light.
  - Polling updates the status correctly.
- Consider writing unit/integration tests for:
  - `llmService` error handling and status updates.
  - `AIStatusContext` state changes.
  - Component rendering based on `aiStatus`.


## 7. Non-Functional Requirements

- **Responsiveness:** The modal and status indicators should be responsive.
- **Performance:** Polling should not significantly degrade frontend performance. The interval should be reasonable.
- **Usability:** Error messages and status indicators must be clear and easily understandable by non-technical users.

## 8. Acceptance Criteria

- When the application loads, the AI backend status is fetched, and the status light in the footer reflects this.
- The AI backend status is polled periodically, and the status light updates accordingly.
- If an AI generation API call results in a 409 Conflict error:
  - An "AI Busy" modal is displayed to the user.
  - The AI status light in the footer changes to "busy" (e.g., yellow/orange).
  - Relevant AI feature buttons are disabled.
- If the AI backend status is `busy`, `unavailable`, or `error`:
  - AI feature buttons are disabled.
  - A visual cue (e.g., tooltip, animation) explains why the buttons are disabled.
- The status light correctly reflects `idle` (green), `busy` (yellow/orange), and `unavailable`/`error` (red) states.
- The system gracefully handles other network errors when trying to communicate with the AI backend, updating the status to `unavailable` or `error`.

## 9. Out of Scope

- Changes to the backend API behavior.
- Automatic retry mechanisms for 409 errors (beyond informing the user to try again manually).
- Detailed logging of these errors on the frontend (basic console logging is acceptable).

## 10. Open Questions/Considerations

- What is the exact polling interval desired? (Defaulting to 5 seconds, but can be adjusted).
- What are the exact response bodies/status codes from `/proxy/llm/v1/status` for different states (idle, busy)? This needs to be confirmed for accurate status mapping.
- Are there any specific UI libraries or patterns for modals and tooltips that must be used?
