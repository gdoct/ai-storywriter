import React, { createContext, useContext, useReducer } from 'react';
import { ScenarioEditorAction, ScenarioEditorState } from './types';
import { getDefaultVisibleTabs } from './utils/tabUtils';

// Initial state
const initialState: ScenarioEditorState = {
  scenario: {
    id: '',
    userId: '',
    title: '',
    synopsis: '',
    createdAt: new Date(),
    characters: [],
    scenes: [],
    storyarc: '',
    backstory: '',
    notes: '',
  },
  activeTab: 'general',
  visibleTabs: ['general'], // Start with only the general tab visible
  isDirty: false,
  isLoading: false,
  isSaving: false,
  isGenerating: false,
  errors: {},
  showStoryModal: false,
  generatedStory: null,
  storyThinking: null,
  isStorySaved: false,
};

// Reducer function
function scenarioEditorReducer(
  state: ScenarioEditorState,
  action: ScenarioEditorAction
): ScenarioEditorState {
  switch (action.type) {
    case 'SET_SCENARIO':
      // When setting a scenario, initialize visible tabs based on existing data
      const visibleTabs = getDefaultVisibleTabs(action.payload);
      
      return {
        ...state,
        scenario: action.payload,
        visibleTabs,
        activeTab: visibleTabs.includes(state.activeTab) ? state.activeTab : visibleTabs[0],
        isDirty: false,
        errors: {},
      };

    case 'UPDATE_SCENARIO':
      return {
        ...state,
        scenario: { 
          ...state.scenario, 
          ...action.payload
        },
        isDirty: true,
      };
    case 'DELETE_SCENARIO':
      return {
        ...state,
        scenario: initialState.scenario, // Reset to initial state
        visibleTabs: ['general'], // Reset to default
        activeTab: 'general',
        isDirty: false,
        errors: {},
      };
    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        activeTab: action.payload,
      };

    case 'SET_VISIBLE_TABS':
      return {
        ...state,
        visibleTabs: action.payload,
        // Ensure active tab is visible
        activeTab: action.payload.includes(state.activeTab) ? state.activeTab : action.payload[0],
      };

    case 'ADD_TAB':
      if (state.visibleTabs.includes(action.payload)) {
        return state; // Tab already visible
      }
      return {
        ...state,
        visibleTabs: [...state.visibleTabs, action.payload],
        activeTab: action.payload, // Make the newly added tab active
      };

    case 'REMOVE_TAB':
      if (action.payload === 'general') {
        return state; // Cannot remove general tab
      }
      const newVisibleTabs = state.visibleTabs.filter(tabId => tabId !== action.payload);
      return {
        ...state,
        visibleTabs: newVisibleTabs,
        // If we're removing the active tab, switch to the first visible tab
        activeTab: state.activeTab === action.payload ? newVisibleTabs[0] : state.activeTab,
      };

    case 'SET_DIRTY':
      return {
        ...state,
        isDirty: action.payload,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_SAVING':
      return {
        ...state,
        isSaving: action.payload,
      };

    case 'SET_GENERATING':
      return {
        ...state,
        isGenerating: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.field]: action.payload.message,
        },
      };

    case 'CLEAR_ERROR':
      const { [action.payload]: _, ...remainingErrors } = state.errors;
      return {
        ...state,
        errors: remainingErrors,
      };

    case 'CLEAR_ALL_ERRORS':
      return {
        ...state,
        errors: {},
      };

    case 'SET_SHOW_STORY_MODAL':
      return {
        ...state,
        showStoryModal: action.payload,
      };

    case 'SET_GENERATED_STORY':
      return {
        ...state,
        generatedStory: action.payload,
      };

    case 'SET_STORY_THINKING':
      return {
        ...state,
        storyThinking: action.payload,
      };

    case 'SET_STORY_SAVED':
      return {
        ...state,
        isStorySaved: action.payload,
      };

    default:
      return state;
  }
}

// Context
const ScenarioEditorContext = createContext<{
  state: ScenarioEditorState;
  dispatch: React.Dispatch<ScenarioEditorAction>;
} | null>(null);

// Provider component
export const ScenarioEditorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(scenarioEditorReducer, initialState);

  return (
    <ScenarioEditorContext.Provider value={{ state, dispatch }}>
      {children}
    </ScenarioEditorContext.Provider>
  );
};

// Custom hook to use the context
export const useScenarioEditor = () => {
  const context = useContext(ScenarioEditorContext);
  if (!context) {
    throw new Error(
      'useScenarioEditor must be used within a ScenarioEditorProvider'
    );
  }
  return context;
};
