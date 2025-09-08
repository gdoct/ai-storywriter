import { ExpandableTabs } from '@drdata/ai-styles';
import React, { useCallback, useEffect, useRef } from 'react';
import { FaBook, FaCog, FaEye, FaRedo, FaSave, FaStickyNote, FaTrash, FaUser, FaUsers, FaCopy } from 'react-icons/fa';
import { FaLocationDot } from 'react-icons/fa6';
import { MdSchedule } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useModals } from '../../../shared/hooks/useModals';
import { createScenario, deleteScenario, updateScenario } from '../../../shared/services/scenario';
import { generateStory } from '../../../shared/services/storyGenerator';
import { getStoriesByScenario, saveStory } from '../../../shared/services/storyService';
import { Scenario } from '../../../shared/types/ScenarioTypes';
import { isInsufficientCreditsError, showUserFriendlyErrorWithModals } from '../../../shared/utils/errorHandling';
import { AlertModal, ConfirmModal } from '../../../shared/components/Modal';
import { ActionButtonItem, ActionButtons } from './common/ActionButtons';
import { CharacterBadge } from './common/CharacterBadge';
import { ChatAgent } from '../ChatAgent/ChatAgent';
import { LlmSettingsMenu } from './common/LlmSettingsMenu';
import { useScenarioEditor } from './context';
import { StoryModal } from './modals/StoryModal';
import './ScenarioEditor.css';
import { BackstoryTab } from './tabs/BackstoryTab';
import { CharactersTab } from './tabs/CharactersTab';
import { CustomPromptTab } from './tabs/CustomPromptTab';
import { FillInTab } from './tabs/FillInTab';
import { GeneralTab } from './tabs/GeneralTab';
import { LocationsTab } from './tabs/LocationsTab';
import { NotesTab } from './tabs/NotesTab';
import { StoryArcTab } from './tabs/StoryArcTab';
import { TimelineTab } from './tabs/TimelineTab';
import { SaveOptions, TabConfig, TabId } from './types';
import { tabHasData } from './utils/tabUtils';

// Tab configuration
const tabs: TabConfig[] = [
  {
    id: 'general',
    label: 'General',
    icon: FaBook,
    component: GeneralTab,
    className: 'scenario-editor__general-tab',
    optional: false, // General tab is always required

  },
  {
    id: 'characters',
    label: 'Characters',
    icon: FaUsers,
    component: CharactersTab,
    optional: true,
  },
  {
    id: 'locations',
    label: 'Locations',
    icon: FaLocationDot,
    component: LocationsTab,
    optional: true,
  },
  {
    id: 'backstory',
    label: 'Backstory',
    icon: FaUser,
    component: BackstoryTab,
    optional: true,
  },
  {
    id: 'storyarc',
    label: 'Story Arc',
    icon: FaEye,
    component: StoryArcTab,
    optional: true,
  },
  {
    id: 'fillin',
    label: 'Fill-In Story',
    icon: FaBook,
    component: FillInTab,
    optional: true,
  },
  {
    id: 'notes',
    label: 'Notes',
    icon: FaStickyNote,
    component: NotesTab,
    optional: true,
  },
  {
    id: 'customprompt',
    label: 'Custom Prompts',
    icon: FaCog,
    component: CustomPromptTab,
    optional: true,
  },
  {
    id: 'timeline',
    label: 'Timeline & Events',
    icon: MdSchedule,
    component: TimelineTab,
    optional: true,
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
  onClose: _onClose,
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
        timeline: [],
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

  // Get the active tab component
  const activeTabConfig = tabs.find(tab => tab.id === state.activeTab);
  const ActiveTabComponent = activeTabConfig?.component;

  const handleTabAdd = useCallback((tabId: TabId) => {
    dispatch({ type: 'ADD_TAB', payload: tabId });
  }, [dispatch]);

  const handleTabRemove = useCallback(async (tabId: TabId) => {
    // Don't allow removing the general tab
    if (tabId === 'general') {
      return;
    }

    // Check if tab has data and confirm removal
    if (tabHasData(state.scenario, tabId)) {
      const tabConfig = tabs.find(t => t.id === tabId);
      const tabName = tabConfig?.label || tabId;
      
      const confirmed = await customConfirm(
        `The ${tabName} tab contains data. Closing it won't delete the data, but the tab will be hidden. Are you sure?`,
        {
          title: `Close ${tabName} Tab`,
          confirmText: 'Close Tab',
          cancelText: 'Keep Tab',
          variant: 'default'
        }
      );

      if (!confirmed) {
        return;
      }
    }

    dispatch({ type: 'REMOVE_TAB', payload: tabId });
  }, [state.scenario, dispatch, customConfirm]);

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
    dispatch({ type: 'SET_STORY_THINKING', payload: '' }); // Clear existing thinking
    dispatch({ type: 'SET_STORY_SAVED', payload: false }); // Reset saved status

    try {
      let accumulatedText = '';
      let _thinkingText = '';
      const { result, cancelGeneration } = await generateStory(state.scenario, {
        onProgress: (newTextChunk) => {
          // Accumulate the new text chunk
          accumulatedText += newTextChunk;
          dispatch({ type: 'SET_GENERATED_STORY', payload: accumulatedText });
        },
        onThinking: (thinking) => {
          console.log('ScenarioEditor onThinking received:', thinking); // Debug log
          _thinkingText = thinking;
          dispatch({ type: 'SET_STORY_THINKING', payload: thinking });
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
  }, [state.scenario, dispatch, customAlert, customConfirm]);

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
        await saveStory(state.scenario, state.generatedStory);
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
  }, [state.generatedStory, state.scenario, dispatch]);

  const handleCloseStoryModal = useCallback(() => {
    dispatch({ type: 'SET_SHOW_STORY_MODAL', payload: false });
  }, [dispatch]);

  const handleCancelGeneration = useCallback(() => {
    if (cancelGenerationRef.current) {
      cancelGenerationRef.current();
      // The finally block in handleRegenerateStory will handle cleanup
    }
  }, []);

  // Note: ActiveTabComponent is now handled within ExpandableTabs content

  // Configure action button items
  const actionButtonItems: ActionButtonItem[] = [
    {
      id: 'generate-story',
      label: state.generatedStory ? 'View Story' : 'Generate Story',
      icon: <FaEye />,
      onClick: handleShowStory,
      disabled: state.isLoading || state.scenario.id === '',
      className: 'scenario-editor__generate-story-button',
      title: state.isLoading ? 'Scenario is loading' : state.scenario.id === '' ? 'Please save the scenario first' : 'View or generate scenario',
      'data-testid': 'showStoryButton'
    },
    {
      id: 'reload',
      label: 'Reload',
      icon: <FaRedo />,
      onClick: handleReloadScenario,
      disabled: state.isSaving || state.isLoading,
      loading: state.isSaving
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <FaTrash />,
      onClick: handleDeleteScenario,
      disabled: state.isSaving || state.isLoading,
      loading: state.isSaving,
      variant: 'danger' as const
    },
    {
      id: 'save-as',
      label: 'Save As',
      icon: <FaCopy />,
      onClick: handleSaveAs,
      disabled: state.isSaving || state.isLoading,
      loading: state.isSaving
    },
    {
      id: 'save',
      label: 'Save',
      icon: <FaSave />,
      onClick: () => handleSave(),
      disabled: state.isSaving || state.isLoading,
      loading: state.isSaving,
      variant: 'primary' as const,
      className: 'scenario-editor__save-button'
    }
  ];

  return (
    <div className="scenario-editor">
      <div className="scenario-editor__header">
        <div className="scenario-editor__header-content">
          {/* Row 1: App Title */}
          <div className="scenario-editor__header-title-row">
            <div className="scenario-editor__app-title" data-testid="scenarioeditor-title">SCENARIO EDITOR</div>
            <div className="scenario-editor__header-actions">
              <ActionButtons
                items={actionButtonItems}
                className="scenario-editor__action-buttons"
                disabled={state.isLoading}
              />
              <LlmSettingsMenu
                className="scenario-editor__llm-settings"
                disabled={state.isLoading}
              />
            </div>
          </div>

          {/* Row 2: Image and Story Title */}
          <div className="scenario-editor__header-main-row">
            <div className="scenario-editor__image-container">
              {state.scenario.imageUrl ? (
                <img
                  src={state.scenario.imageUrl}
                  alt={state.scenario.title || 'Scenario'}
                  className="scenario-editor__scenario-image"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    e.currentTarget.style.display = 'none';
                    const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                    if (placeholder) placeholder.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="scenario-editor__image-placeholder"
                style={{ display: state.scenario.imageUrl ? 'none' : 'flex' }}
              >
                <div className="scenario-editor__placeholder-content">
                  No Image
                </div>
              </div>
            </div>
            <h1 className="scenario-editor__story-title">
              {state.scenario.title || 'Untitled Story'}
              {state.isDirty && <span className="scenario-editor__dirty-indicator"> *</span>}
            </h1>
          </div>

          {/* Row 3: Character Badges (if any) */}
          {state.scenario.characters && state.scenario.characters.length > 0 && (
            <div className="scenario-editor__header-characters-row">
              <CharacterBadge characters={state.scenario.characters} />
            </div>
          )}
        </div>
      </div>

      <div className="scenario-editor__content">
        <div className="scenario-editor__tabs-wrapper">
          <ExpandableTabs
            tabs={tabs}
            activeTab={state.activeTab}
            onTabChange={handleTabChange}
            visibleTabs={state.visibleTabs}
            onTabAdd={handleTabAdd}
            onTabRemove={handleTabRemove}
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
        thinking={state.storyThinking}
        onRegenerate={handleRegenerateStory}
        onSaveStory={handleSaveStory}
        onCancelGeneration={handleCancelGeneration}
        isGenerating={state.isGenerating}
        isStorySaved={state.isStorySaved}
        title={state.scenario.title}
        scenario={state.scenario}
        coverImage={state.scenario.imageUrl}
      />

      {/* Chat Agent */}
      <ChatAgent 
        scenario={state.scenario} 
        onScenarioUpdate={(updatedScenario: Scenario) => {
          dispatch({ type: 'UPDATE_SCENARIO', payload: updatedScenario });
        }}
      />

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
