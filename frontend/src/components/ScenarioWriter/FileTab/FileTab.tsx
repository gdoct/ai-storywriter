import React, { useEffect, useRef, useState } from 'react';
import { Scenario } from '../../../types/ScenarioTypes';
import {
  confirmDeleteScenario as confirmDeleteScenarioService,
  fetchScenarios as fetchScenariosService,
  handleCancelSwitch as handleCancelSwitchService,
  handleDiscardAndLoad as handleDiscardAndLoadService,
  handleSaveAndLoad as handleSaveAndLoadService,
  loadScenario as loadScenarioService
} from '../common/scenarioTabService';
import '../common/TabStylesNew.css';
import '../common/TabStylesRandom.css';
import '../common/TabStylesSpinner.css';
import '../common/ToggleButtonStyles.css';
import FileTabActions from './FileTabActions';
import FileTabModals from './FileTabModals';
import {
  confirmNewScenarioService,
  confirmRenameScenarioService as confirmRenameScenarioLogic,
  confirmSaveAsService,
  handleCreateNewScenarioService,
  handleGenerateRandomScenarioService,
  handleRandomizeScenarioService,
  handleRenameScenarioService,
  handleSaveAsScenarioService,
} from './fileTabService';
import ScenarioDropdown from './ScenarioDropdown';

interface FileTabProps {
  currentScenario: Scenario | null;
  isDirty: boolean;
  onLoadScenario: (scenario: Scenario, generatedStory?: string | null) => void;
  onSaveScenario: (scenario: Scenario) => void;
  onNewScenario: (title: string) => void;
  onSwitchTab?: (tabId: string) => void;
  onSaveComplete?: () => void; // <-- Added
}

const FileTab: React.FC<FileTabProps> = ({ 
  currentScenario, 
  isDirty, 
  onLoadScenario, 
  onSaveScenario, 
  onNewScenario,
  onSwitchTab,
  onSaveComplete // <-- Added
}) => {
  const [scenarios, setScenarios] = useState<{id: string, title: string, synopsis: string}[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(currentScenario?.id || '');
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [pendingScenarioId, setPendingScenarioId] = useState<string>('');
  const [showTitleInput, setShowTitleInput] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [showSaveAsInput, setShowSaveAsInput] = useState(false);
  const [saveAsTitle, setSaveAsTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showRenameInput, setShowRenameInput] = useState(false);
  const [renameTitle, setRenameTitle] = useState('');
  const [scenarioToDelete, setScenarioToDelete] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Random scenario generation states
  const [showRandomScenarioModal, setShowRandomScenarioModal] = useState(false);
  const [randomScenarioOptions, setRandomScenarioOptions] = useState({
    generateStyle: true,
    generateBackstory: true,
    generateCharacters: true,
    generateStoryArc: true
  });
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const [randomScenarioName, setRandomScenarioName] = useState('');
  const [generationCancelHandler, setGenerationCancelHandler] = useState<(() => void) | null>(null);
  
  // Fetch scenarios on component mount
  useEffect(() => {
    fetchScenariosService(setScenarios);
  }, []);

  // Update selected scenario when currentScenario changes
  useEffect(() => {
    if (currentScenario?.id) {
      setSelectedScenarioId(currentScenario.id);
    }
  }, [currentScenario]);
  
  // Handle clicks outside of dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load the selected scenario when selectedScenarioId changes
  useEffect(() => {
    if (!selectedScenarioId || (currentScenario && selectedScenarioId === currentScenario.id)) {
      return;
    }
    if (isDirty) {
      setPendingScenarioId(selectedScenarioId);
      setShowSaveConfirm(true);
    } else {
      loadScenarioService(
        selectedScenarioId,
        onLoadScenario,
        setShowConfirm,
        setShowSaveConfirm,
        setIsDropdownOpen
      );
    }
  }, [selectedScenarioId, currentScenario, isDirty, onLoadScenario]);

  // Patch: ensure onSaveScenario is always async for service compatibility
  const onSaveScenarioAsync = async (scenario: Scenario) => {
    await Promise.resolve(onSaveScenario(scenario));
  };

  const handleSaveAndLoad = async () => {
    await handleSaveAndLoadService(
      currentScenario,
      onSaveScenarioAsync,
      pendingScenarioId,
      (id) => loadScenarioService(id, onLoadScenario, setShowConfirm, setShowSaveConfirm, setIsDropdownOpen),
      setPendingScenarioId
    );
  };

  const handleDiscardAndLoad = () => {
    handleDiscardAndLoadService(
      pendingScenarioId,
      (id) => loadScenarioService(id, onLoadScenario, setShowConfirm, setShowSaveConfirm, setIsDropdownOpen),
      setPendingScenarioId,
      setShowSaveConfirm
    );
  };

  const handleCancelSwitch = () => {
    handleCancelSwitchService(
      currentScenario,
      setSelectedScenarioId,
      setPendingScenarioId,
      setShowSaveConfirm
    );
  };

  // Replace handleCreateNewScenario with service call
  const handleCreateNewScenario = () =>
    handleCreateNewScenarioService({
      isDirty,
      setConfirmAction,
      setShowConfirm,
      setShowTitleInput,
      scenarios,
      setNewTitle,
    });

  // Replace handleRandomizeScenario with service call
  const handleRandomizeScenario = () =>
    handleRandomizeScenarioService({
      isDirty,
      setConfirmAction,
      setShowConfirm,
      currentScenario,
      setShowRandomScenarioModal,
    });

  // Replace handleRenameScenario with service call
  const handleRenameScenario = () =>
    handleRenameScenarioService({
      currentScenario,
      setShowRenameInput,
      setRenameTitle,
    });

  // Replace handleSaveAsScenario with service call
  const handleSaveAsScenario = () =>
    handleSaveAsScenarioService({
      setShowSaveAsInput,
      setSaveAsTitle,
      currentScenario,
    });

  // Replace confirmNewScenario with service call
  const confirmNewScenario = async () =>
    confirmNewScenarioService({
      newTitle,
      setErrorMessage,
      onNewScenario,
      setShowTitleInput,
      fetchScenarios,
    });

  // Replace confirmSaveAs with service call
  const confirmSaveAs = async () =>
    confirmSaveAsService({
      saveAsTitle,
      setErrorMessage,
      scenarios,
      currentScenario,
      onSaveScenario,
      setShowSaveAsInput,
      fetchScenarios,
      onSaveComplete,
    });

  // Replace confirmRenameScenario with service call
  const confirmRenameScenario = async () =>
    currentScenario &&
    confirmRenameScenarioLogic(
      currentScenario,
      renameTitle,
      scenarios,
      setErrorMessage,
      onLoadScenario,
      setShowRenameInput,
      fetchScenarios
    );

  // Fix: call handleGenerateRandomScenarioService directly (no fileTabService. prefix)
  const handleGenerateRandomScenario = async (extraInstructions: string) =>
    handleGenerateRandomScenarioService({
      extraInstructions,
      currentScenario,
      setIsGeneratingScenario,
      setGenerationProgress,
      setRandomScenarioName,
      setGenerationCancelHandler,
      randomScenarioOptions,
      onLoadScenario,
      onSwitchTab,
      setShowRandomScenarioModal,
    });

  // Cancel the random scenario generation process
  const handleCancelRandomGeneration = () => {
    if (generationCancelHandler) {
      generationCancelHandler();
      setGenerationCancelHandler(null);
    }
    setIsGeneratingScenario(false);
    setShowRandomScenarioModal(false);
  };
  
  // Fix: fetchScenarios wrapper must be defined before use in handlers
  const fetchScenarios = () => fetchScenariosService(setScenarios);

  // Add missing handleSaveScenario (was lost in refactor)
  const handleSaveScenario = async () => {
    if (!currentScenario) return;
    try {
      await onSaveScenario(currentScenario);
      if (onSaveComplete) onSaveComplete();
    } catch (error) {
      console.error('Failed to save scenario:', error);
    }
  };

  // Add missing handleDeleteRequest and confirmDeleteScenario
  const handleDeleteRequest = (id: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    setScenarioToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteScenario = async () => {
    await confirmDeleteScenarioService(
      scenarioToDelete,
      currentScenario,
      onLoadScenario,
      setSelectedScenarioId,
      setShowDeleteConfirm,
      fetchScenarios
    );
  };

  return (
    <div className="tab-container scenario-editor-panel">
      <div className="scenario-tab-title">
        Manage Scenarios
      </div>
      <FileTabModals
        showConfirm={showConfirm}
        setShowConfirm={setShowConfirm}
        confirmAction={confirmAction}
        showSaveConfirm={showSaveConfirm}
        handleCancelSwitch={handleCancelSwitch}
        handleDiscardAndLoad={handleDiscardAndLoad}
        handleSaveAndLoad={handleSaveAndLoad}
        showTitleInput={showTitleInput}
        setShowTitleInput={setShowTitleInput}
        confirmNewScenario={confirmNewScenario}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        errorMessage={errorMessage}
        setErrorMessage={setErrorMessage}
        showSaveAsInput={showSaveAsInput}
        setShowSaveAsInput={setShowSaveAsInput}
        confirmSaveAs={confirmSaveAs}
        saveAsTitle={saveAsTitle}
        setSaveAsTitle={setSaveAsTitle}
        showRenameInput={showRenameInput}
        setShowRenameInput={setShowRenameInput}
        confirmRenameScenario={confirmRenameScenario}
        renameTitle={renameTitle}
        setRenameTitle={setRenameTitle}
        showRandomScenarioModal={showRandomScenarioModal}
        setShowRandomScenarioModal={setShowRandomScenarioModal}
        currentScenario={currentScenario}
        onLoadScenario={onLoadScenario}
        isGeneratingScenario={isGeneratingScenario}
        generationProgress={generationProgress}
        randomScenarioName={randomScenarioName}
        handleGenerateRandomScenario={handleGenerateRandomScenario}
        handleCancelRandomGeneration={handleCancelRandomGeneration}
        randomScenarioOptions={randomScenarioOptions}
        setRandomScenarioOptions={setRandomScenarioOptions}
        showDeleteConfirm={showDeleteConfirm}
        setShowDeleteConfirm={setShowDeleteConfirm}
        confirmDeleteScenario={confirmDeleteScenario}
      />
      <div className="tab-actions file-tab-actions">
        <div className="scenario-card">
          <div className="form-field">
            <div>Load Scenario:</div>
            <ScenarioDropdown
              scenarios={scenarios}
              selectedScenarioId={selectedScenarioId}
              setSelectedScenarioId={setSelectedScenarioId}
              isDropdownOpen={isDropdownOpen}
              setIsDropdownOpen={setIsDropdownOpen}
              dropdownRef={dropdownRef}
              handleDeleteRequest={handleDeleteRequest}
            />
          </div>
          <FileTabActions
            handleRandomizeScenario={handleRandomizeScenario}
            handleCreateNewScenario={handleCreateNewScenario}
            handleSaveScenario={handleSaveScenario}
            handleSaveAsScenario={handleSaveAsScenario}
            handleRenameScenario={handleRenameScenario}
            currentScenario={currentScenario}
            isDirty={isDirty}
          />
        </div>
      </div>
    </div>
  );
};

export default FileTab;
