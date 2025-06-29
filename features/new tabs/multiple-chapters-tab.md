# Multiple Chapters Tab - Feature Specification

## Overview
The Multiple Chapters tab enables writers to break down their stories into manageable chapters, generate content for each chapter, and maintain narrative coherence across long-form storytelling. This tab provides tools for chapter planning, content generation, synopsis creation, and cross-chapter consistency management.

## Data Structure

The data model is designed to be comprehensive and scalable, capturing everything from high-level structure to the fine-grained details of each chapter version. Instead of full content, the main scenario data will hold references and metadata, with the full text of chapters stored separately to ensure application performance.

### Core Data Models
*   **`ScenarioData.multipleChapters`**: The root object for this feature, containing all chapter-related information for a scenario.
    *   `chapters`: An array of `Chapter` objects.
    *   `chapterStructure`: Defines the overall story structure (e.g., three-act, hero's journey).
    *   `globalSettings`: User preferences for chapter management, like naming conventions and default word counts.
    *   `crossReferences`: A list of connections (e.g., foreshadowing, callbacks) between chapters.
    *   `isDirty`: A boolean flag that is `true` if there are any unsaved changes to chapters, structure, or settings.

*   **`Chapter`**: Represents a single chapter with its planning details, metadata, and content references.
    *   **Key Fields**: `id`, `title`, `number`, `description`, `status` (planned, drafted, finalized), `wordCountTarget`.
    *   **Content**: `generatedVersions` (an array of `ChapterVersion` objects), `selectedVersionId`, `customContent` (for user-written text), and a `synopsis`.
    *   **Planning**: Contains objects for `outline`, `objectives`, `plotPoints`, and `characterArcs`.
    *   **Integrations**: Holds arrays of IDs linking to `Events`, `Characters`, `Locations`, and `Themes` from other tabs.

*   **`ChapterVersion`**: A specific AI-generated or user-edited version of a chapter's text.
    *   **Key Fields**: `id`, `versionNumber`, `content` (the full text), `wordCount`, `status` (generating, complete, archived).
    *   **Generation Details**: Stores the `generationPrompt`, AI model used, and quality scores.

*   **`ChapterSynopsis`**: A summary of a chapter, used for quick reference and as context for the AI.
    *   **Key Fields**: `shortSummary` (1-2 sentences), `detailedSummary` (1-2 paragraphs), `keyEvents`, and `characterDevelopments`.

### Separate Content Storage
To avoid bloating the main scenario object and to optimize performance, the full text of chapter versions will be stored in a separate data structure, likely managed by its own service. The main `ScenarioData` object will only store metadata and an ID to reference the selected version. This separation is critical for handling large stories with many chapters and multiple versions per chapter.

## User Interface Design

### Layout Structure
```
┌─ Multiple Chapters Tab ─────────────────────────────────────┐
│                                                             │
│ ┌─ View Tabs ─────────────────────────────────────────────┐ │
│ │ Overview | Chapters | Structure | Generation | Analysis  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ Chapter Overview ──────────────────────────────────────┐ │
│ │ ┌─ Progress Bar ──────────────────────────────────────┐  │ │
│ │ │ ████████████░░░░ 75% Complete (15/20 chapters)      │  │ │
│ │ └─────────────────────────────────────────────────────┘  │ │
│ │                                                         │ │
│ │ ┌─ Quick Stats ───────────────────────────────────────┐  │ │
│ │ │ 📊 85k/120k words │ ⏱️ 3h read time │ 🎯 85% quality │  │ │
│ │ └─────────────────────────────────────────────────────┘  │ │
│ │                                                         │ │
│ │ ┌─ Chapter List ──────────────────────────────────────┐  │ │
│ │ │ ┌─ Chapter 1: The Beginning ────────────────────────┐ │ │
│ │ │ │ 📝 Finalized │ 4,250 words │ Quality: 9/10      │ │ │
│ │ │ │ [👁️] View [✏️] Edit [🎲] Generate [📊] Analyze │ │ │
│ │ │ └───────────────────────────────────────────────────┘ │ │
│ │ │ ┌─ Chapter 2: The Discovery ────────────────────────┐ │ │
│ │ │ │ 🔄 Generating │ 0/3,800 words │ ETA: 5 minutes   │ │ │
│ │ │ │ [⏸️] Pause [🛑] Stop [⚙️] Settings              │ │ │
│ │ │ └───────────────────────────────────────────────────┘ │ │
│ │ │ ┌─ Chapter 3: The Conflict ─────────────────────────┐ │ │
│ │ │ │ 📋 Planned │ 0/4,100 words │ Outline: 80%       │ │ │
│ │ │ │ [✏️] Plan [🎲] Generate [📋] Outline             │ │ │
│ │ │ └───────────────────────────────────────────────────┘ │ │
│ │ └─────────────────────────────────────────────────────┘  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ Actions ───────────────────────────────────────────────┐ │
│ │ [➕] Add Chapter [📖] Generate All [⚙️] Settings        │ │
│ │ [📤] Export [📊] Full Analysis [🔄] Regenerate Missing  │ │
│ │ [📥] Import from Scenario                              │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Sub-Tabs Navigation
*   **Overview**: A dashboard showing the chapter list, overall progress, and quick actions.
*   **Chapters**: A detailed view for editing a selected chapter's content, outline, and versions.
*   **Structure**: Tools for planning the high-level story structure and organizing chapters.
*   **Generation**: Global settings for AI generation and batch operation controls.
*   **Analysis**: Dashboards for cross-chapter consistency, character arc tracking, and quality metrics.

### Core Feature Requirements
*   **`isDirty` Flag**: The system must track unsaved changes. Any modification—such as adding, editing, deleting, or reordering chapters, or importing content—must set an `isDirty` flag. This flag should trigger a confirmation dialog if the user attempts to navigate away with unsaved changes. The flag is cleared upon a successful save.
*   **Import from Scenario**: Users must be able to import chapters from another scenario. This feature should present a modal where the user can select a scenario and then choose which chapters to import. Imported chapters should be added to the current scenario's chapter list, and the `isDirty` flag must be set.

## Component Architecture

The feature will be built with a modular and scalable component structure, located in `frontend/src/components/ScenarioEditor/tabs/MultipleChaptersTab/`.

### Key Components
*   `MultipleChaptersTab.tsx`: The main container component.
*   `components/ChapterOverview.tsx`: The main dashboard view.
*   `components/ChapterList.tsx`: Renders the list of `ChapterCard` components.
*   `components/ChapterEditor.tsx`: The core editing interface, likely containing a rich text editor and side panels for notes, outline, and versions.
*   `components/ChapterForm.tsx`: A modal form for creating a new chapter or editing its basic properties.
*   `components/ChapterVersions.tsx`: A component to list, compare, and select between different generated versions of a chapter.
*   `hooks/useChapterData.ts`: A custom hook to manage the state and CRUD operations for chapters.
*   `hooks/useChapterGeneration.ts`: A hook to handle all interactions with the AI generation service.

### Service Layer
New services will be created to handle the business logic and API communication:
*   `chaptersService.ts`: Manages CRUD operations for chapter metadata.
*   `chapterContentService.ts`: Manages the storage and retrieval of full chapter text.
*   `chapterGenerationService.ts`: Coordinates with the backend LLM service to generate content, synopses, and outlines.
*   `chapterAnalysisService.ts`: Handles requests for quality scoring and consistency checking.

## LLM Generation Features

### Generation Capabilities
1.  **Chapter Content Generation**: Generate full chapter text from an outline, synopsis, and context from previous chapters.
2.  **Synopsis Generation**: Automatically create short and detailed summaries of a chapter's content.
3.  **Outline Development**: Expand a simple chapter idea into a detailed, scene-by-scene outline.
4.  **Quality Assessment**: Score generated content on criteria like plot coherence, character consistency, and pacing.

### Example Generation Prompts
*   **For Content**: "Generate Chapter {number}: '{title}' based on the following outline: {outline}. The previous chapter ended with {summary_of_previous_chapter}. Ensure the tone is {tone} and the style matches the previous content."
*   **For Synopsis**: "Create a two-sentence summary of the following chapter text, focusing on the main plot progression and character developments: {chapter_content}."
*   **For Quality**: "Evaluate this chapter for plot coherence, character consistency, pacing, and engagement. Provide a score from 1-10 for each and a brief justification."

## Implementation Plan

This feature will be implemented in phases, starting with the core architecture and progressively adding more advanced functionality.

### Phase 0: Architectural Investigation
1.  **Analyze Services**: Examine `scenarioService` and `llmPromptService` to understand existing data flow and AI interaction patterns.
2.  **Review Tab Structure**: Study the implementation of an existing tab (e.g., `CharactersTab`) to determine how to integrate the new tab into the `ScenarioEditor`'s state and navigation.
3.  **Data Flow Analysis**: Map out how chapter data will be loaded, updated (including the `isDirty` state), and saved within the `ScenarioEditor` component. The `isDirty` flag must be set whenever any chapter data is modified (added, edited, deleted, reordered, or imported).
4.  **Component & Style Review**: Examine existing UI components, modals, and styling to ensure the new tab has a consistent look and feel.

### Phase 1: Core Structure & UI
1.  **Define Data Types**: Create the initial TypeScript interfaces for `Chapter`, `ChapterVersion`, and the main `MultipleChapters` data structure in `types/chapters.ts`.
2.  **Implement `useChapterData` Hook**: Develop the custom hook for managing chapter state. Implement local state management for creating, updating, and deleting chapters (without backend integration initially). This hook will be responsible for managing the `isDirty` state.
3.  **Build UI Shell**: Create the `MultipleChaptersTab.tsx` component and the sub-tab navigation structure.
4.  **Create Chapter List**: Implement the `ChapterList` and `ChapterCard` components to display a static list of chapters.
5.  **Add Chapter Form**: Build the `ChapterForm` modal for adding and editing chapter titles and descriptions.
6.  **Integrate Tab**: Add the "Multiple Chapters" tab to the main `ScenarioEditor` configuration so it appears in the UI. Implement the `hasChapterData` auto-detection logic.

### Phase 2: Backend Integration & Basic Content Management
1.  **Develop Backend Services**: Create the `chaptersService` and `chapterContentService` to handle CRUD operations. This includes defining API endpoints and database interactions for storing chapter metadata and content separately.
2.  **Connect Frontend to Backend**: Wire up the `useChapterData` hook to the new services to fetch, save, and delete chapter data from the server. Saving will clear the `isDirty` flag.
3.  **Implement Chapter Editor**: Build the `ChapterEditor` component with a rich text editor (e.g., TipTap, TinyMCE) to view and edit the content of a selected chapter version.
4.  **Version Management UI**: Create the `ChapterVersions` component to list available versions for a chapter and allow the user to select one. Implement the UI to show which version is currently active.

### Phase 3: AI Generation
1.  **Generation Service**: Implement the `chapterGenerationService` on both the frontend and backend to handle requests to the LLM.
2.  **Implement "Generate" Action**: Add a "Generate" button to each chapter card. Clicking it should call the generation service with the appropriate context (outline, previous chapter synopsis) and display the generated content in a new version.
3.  **Synopsis Generation**: After a chapter is generated, automatically trigger a second LLM call to create a synopsis and display it in the UI.
4.  **Display Generation State**: Update the UI to show when a chapter is "Generating..." and handle loading/error states gracefully.

### Phase 4: Advanced Features & Integration
1.  **Import from Scenario**:
    *   **UI**: Add an "Import from Scenario" button. On click, open a modal that allows the user to search for and select another scenario. A second step in the modal will display the chapters from the selected scenario, allowing the user to choose which ones to import.
    *   **Implementation**: The `chaptersService` will need a new method, `importChapters(sourceScenarioId, chapterIds)`. This method will copy the selected chapters and their content into the current scenario. The `useChapterData` hook will be updated to handle appending the new chapters to the state and setting the `isDirty` flag to `true`.
2.  **Cross-Chapter Analysis**:
    *   **UI**: Build the "Analysis" sub-tab with components for displaying consistency warnings.
    *   **Backend**: Create an `chapterAnalysisService` that can take two or more chapters as input and ask an LLM to check for inconsistencies in plot, character behavior, or world-building details.
    *   **Implementation**: The service will read the content of the selected chapters, construct a prompt asking the LLM to act as a continuity editor, and return any identified issues.
3.  **Export Functionality**:
    *   **UI**: Add an "Export" button and a modal with format options (PDF, DOCX, TXT).
    *   **Implementation**: Create an `exportService` that fetches the content of all selected chapters, concatenates them, and uses a library (like `html-to-docx` or `jsPDF`) to generate the downloadable file.
4.  **Integration with Other Tabs**:
    *   **UI**: In the `ChapterEditor`, add UI elements (e.g., searchable dropdowns) to link characters, events, and locations to the chapter.
    *   **Implementation**: Update the `Chapter` data model to store arrays of IDs. When generating a chapter, the context sent to the LLM should include summaries of these linked items to ensure they are incorporated into the narrative.

### Phase 5: Polish and Optimization
1.  **Performance Tuning**:
    *   **Lazy Loading**: Implement lazy loading for the chapter content. The `ChapterList` should only load metadata, and the full content for a chapter should only be fetched when the user clicks to edit it.
    *   **Background Processing**: Move AI generation to a background worker so the user can continue to use the application while chapters are being generated. The UI should poll for status updates.
2.  **Advanced Export Options**: Enhance the export functionality to include custom formatting, title pages, and table of contents.
3.  **Publishing Features**: Add a "Prepare for Publishing" export option that formats the text into a standard manuscript format.

## Future Enhancements

### Advanced Features
*   **Chapter Dependencies**:
    *   **Concept**: Allow users to define explicit relationships between chapters (e.g., "Chapter 5 sets up the reveal in Chapter 12").
    *   **Implementation**: This could be visualized as a node-based graph using a library like `React Flow`. The dependency information would be used to generate consistency warnings (e.g., "You are editing a setup chapter, but the payoff chapter has already been written. Be careful of contradictions.").
*   **Alternative Storylines**:
    *   **Concept**: Support branching narratives where a single chapter can lead to multiple possible next chapters.
    *   **Implementation**: The data structure would need to evolve from a linear array of chapters to a graph or tree structure. The UI would need to visualize these branches, allowing the writer to explore and develop different plot paths simultaneously.
*   **Chapter Templates**:
    *   **Concept**: Provide pre-defined templates for common chapter types (e.g., "Inciting Incident," "Midpoint," "Climax").
    *   **Implementation**: These templates would pre-fill the chapter's outline and objectives with guidance based on narrative theory. A user could select a template when creating a new chapter to get a head start.

### AI Enhancements
*   **Adaptive Generation & Style Matching**:
    *   **Concept**: The AI should learn the user's unique writing style over time.
    *   **Implementation**: After a user edits an AI-generated chapter, the system can perform a `diff` on the text. This `diff` (the user's edits) can be used to fine-tune future generation prompts. For example, if a user consistently changes passive voice to active voice, the system can add "Use active voice" to the generation prompt's instructions.
*   **Predictive Quality Score**:
    *   **Concept**: Before starting a potentially time-consuming generation, the AI could predict the likely quality of the output based on the quality of the input (outline, context).
    *   **Implementation**: This would involve training a smaller, faster model on pairs of (input prompt, output quality score). This model could then provide a quick estimate (e.g., "The provided outline is sparse. The generated chapter may lack detail.") and suggest improvements to the input.
*   **Plot Optimization Suggestions**:
    *   **Concept**: The AI could analyze the entire story structure and suggest improvements.
    *   **Implementation**: The system would send the synopses of all chapters to the LLM with a prompt asking it to analyze the overall pacing, plot structure, and character arcs. The AI could then provide feedback like, "The pacing slows down considerably in the middle chapters. Consider adding a subplot or a rising-conflict event between chapters 8 and 10."
