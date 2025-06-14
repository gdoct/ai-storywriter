import React, { createContext, useContext, useReducer } from 'react';
import { ScenarioEditorAction, ScenarioEditorState } from './types';

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
  isDirty: false,
  isLoading: false,
  isSaving: false,
  isGenerating: false,
  errors: {},
  showStoryModal: false,
  generatedStory: null,
  isStorySaved: false,
};

// Reducer function
function scenarioEditorReducer(
  state: ScenarioEditorState,
  action: ScenarioEditorAction
): ScenarioEditorState {
  switch (action.type) {
    case 'SET_SCENARIO':
      return {
        ...state,
        scenario: action.payload,
        isDirty: false,
        errors: {},
      };

    case 'UPDATE_SCENARIO':
      return {
        ...state,
        scenario: { ...state.scenario, ...action.payload },
        isDirty: true,
      };

    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        activeTab: action.payload,
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
