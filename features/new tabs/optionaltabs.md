# Optional Tabs Feature Specification

## Overview
Transform the ScenarioEditor from a fixed tab layout to a dynamic, user-configurable tab system where users can add only the tabs they need for their specific story development workflow.

## Current State
- The ScenarioEditor displays all tabs (General, Characters, Backstory, Story Arc, Notes) by default
- All tabs are always visible regardless of whether the user needs them
- Tab configuration is static in `ScenarioEditor.tsx` with fixed `TabConfig[]`
- tabs are stored in a subfolder with the component name, e.g., `frontend/src/components/ScenarioEditor/tabs/WorldBuildingTab/WorldBuildingTab.tsx`
## Proposed Behavior

### Initial State
- **Always visible**: General tab (contains basic story information - title, synopsis, writing style)
- **Hidden by default**: All other tabs (Characters, Backstory, Story Arc, Notes)
- **Auto-open with data**: When loading an existing scenario, automatically open tabs that contain actual data (non-empty strings, non-empty arrays)
- **Visual indicator**: A "+" button appears after the last visible tab

### Adding Tabs
1. **Add Tab Button**: Position a "+" button to the right of the last visible tab
2. **Dropdown Menu**: When clicked, shows available tab types that aren't currently open:
   - Characters (if not added)
   - Backstory (if not added) 
   - Story Arc (if not added)
   - Notes (if not added)
   - Future tabs: World Building, Events, Timeline, etc.
3. **Tab Addition**: Selecting an option immediately adds that tab and makes it active
4. **Persistence**: Tab selection state should be saved with the scenario

### Removing Tabs
- **Close Button**: Each optional tab (except General) should have a small "×" close button
- **Confirmation**: Ask for confirmation if the tab contains content
- **Data Preservation**: Closing a tab doesn't delete the data, just hides the tab
- **Re-adding**: Closed tabs can be re-added via the "+" dropdown

## Implementation Status: ✅ COMPLETED

### ✅ Core Implementation Complete
- **State Management**: Added `visibleTabs: TabId[]` to `ScenarioEditorState` 
- **Auto-detection**: Implemented smart tab detection based on scenario data content
- **Tab Management**: Added `ADD_TAB` and `REMOVE_TAB` actions to context reducer
- **Data Persistence**: Visible tabs are saved with scenario data for consistency
- **UI Components**: Updated `Tabs` component with add button and close functionality

### ✅ Features Implemented
1. **Dynamic Tab Visibility**: Only shows tabs that contain data or are manually added
2. **Add Tab Dropdown**: "+" button with dropdown showing available optional tabs
3. **Remove Tab Functionality**: Close buttons on optional tabs (except General)
4. **Data Preservation**: Closing tabs doesn't delete data, only hides the interface
5. **Confirmation Dialogs**: Warns user when closing tabs that contain data
6. **Smart Auto-Detection**: Automatically opens tabs with existing data when loading scenarios

### ✅ User Experience Enhancements
- **General Tab Always Visible**: Core scenario information always accessible
- **Contextual Tab Addition**: Only shows tabs that aren't already open
- **Visual Feedback**: Clear indicators for add/remove actions
- **Data Safety**: Multiple confirmations prevent accidental data loss

## User Benefits
1. **Cleaner Interface**: Users see only relevant tabs for their workflow
2. **Reduced Cognitive Load**: No need to ignore irrelevant tabs
3. **Flexibility**: Different story types need different tools
4. **Scalability**: Easy to add new optional tabs without cluttering UI
5. **Workflow Optimization**: Users can focus on their preferred writing approach

## Examples Use Cases
- **Dialogue-focused writers**: May only need General + Characters
- **Plot-heavy stories**: General + Story Arc + Notes  
- **Character-driven narratives**: General + Characters + Backstory
- **Minimal setup**: Just General tab for quick story generation

## Future Extensibility
This system enables easy addition of new optional tabs:
- World Building (locations, cultures, magic systems)
- Events & Timeline (chronological planning)
- Themes & Symbols (literary analysis tools)
- Research Notes (reference materials)
- Revision Notes (editing workflow)

The feature transforms the ScenarioEditor from a rigid form into a flexible, adaptive writing tool that grows with user needs.