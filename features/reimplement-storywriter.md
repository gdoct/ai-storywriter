# Feature: Reimplement ScenarioWriter Component

## 1. Overview

This document outlines the plan to reimplement the `ScenarioWriter` component. The primary goals are to modernize the user interface (UI), enhance the user experience (UX), improve maintainability, and streamline the workflow for creating and editing story scenarios.

## 2. Current Functionality

The existing `ScenarioWriter` component features a two-pane layout:
*   **Left Pane**: A tabbed interface providing editing tools for various aspects of the story scenario.
*   **Right Pane**: A reading pane displaying the generated story text.

The current editing tabs include:
*   **Save Tab**: Contains "Save" and "Save As" buttons, along with fields for editing the story's title and synopsis.
*   **Story Style Tab**: Allows users to define the story's style, genre, tone, etc. Includes options for randomizing individual fields or the entire style.
*   **Characters Tab**: Provides tools for creating and managing characters, including their names, ages, genders, and personality traits.
*   **Backstory Tab**: Offers functionality to edit, generate, or rewrite the scenario's backstory, detailing key events and character motivations.
*   **Story Arc Tab**: Includes tools for outlining and modifying the story arc, covering major plot points and character development.
*   **Settings Tab**: Contains settings related to AI backend selection (intended for removal or restriction for regular users in the future).

## 3. Reimplementation Plan

The reimplementation will involve creating new components within the `src/components/ScenarioEditor` directory, replacing the old ones. The focus will be on a more intuitive and visually appealing design consistent with the application's dashboard and marketing pages.

### 3.1. Core UI/UX Enhancements

*   **Modernized Tabbed Interface (Left Pane)**:
    *   Redesigned tabs with clear icons and labels for improved navigation and aesthetics.
    *   Visual style aligned with the application's overall design language.
*   **Interactive Reading Pane (Modal)**:
    *   The generated story text will be displayed in a modal window.
    *   The existing `StoryReader` component should be leveraged for this.
    *   Enhanced formatting, typography, and readability.
    *   A prominent "Regenerate Story" button to update the story based on current scenario parameters.
    *   Option to easily copy or export the story text.
*   **Global Save Functionality**:
    *   "Save" and "Save As" buttons will be persistently visible and accessible, regardless of the active tab (e.g., in a top bar or a fixed footer within the editor).
*   **Title and Synopsis Editing**:
    *   Relocate title and synopsis editing to a more intuitive location, potentially within the "Story Style" tab or a dedicated "General Info" section.
*   **Consistent UI Elements**:
    *   Utilize standardized custom components (e.g., `AIGenerateInput`, buttons, form fields, modals) throughout the `ScenarioWriter` to ensure visual consistency and reusability.
*   **State Management & User Feedback**:
    *   Clear visual indicators for unsaved changes (dirty state).
    *   Loading indicators during AI generation or saving processes.
    *   Improved error message display for issues like generation failures or validation errors.

### 3.2. Tab-Specific Improvements (Proposed)

While maintaining core functionality, each tab will be redesigned for better workflow and clarity:

*   **Story Style / General Tab**:
    *   Streamlined layout for style, genre, tone inputs.
    *   Enhanced randomization and generation suggestions.
    *   Could incorporate story title and synopsis fields here.
*   **Characters Tab**:
    *   Improved interface for adding, editing, and deleting characters.
    *   Consider options for more detailed character profiles (e.g., relationships, goals, flaws).
    *   Visual cues or summaries for each character.
*   **Backstory Tab**:
    *   More interactive tools for generating or refining backstory elements.
    *   Clearer separation between key events, character motivations, and world-building details.
*   **Story Arc / Plot Tab**:
    *   More visual or structured approach to outlining plot points (e.g., using cards, a timeline, or a tree structure).
    *   Easier reordering and editing of plot elements.
    *   Tools to link plot points to character arcs.

### 3.3. New Potential Features

*   **Undo/Redo Functionality**: Implement undo/redo capabilities for text inputs and structural changes within the scenario editor.
*   **Scenario Templates**: Allow users to save their current scenario setup as a template or load predefined templates for common genres/structures.
*   **Inline AI Assistance**: Beyond dedicated generation buttons, explore contextual AI suggestions or rewriting tools within text fields.
*   **Progressive Disclosure**: For complex sections, show essential fields by default and allow users to expand for more advanced options.

### 3.4. Technical Considerations

*   **Component Structure**: New components will reside in `frontend/src/components/ScenarioEditor/`. Sub-directories for each major feature or tab are recommended (e.g., `ScenarioEditor/Tabs/StoryStyleTab.tsx`, `ScenarioEditor/common/`).
*   **State Management**: Ensure robust state management for the scenario data, possibly using existing state management solutions in the frontend.
*   **API Integration**: Maintain compatibility with existing backend APIs for saving, loading, and generating story content.
*   **Responsiveness**: Design the new interface to be responsive and usable across different screen sizes.
*   **Accessibility (a11y)**: Adhere to accessibility best practices (e.g., keyboard navigation, ARIA attributes, sufficient color contrast).

### 3.5. Out of Scope for Initial Reimplementation (Future Considerations)

*   Real-time collaboration features.
*   Advanced version history for scenarios.
*   Settings management for regular users (if the current "Settings" tab is entirely removed, any user-facing preferences would need a new home, potentially outside the ScenarioWriter).

## 4. Success Metrics

*   Improved user feedback on ease of use and satisfaction.
*   Reduced time to create a complete scenario.
*   Fewer UI-related bugs and support requests.
*   Positive reception of the new design and workflow.

## 5. High-Level Work Items

This section outlines the major work items required to implement the `ScenarioWriter` reimplementation.

1.  **Project Setup & Foundational Components**:
    *   **Directory Structure**: Establish the new directory structure under `frontend/src/components/ScenarioEditor/`.
    *   **Core UI Kit**: Develop or adapt generic, reusable UI components (e.g., `Button`, `Input`, `Modal`, `Tab`, `Icon`) that align with the new design language. This includes the `AIGenerateInput` if it needs modification or is to be heavily used.
    *   **State Management Strategy**: Define and implement the state management approach for the `ScenarioEditor` (e.g., using React Context, Redux, Zustand, or existing patterns). This includes managing form data, AI generation states, loading states, and error states.
    *   **Types and Interfaces**: Define TypeScript types and interfaces for scenario data, component props, and API payloads related to the `ScenarioEditor`.

2.  **Core `ScenarioEditor` Shell & Navigation**:
    *   **Main Layout Component**: Create the main `ScenarioEditor` component that will house the tabbed interface and manage the display of the story reading modal.
    *   **Tab Navigation System**: Implement the redesigned tab navigation. Ensure it's dynamic and can easily accommodate the different editor sections.
    *   **Story Reader Modal Integration**: Integrate the `StoryReader` component within a modal, triggered from the `ScenarioEditor`. Ensure data passing for story text and regeneration calls.
    *   **Global Save/Save As Functionality**: Implement the persistent "Save" and "Save As" buttons and their underlying logic, including API calls and user feedback.
    *   **Title/Synopsis Input Handling**: Design and implement the new UI for editing story title and synopsis.

3.  **Individual Tab/Feature Implementation**:
    *   For each of the following tabs, the work involves creating the specific UI, managing its local state, handling user interactions, and integrating with AI generation/data update logic:
        *   **Story Style / General Tab**:
            *   UI for style, genre, tone, etc.
            *   Logic for randomization and AI generation of style elements.
            *   Integration of title/synopsis fields if moved here.
        *   **Characters Tab**:
            *   UI for character list display, creation, editing, and deletion forms.
            *   Logic for managing an array of character objects.
            *   AI generation for character details.
        *   **Backstory Tab**:
            *   UI for backstory text input, editing, and generation.
            *   Integration with AI services for rewriting or generating backstory.
        *   **Story Arc / Plot Tab**:
            *   UI for outlining plot points (e.g., list, cards, or a more visual structure).
            *   Logic for adding, editing, reordering, and deleting plot points.
            *   AI assistance for plot point generation or development.

4.  **Cross-Cutting Concerns & Enhancements**:
    *   **Dirty State Management**: Implement robust detection of unsaved changes across all editable fields and provide clear visual feedback to the user.
    *   **Loading & Feedback Indicators**: Integrate consistent loading spinners or messages during API calls (saving, generation) and provide clear success/error notifications.
    *   **Error Handling**: Implement comprehensive error handling for API request failures, validation errors, and AI generation issues, displaying user-friendly messages.
    *   **Undo/Redo (Basic)**: Investigate and implement basic undo/redo for text input fields as a stretch goal if time permits for the initial release.

5.  **Integration, Testing & Refinement**:
    *   **API Integration**: Ensure all frontend components correctly interact with the relevant backend API endpoints for fetching, saving, and generating scenario data.
    *   **Unit & Integration Testing**: Write unit tests for individual components and their logic. Write integration tests for workflows involving multiple components and API interactions.
    *   **End-to-End (E2E) Testing**: Perform E2E testing of the complete `ScenarioWriter` user flows.
    *   **Accessibility (a11y) Audit & Implementation**: Review and implement accessibility best practices (keyboard navigation, ARIA attributes, contrasts).
    *   **Responsive Design**: Test and refine the UI for responsiveness across common screen sizes.
    *   **Code Review & Refactoring**: Conduct code reviews and refactor as needed to ensure code quality, maintainability, and performance.

6.  **Documentation (Internal)**:
    *   Document new complex components, state management decisions, and any non-obvious logic for future maintainers.