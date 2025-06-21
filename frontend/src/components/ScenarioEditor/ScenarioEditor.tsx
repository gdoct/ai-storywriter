import React, { useCallback, useEffect, useRef } from 'react';
import { FaBook, FaEye, FaRedo, FaSave, FaStickyNote, FaTrash, FaUser, FaUsers } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useModals } from '../../hooks/useModals';
import { createScenario, deleteScenario, updateScenario } from '../../services/scenario';
import { generateStory } from '../../services/storyGenerator';
import { getStoriesByScenario, saveStory } from '../../services/storyService';
import { Scenario } from '../../types/ScenarioTypes';
import { isInsufficientCreditsError, showUserFriendlyErrorWithModals } from '../../utils/errorHandling';
import { AlertModal, ConfirmModal } from '../Modal';
import { Button } from './common/Button';
import { ChatAgent } from './common/ChatAgent';
import { Tabs } from './common/Tabs';
import { useScenarioEditor } from './context';
import { StoryModal } from './modals/StoryModal';
import './ScenarioEditor.css';
import { BackstoryTab } from './tabs/BackstoryTab';
import { CharactersTab } from './tabs/CharactersTab';
import { GeneralTab } from './tabs/GeneralTab';
import { NotesTab } from './tabs/NotesTab';
import { StoryArcTab } from './tabs/StoryArcTab';
import { SaveOptions, TabConfig, TabId } from './types';

// Tab configuration
const tabs: TabConfig[] = [
  {
    id: 'general',
    label: 'General',
    icon: FaBook,
    component: GeneralTab,
    className: 'scenario-editor__general-tab',

  },
  {
    id: 'characters',
    label: 'Characters',
    icon: FaUsers,
    component: CharactersTab,
  },
  {
    id: 'backstory',
    label: 'Backstory',
    icon: FaUser,
    component: BackstoryTab,
  },
  {
    id: 'storyarc',
    label: 'Story Arc',
    icon: FaEye,
    component: StoryArcTab,
  },
  {
    id: 'notes',
    label: 'Notes',
    icon: FaStickyNote,
    component: NotesTab,
  },
];

interface ScenarioEditorProps {
  initialScenario?: Scenario;
  onScenarioSave?: (scenario: Scenario) => void;
  onClose?: () => void;
}

export const ScenarioEditor: React.FC<ScenarioEditorProps> = ({
  initialScenario,
  onScenarioSave,
  onClose,
}) => {
  const { state, dispatch } = useScenarioEditor();
  const { alertState, confirmState, hideAlert, hideConfirm, customAlert, customConfirm } = useModals();
  const navigate = useNavigate();
  const cancelGenerationRef = useRef<(() => void) | null>(null);

  // Reset scroll position when component mounts
  useEffect(() => {
    // Multiple approaches to ensure scroll reset works
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Also try after next render cycle
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);

    // And after a short delay to handle any router animations
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 100);
  }, []);

  // Initialize scenario when component mounts or initialScenario changes
  useEffect(() => {
    if (initialScenario) {
      dispatch({ type: 'SET_SCENARIO', payload: initialScenario });
      // Note: Stories are now loaded separately from the stories table
    } else {
      // Create a new scenario with default values
      const username = localStorage.getItem('username') || 'anonymous';
      const newScenario: Scenario = {
        id: '',
        userId: username,
        title: '',
        synopsis: '',
        createdAt: new Date(),
        characters: [],
        scenes: [],
        storyarc: '',
        backstory: '',
        notes: '',
      };
      dispatch({ type: 'SET_SCENARIO', payload: newScenario });
    }
  }, [initialScenario, dispatch]);

  const handleScenarioChange = useCallback((updates: Partial<Scenario>) => {
    dispatch({ type: 'UPDATE_SCENARIO', payload: updates });
  }, [dispatch]);

  const handleTabChange = useCallback((tabId: TabId) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tabId });
  }, [dispatch]);

  const handleSave = useCallback(async (options: SaveOptions = {}) => {
    dispatch({ type: 'SET_SAVING', payload: true });
    dispatch({ type: 'CLEAR_ALL_ERRORS' });

    try {
      let savedScenario: Scenario;

      if (options.asNew || !state.scenario.id) {
        // Create new scenario
        const scenarioToCreate = {
          ...state.scenario,
          title: options.title || state.scenario.title || 'Untitled Story',
        };
        savedScenario = await createScenario(scenarioToCreate);
      } else {
        // Update existing scenario
        savedScenario = await updateScenario(state.scenario);
      }

      dispatch({ type: 'SET_SCENARIO', payload: savedScenario });
      onScenarioSave?.(savedScenario);
    } catch (error) {
      console.error('Failed to save scenario:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: { field: 'save', message: 'Failed to save scenario. Please try again.' }
      });
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, [state.scenario, dispatch, onScenarioSave]);

  const handleSaveAs = useCallback(() => {
    const title = prompt('Enter a title for the new scenario:', state.scenario.title || '');
    if (title !== null) {
      handleSave({ asNew: true, title });
    }
  }, [state.scenario.title, handleSave]);

  const handleRegenerateStory = useCallback(async () => {
    dispatch({ type: 'SET_GENERATING', payload: true });
    dispatch({ type: 'CLEAR_ALL_ERRORS' });
    dispatch({ type: 'SET_GENERATED_STORY', payload: '' }); // Clear existing story
    dispatch({ type: 'SET_STORY_SAVED', payload: false }); // Reset saved status

    try {
      let accumulatedText = '';
      const { result, cancelGeneration } = await generateStory(state.scenario, {
        onProgress: (newTextChunk) => {
          // Accumulate the new text chunk
          accumulatedText += newTextChunk;
          dispatch({ type: 'SET_GENERATED_STORY', payload: accumulatedText });
        }
      });

      // Store the cancel function
      cancelGenerationRef.current = cancelGeneration;

      const fullStory = await result;
      dispatch({ type: 'SET_GENERATED_STORY', payload: fullStory.completeText });

    } catch (error) {
      console.error('Failed to generate story:', error);
      // Don't show error message for cancellation
      if (error instanceof Error && error.message === 'Generation was cancelled') {
        // Just log that it was cancelled, don't show error to user
        console.log('Story generation was cancelled by user');
      } else {
        // Show the actual error message from the backend
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate story. Please try again.';

        // Check if this is a credit-related error and provide a better experience
        if (error instanceof Error && isInsufficientCreditsError(error)) {
          await showUserFriendlyErrorWithModals(error, 'Story Generation', customAlert, customConfirm);
        } else {
          dispatch({
            type: 'SET_ERROR',
            payload: { field: 'generation', message: errorMessage }
          });
        }
      }
    } finally {
      dispatch({ type: 'SET_GENERATING', payload: false });
      cancelGenerationRef.current = null; // Clear the cancel function
    }
  }, [state.scenario, dispatch]);

  const handleShowStory = useCallback(async () => {
    dispatch({ type: 'SET_SHOW_STORY_MODAL', payload: true });

    // If we have a scenario ID, try to load the most recent story
    if (state.scenario.id && !state.generatedStory) {
      try {
        const stories = await getStoriesByScenario(state.scenario.id);
        if (stories.length > 0) {
          // Load the most recent story
          dispatch({ type: 'SET_GENERATED_STORY', payload: stories[0].content });
          dispatch({ type: 'SET_STORY_SAVED', payload: true });
        }
      } catch (error) {
        console.error('Failed to load existing stories:', error);
      }
    }

    // Note: Removed auto-generation - user must click "Generate Story" button
  }, [dispatch, state.scenario.id, state.generatedStory]);

  const handleDeleteScenario = useCallback(async () => {
    const response = await customConfirm('Are you sure you want to delete this scenario? This action cannot be undone.', {
      title: 'Delete Scenario',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });
    if (!response) return; // User cancelled
    
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Call the delete API
      if (state.scenario.id) {
        await deleteScenario(state.scenario.id);
      }
      dispatch({ type: 'DELETE_SCENARIO', payload: state.scenario });
      
      // Navigate back to dashboard after successful deletion
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to delete scenario:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: { field: 'delete', message: 'Failed to delete scenario. Please try again.' }
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.scenario, dispatch, customConfirm, navigate]);

  const handleReloadScenario = useCallback(() => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ALL_ERRORS' });
    // Reload the scenario from the initial state or API
    if (initialScenario) {
      dispatch({ type: 'SET_SCENARIO', payload: initialScenario });
    } else {
      // If no initial scenario, create a new empty scenario
      const username = localStorage.getItem('username') || 'anonymous';
      const newScenario: Scenario = {
        id: '',
        userId: username,
        title: '',
        synopsis: '',
        createdAt: new Date(),
        characters: [],
        scenes: [],
        storyarc: '',
        backstory: '',
        notes: '',
      };
      dispatch({ type: 'SET_SCENARIO', payload: newScenario });
    }
    dispatch({ type: 'SET_LOADING', payload: false });
  }, [initialScenario, dispatch]);

  const handleSaveStory = useCallback(async () => {
    if (state.generatedStory && state.scenario.id) {
      try {
        await saveStory(state.scenario.id, state.generatedStory);
        // Mark the story as saved
        dispatch({ type: 'SET_STORY_SAVED', payload: true });
        // Close the modal after saving
        dispatch({ type: 'SET_SHOW_STORY_MODAL', payload: false });
      } catch (error) {
        console.error('Failed to save story:', error);
        dispatch({
          type: 'SET_ERROR',
          payload: { field: 'save', message: 'Failed to save story. Please try again.' }
        });
      }
    }
  }, [state.generatedStory, state.scenario.id, dispatch]);

  const handleCloseStoryModal = useCallback(() => {
    dispatch({ type: 'SET_SHOW_STORY_MODAL', payload: false });
  }, [dispatch]);

  const handleCancelGeneration = useCallback(() => {
    if (cancelGenerationRef.current) {
      cancelGenerationRef.current();
      // The finally block in handleRegenerateStory will handle cleanup
    }
  }, []);

  // Get the active tab component
  const activeTabConfig = tabs.find(tab => tab.id === state.activeTab);
  const ActiveTabComponent = activeTabConfig?.component;

  return (
    <div className="scenario-editor">
      <div className="scenario-editor__header">
        <div className="header-content">
          <h1>Scenario Editor</h1>
          <p>{state.scenario.title || 'Untitled Story'}
            {state.isDirty && <span className="dirty-indicator">*</span>}
          </p>
        </div>

        <div className="scenario-editor__actions">
          <Button
            variant="secondary"
            data-test-id="showStoryButton"
            onClick={handleShowStory}
            icon={<FaEye />}
            disabled={state.isLoading}
          >
            View Story
          </Button>
          <Button
            variant="success"
            onClick={handleReloadScenario}
            disabled={state.isSaving || state.isLoading}
            loading={state.isSaving}
            icon={<FaRedo />}
          >
            Reload
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteScenario}
            disabled={state.isSaving || state.isLoading}
            loading={state.isSaving}
            icon={<FaTrash />}
          >
            Delete
          </Button>
          <Button
            variant="secondary"
            onClick={handleSaveAs}
            disabled={state.isSaving || state.isLoading}
            loading={state.isSaving}
            icon={<FaSave />}
          >
            Save As
          </Button>
          <Button
            variant="primary"
            onClick={() => handleSave()}
            disabled={state.isSaving || state.isLoading}
            loading={state.isSaving}
            icon={<FaSave />}
            className='scenario-editor__save-button'
          >
            Save
          </Button>
        </div>
      </div>

      <div className="scenario-editor__content">
        <Tabs
          tabs={tabs}
          activeTab={state.activeTab}
          onTabChange={handleTabChange}
          className="scenario-editor__tabs"
        />

        <div className="scenario-editor__tab-content">
          {ActiveTabComponent && (
            <ActiveTabComponent
              scenario={state.scenario}
              onScenarioChange={handleScenarioChange}
              isDirty={state.isDirty}
              isLoading={state.isLoading}
            />
          )}
        </div>
      </div>

      {/* Error display */}
      {Object.keys(state.errors).length > 0 && (
        <div className="scenario-editor__errors">
          {Object.entries(state.errors).map(([field, message]) => (
            <div key={field} className="scenario-editor__error">
              {message}
            </div>
          ))}
        </div>
      )}

      {/* Story Modal */}
      <StoryModal
        isOpen={state.showStoryModal}
        onClose={handleCloseStoryModal}
        story={state.generatedStory}
        onRegenerate={handleRegenerateStory}
        onSaveStory={handleSaveStory}
        onCancelGeneration={handleCancelGeneration}
        isGenerating={state.isGenerating}
        isStorySaved={state.isStorySaved}
        title={state.scenario.title}
      />

      {/* Chat Agent */}
      <ChatAgent scenario={state.scenario} />

      {/* Custom Modal Components */}
      <AlertModal
        isOpen={alertState.isOpen}
        onClose={hideAlert}
        message={alertState.message}
        title={alertState.title}
      />

      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={hideConfirm}
        onConfirm={confirmState.onConfirm || (() => { })}
        message={confirmState.message}
        title={confirmState.title}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant}
      />
    </div>
  );
};
