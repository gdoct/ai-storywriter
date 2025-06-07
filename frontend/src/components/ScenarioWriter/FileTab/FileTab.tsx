import React, { useEffect, useRef, useState } from 'react';
import { generateBackstory, generateRandomCharacter, generateRandomScenarioName, generateRandomWritingStyle, generateStoryArc } from '../../../services/storyGenerator';
import { Scenario } from '../../../types/ScenarioTypes';
import ActionButton from '../../common/ActionButton';
import CreateScenarioModal from '../tabs/CreateScenarioModal';
import DeleteScenarioModal from '../tabs/DeleteScenarioModal';
import RandomScenarioModal from '../tabs/RandomScenarioModal';
import RenameScenarioModal from '../tabs/RenameScenarioModal';
import SaveAsModal from '../tabs/SaveAsModal';
import SaveChangesModal from '../tabs/SaveChangesModal';
import {
  confirmDeleteScenario as confirmDeleteScenarioService,
  confirmRenameScenario as confirmRenameScenarioService,
  fetchScenarios as fetchScenariosService,
  handleCancelSwitch as handleCancelSwitchService,
  handleDiscardAndLoad as handleDiscardAndLoadService,
  handleSaveAndLoad as handleSaveAndLoadService,
  loadScenario as loadScenarioService
} from '../tabs/scenarioTabService';
import '../tabs/TabStylesNew.css';
import '../tabs/TabStylesRandom.css';
import '../tabs/TabStylesSpinner.css';
import '../tabs/ToggleButtonStyles.css';
import UnsavedChangesModal from '../tabs/UnsavedChangesModal';

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

  const handleCreateNewScenario = () => {
    const createAction = () => {
      setShowTitleInput(true);
      setShowConfirm(false);
      
      // Generate a default title
      let defaultTitle = "new story";
      const existingTitles = scenarios.map(s => s.title || '');
      
      if (existingTitles.includes(defaultTitle)) {
        let counter = 1;
        while (existingTitles.includes(`${defaultTitle} (${counter})`)) {
          counter++;
        }
        defaultTitle = `${defaultTitle} (${counter})`;
      }
      
      setNewTitle(defaultTitle);
    };

    if (isDirty) {
      setConfirmAction(() => createAction);
      setShowConfirm(true);
    } else {
      createAction();
    }
  };

  // Open the random scenario generation modal
  const handleRandomizeScenario = () => {
    const openAction = () => {
      // Check if there is a current scenario to randomize
      if (!currentScenario) {
        alert('Please create or select a scenario first.');
        return;
      }
      
      setShowRandomScenarioModal(true);
      setShowConfirm(false);
    };

    if (isDirty) {
      setConfirmAction(() => openAction);
      setShowConfirm(true);
    } else {
      openAction();
    }
  };

  // Start the random scenario generation process
  const handleGenerateRandomScenario = async (extraInstructions: string) => {
    try {
      // Make sure we have a current scenario to modify
      if (!currentScenario) {
        alert('No active scenario to randomize.');
        setShowRandomScenarioModal(false);
        return;
      }

      setIsGeneratingScenario(true);
      
      // Create a working copy of the current scenario to modify
      const updatedScenario = { ...currentScenario };
      
      // Step 1: Keep the existing name unless specifically requested to change it
      const shouldGenerateNewName = extraInstructions.includes("rename") || 
                                    extraInstructions.includes("new title") || 
                                    extraInstructions.includes("new name");
      
      if (shouldGenerateNewName) {
        setGenerationProgress('Generating scenario name...');
        const nameGenerationResult = await generateRandomScenarioName({
          onProgress: (text: string) => {
            setRandomScenarioName(text);
          }
        });
        
        setGenerationCancelHandler(() => nameGenerationResult.cancelGeneration);
        
        try {
          const name = await nameGenerationResult.result;
          updatedScenario.title = name;
          setRandomScenarioName(name);
        } catch (error) {
          console.error('Error generating scenario name:', error);
          // Keep existing name if generation fails
        }
      } else {
        setRandomScenarioName(updatedScenario.title || 'Current Scenario');
      }
      
      // Step 2: Generate writing style if selected
      if (randomScenarioOptions.generateStyle) {
        setGenerationProgress('Generating writing style...');
        
        const styleGenerationResult = await generateRandomWritingStyle({
          onProgress: (text: string) => {
            setGenerationProgress('Generating writing style...\n' + text);
          }
        });
        
        setGenerationCancelHandler(() => styleGenerationResult.cancelGeneration);
        
        try {
          const style = await styleGenerationResult.result;
          updatedScenario.writingStyle = style;
        } catch (error) {
          console.error('Error generating writing style:', error);
          if (!updatedScenario.writingStyle) {
            updatedScenario.writingStyle = { genre: 'General Fiction' };
          }
        }
      }
      
      // Step 3: Generate protagonist character if selected
      if (randomScenarioOptions.generateCharacters) {
        setGenerationProgress('Generating protagonist character...');
        
        const characterGenerationResult = await generateRandomCharacter(
          updatedScenario,
          'protagonist',
          {
            onProgress: (text: string) => {
              setGenerationProgress('Generating protagonist character...\n' + text);
            }
          }
        );
        
        setGenerationCancelHandler(() => characterGenerationResult.cancelGeneration);
        
        try {
          const character = await characterGenerationResult.result;
          console.log('Generated protagonist character:', JSON.stringify(character, null, 2));
          character.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
          updatedScenario.characters = [character]; // Replace existing characters
          
          // Generate an antagonist character
          setGenerationProgress('Generating antagonist character...');
          
          const antagonistGenerationResult = await generateRandomCharacter(
            updatedScenario,
            'antagonist',
            {
              onProgress: (text: string) => {
                setGenerationProgress('Generating antagonist character...\n' + text);
              }
            }
          );
          
          setGenerationCancelHandler(() => antagonistGenerationResult.cancelGeneration);
          
          try {
            const antagonist = await antagonistGenerationResult.result;
            console.log('Generated antagonist character:', JSON.stringify(antagonist, null, 2));
            antagonist.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
            updatedScenario.characters.push(antagonist);
          } catch (error) {
            console.error('Error generating antagonist character:', error);
            console.error('Antagonist generation error details:', error);
          }
        } catch (error) {
          console.error('Error generating protagonist character:', error);
        }
      }
      
      // Step 4: Generate backstory if selected
      if (randomScenarioOptions.generateBackstory) {
        setGenerationProgress('Generating backstory...');
        
        // Add basic extra instruction processing if provided
        if (extraInstructions) {
          // Add a custom note to help guide the backstory generation
          updatedScenario.notes = `Extra instructions for generation: ${extraInstructions}`;
        }
        
        try {
          const backstoryResult = await generateBackstory(updatedScenario, {
            onProgress: (generatedText) => {
              // Update the progress and scenario as it's generating
              setGenerationProgress('Generating backstory...\n' + generatedText);
              updatedScenario.backstory = generatedText;
            }
          });
          
          // Wait for the generation to complete
          const generatedBackstory = await backstoryResult.result;
          updatedScenario.backstory = generatedBackstory;
          
        } catch (error) {
          console.error('Error generating backstory:', error);
          updatedScenario.backstory = "Error generating backstory.";
        }
      }
      
      // Step 5: Generate story arc if selected
      if (randomScenarioOptions.generateStoryArc) {
        setGenerationProgress('Generating story arc...');
        
        try {
          const storyArcResult = await generateStoryArc(updatedScenario, {
            onProgress: (generatedText) => {
              // Update the progress and scenario as it's generating
              setGenerationProgress('Generating story arc...\n' + generatedText);
              updatedScenario.storyarc = generatedText;
            }
          });
          
          // Wait for the generation to complete
          const generatedStoryArc = await storyArcResult.result;
          updatedScenario.storyarc = generatedStoryArc;
          
        } catch (error) {
          console.error('Error generating story arc:', error);
          updatedScenario.storyarc = "Error generating story arc.";
        }
      }
      
      // Update the UI with the randomized scenario (without saving to backend)
      setGenerationProgress('Updating scenario...');
      
      // Update the UI with the randomized scenario
      onLoadScenario(updatedScenario);
      
      // Keep the modal open to show the completed state
      // The user will close it using the "Close" button
      // setShowRandomScenarioModal(false);
      
      // Switch to the Story Style tab if the callback is available
      if (onSwitchTab) {
        onSwitchTab('main');
      }
      
    } catch (error) {
      console.error('Error randomizing scenario:', error);
      alert('There was an error while randomizing the scenario. Please try again.');
    } finally {
      setIsGeneratingScenario(false);
      setGenerationCancelHandler(null);
    }
  };
  
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

  const confirmNewScenario = async () => {
    if (!newTitle.trim()) {
      setErrorMessage('Title cannot be empty');
      return;
    }
    try {
      await onNewScenario(newTitle.trim());
      setShowTitleInput(false);
      fetchScenarios(); // Refresh the list
    } catch (error) {
      console.error('Failed to create new scenario:', error);
      setErrorMessage('Failed to create scenario');
    }
  };

  const handleSaveScenario = async () => {
    if (!currentScenario) return;
    
    try {
      await onSaveScenario(currentScenario);
      if (onSaveComplete) onSaveComplete(); // <-- Notify parent to reset isDirty
    } catch (error) {
      console.error('Failed to save scenario:', error);
    }
  };

  const handleSaveAsScenario = () => {
    setShowSaveAsInput(true);
    setSaveAsTitle(currentScenario?.title || '');
  };

  const confirmSaveAs = async () => {
    if (!saveAsTitle.trim()) {
      setErrorMessage('Title cannot be empty');
      return;
    }
    if (scenarios.some(s => s.title === saveAsTitle && s.id !== currentScenario?.id)) {
      setErrorMessage('A scenario with this title already exists');
      return;
    }
    try {
      if (currentScenario) {
        const updatedScenario = { ...currentScenario, title: saveAsTitle.trim(), id: '' };
        await onSaveScenario(updatedScenario);
        setShowSaveAsInput(false);
        fetchScenarios(); // Refresh the list
        if (onSaveComplete) onSaveComplete(); // <-- Notify parent to reset isDirty
      }
    } catch (error) {
      console.error('Failed to save scenario as:', error);
      setErrorMessage('Failed to save scenario');
    }
  };

  // Add function to handle renaming a scenario
  const handleRenameScenario = () => {
    if (!currentScenario) return;
    setShowRenameInput(true);
    setRenameTitle(currentScenario.title || '');
  };

  // Add function to handle deleting a scenario
  const handleDeleteRequest = (id: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation(); // Prevent the click from also selecting the scenario
    }
    setScenarioToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmRenameScenario = async () => {
    await confirmRenameScenarioService(
      currentScenario,
      renameTitle,
      scenarios,
      setErrorMessage,
      onLoadScenario,
      setShowRenameInput,
      fetchScenarios
    );
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
      <UnsavedChangesModal
        show={showConfirm}
        onClose={() => setShowConfirm(false)}
        onContinue={confirmAction}
      />

      <SaveChangesModal
        show={showSaveConfirm}
        onClose={handleCancelSwitch}
        onDiscard={handleDiscardAndLoad}
        onSave={handleSaveAndLoad}
      />

      <CreateScenarioModal
        show={showTitleInput}
        onClose={() => {
          setShowTitleInput(false);
          setErrorMessage('');
        }}
        onCreate={confirmNewScenario}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        errorMessage={errorMessage}
      />

      <SaveAsModal
        show={showSaveAsInput}
        onClose={() => {
          setShowSaveAsInput(false);
          setErrorMessage('');
        }}
        onSave={confirmSaveAs}
        saveAsTitle={saveAsTitle}
        setSaveAsTitle={setSaveAsTitle}
        errorMessage={errorMessage}
      />

      <RenameScenarioModal
        show={showRenameInput}
        onClose={() => {
          setShowRenameInput(false);
          setErrorMessage('');
        }}
        onRename={confirmRenameScenario}
        renameTitle={renameTitle}
        setRenameTitle={setRenameTitle}
        errorMessage={errorMessage}
      />
      {/* Random Scenario Generation Modal */}
      <RandomScenarioModal 
        show={showRandomScenarioModal}
        onClose={() => setShowRandomScenarioModal(false)}
        currentScenario={currentScenario}
        onLoadScenario={onLoadScenario}
        isGeneratingScenario={isGeneratingScenario}
        generationProgress={generationProgress}
        randomScenarioName={randomScenarioName}
        onGenerateRandomScenario={handleGenerateRandomScenario}
        onCancelGeneration={handleCancelRandomGeneration}
        randomScenarioOptions={randomScenarioOptions}
        setRandomScenarioOptions={setRandomScenarioOptions}
      />

      <DeleteScenarioModal
        show={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onDelete={confirmDeleteScenario}
      />

      <div className="tab-actions file-tab-actions">
        <div className="scenario-card">
          <div className="form-field">
            <div>Load Scenario:</div>
            <div className="scenario-select-wrapper">
              <div className="custom-dropdown" ref={dropdownRef}>
                <button
                  className="dropdown-toggle tab-btn tab-btn-default"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  {selectedScenarioId
                    ? scenarios.find(s => s.id === selectedScenarioId)?.title
                    : "Select a scenario"}
                  <span style={{ marginLeft: 8, color: '#90caf9' }}>▼</span>
                </button>
                {isDropdownOpen && (
                  <div className="dropdown-menu" style={{
                    background: '#23272e',
                    color: '#e6e6e6',
                    border: '1.5px solid #353b45',
                    borderRadius: '10px',
                    boxShadow: '0 6px 24px rgba(0,0,0,0.32)',
                    marginTop: '6px',
                    minWidth: '220px',
                    zIndex: 30,
                  }}>
                    {scenarios.length === 0 && (
                      <div className="dropdown-item disabled" style={{ color: '#888', background: 'none' }}>
                        No scenarios found
                      </div>
                    )}
                    {scenarios.map(scenario => (
                      <div
                        key={scenario.id}
                        className={`dropdown-item ${scenario.id === selectedScenarioId ? 'active' : ''}`}
                        style={{
                          background: scenario.id === selectedScenarioId ? '#353b45' : 'none',
                          color: '#e6e6e6',
                          padding: '12px 18px',
                          cursor: 'pointer',
                          fontWeight: scenario.id === selectedScenarioId ? 600 : 500,
                          borderLeft: scenario.id === selectedScenarioId ? '4px solid #61dafb' : '4px solid transparent',
                          transition: 'background 0.15s, color 0.15s',
                        }}
                        onClick={() => {
                          if (scenario.id !== selectedScenarioId) {
                            setSelectedScenarioId(scenario.id);
                          }
                          setIsDropdownOpen(false);
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.background = '#353b45';
                          e.currentTarget.style.color = '#61dafb';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.background = scenario.id === selectedScenarioId ? '#353b45' : 'none';
                          e.currentTarget.style.color = '#e6e6e6';
                        }}
                      >
                        <span>{scenario.title || "(Untitled)"}</span>
                        <button
                          className="card-btn card-btn-delete"
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteRequest(scenario.id);
                          }}
                          title="Delete scenario"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="tab-actions-group">
            <ActionButton
              onClick={handleRandomizeScenario}
              label="✨ Randomize current scenario"
              variant="success"
              title="Completely randomize the current scenario with customizable options"
            />
            <ActionButton
              onClick={handleCreateNewScenario}
              label="Create New Scenario"
              variant="primary"
            />
            <ActionButton
              onClick={handleSaveScenario}
              label="Save Scenario"
              variant="primary"
              className={!currentScenario || !isDirty ? "disabled" : ""}
            />
            <ActionButton
              onClick={handleSaveAsScenario}
              label="Save As..."
              variant="default"
              className={!currentScenario ? "disabled" : ""}
            />
            <ActionButton
              onClick={handleRenameScenario}
              label="Rename"
              variant="default"
              className={!currentScenario || !currentScenario.id ? "disabled" : ""}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileTab;
