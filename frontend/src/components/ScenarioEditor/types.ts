import React from 'react';
import { Scenario } from '../../types/ScenarioTypes';

// Tab identifiers
export type TabId = 'general' | 'characters' | 'backstory' | 'storyarc' | 'notes' | 'worldbuilding' | 'timeline';

// Tab configuration interface
export interface TabConfig {
  id: TabId;
  label: string;
  icon: any;
  component: React.ComponentType<TabProps>;
  className?: string;
  optional?: boolean; // Whether this tab can be closed/hidden (general tab is always required)
}

// Common props for all tab components
export interface TabProps {
  scenario: Scenario;
  onScenarioChange: (updates: Partial<Scenario>) => void;
  isDirty: boolean;
  isLoading: boolean;
}

// State management types
export interface ScenarioEditorState {
  scenario: Scenario;
  activeTab: TabId;
  visibleTabs: TabId[]; // Track which tabs are currently visible
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  isGenerating: boolean;
  errors: Record<string, string>;
  showStoryModal: boolean;
  generatedStory: string | null;
  isStorySaved: boolean;
}

// Action types for state management
export type ScenarioEditorAction =
  | { type: 'SET_SCENARIO'; payload: Scenario }
  | { type: 'DELETE_SCENARIO'; payload: Scenario }
  | { type: 'UPDATE_SCENARIO'; payload: Partial<Scenario> }
  | { type: 'SET_ACTIVE_TAB'; payload: TabId }
  | { type: 'SET_VISIBLE_TABS'; payload: TabId[] }
  | { type: 'ADD_TAB'; payload: TabId }
  | { type: 'REMOVE_TAB'; payload: TabId }
  | { type: 'SET_DIRTY'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_GENERATING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: { field: string; message: string } }
  | { type: 'CLEAR_ERROR'; payload: string }
  | { type: 'CLEAR_ALL_ERRORS' }
  | { type: 'SET_SHOW_STORY_MODAL'; payload: boolean }
  | { type: 'SET_GENERATED_STORY'; payload: string | null }
  | { type: 'SET_STORY_SAVED'; payload: boolean };

// Save options
export interface SaveOptions {
  asNew?: boolean;
  title?: string;
}
