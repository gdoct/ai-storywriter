import React, { useEffect, useRef, useState } from 'react';
import { deleteScenario, fetchAllScenarios, fetchGeneratedStory, fetchScenarioById, updateScenario } from '../../services/scenario';
import { Scenario } from '../../types/ScenarioTypes';
import ActionButton from '../common/ActionButton';
import Modal from '../common/Modal';
import './TabStylesNew.css';

interface FileTabProps {
  currentScenario: Scenario | null;
  isDirty: boolean;
  onLoadScenario: (scenario: Scenario, generatedStory?: string | null) => void;
  onSaveScenario: (scenario: Scenario) => void;
  onNewScenario: (title: string) => void;
}

const FileTab: React.FC<FileTabProps> = ({ 
  currentScenario, 
  isDirty, 
  onLoadScenario, 
  onSaveScenario, 
  onNewScenario 
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

  // Fetch scenarios on component mount
  useEffect(() => {
    fetchScenarios();
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
    // Skip if selectedScenarioId is empty or it's the same as currentScenario.id
    if (!selectedScenarioId || (currentScenario && selectedScenarioId === currentScenario.id)) {
      return;
    }
    
    if (isDirty) {
      // Store the pending scenario ID and ask for confirmation
      setPendingScenarioId(selectedScenarioId);
      setShowSaveConfirm(true);
    } else {
      // No changes to save, load the scenario immediately
      loadScenario(selectedScenarioId);
    }
  }, [selectedScenarioId]);

  const fetchScenarios = async () => {
    try {
      const data = await fetchAllScenarios();
      setScenarios(data);
    } catch (error) {
      console.error('Failed to fetch scenarios:', error);
    }
  };

  const loadScenario = async (id: string) => {
    if (!id) return;
    
    try {
      const scenario = await fetchScenarioById(id);
      
      // Try to fetch the generated story for this scenario
      let generatedStory = null;
      try {
        const storyResponse = await fetchGeneratedStory(id);
        // Ensure empty strings are treated as null
        if (storyResponse && storyResponse.content) {
          generatedStory = storyResponse.content;
        }
      } catch (error) {
        // If there's an error fetching the story, just continue without it
        console.log('No generated story found for this scenario');
      }
      
      // Pass both the scenario and the generated story (if any) to the parent component
      onLoadScenario(scenario, generatedStory);
      setShowConfirm(false);
      setShowSaveConfirm(false);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Failed to load scenario:', error);
    }
  };

  const handleSaveAndLoad = async () => {
    if (!currentScenario) return;
    
    try {
      await onSaveScenario(currentScenario);
      // After saving, load the pending scenario
      if (pendingScenarioId) {
        await loadScenario(pendingScenarioId);
        setPendingScenarioId('');
      }
    } catch (error) {
      console.error('Failed to save scenario:', error);
    }
  };

  const handleDiscardAndLoad = () => {
    if (pendingScenarioId) {
      loadScenario(pendingScenarioId);
      setPendingScenarioId('');
    }
    setShowSaveConfirm(false);
  };
  
  const handleCancelSwitch = () => {
    // Reset the selected scenario ID to the current scenario's ID
    if (currentScenario?.id) {
      setSelectedScenarioId(currentScenario.id);
    } else {
      setSelectedScenarioId('');
    }
    setPendingScenarioId('');
    setShowSaveConfirm(false);
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

    // Check if title already exists
    if (scenarios.some(s => s.title === saveAsTitle && s.id !== currentScenario?.id)) {
      setErrorMessage('A scenario with this title already exists');
      return;
    }

    try {
      if (currentScenario) {
        const updatedScenario = { ...currentScenario, title: saveAsTitle.trim(), id: '' }; // ID will be assigned by the backend
        await onSaveScenario(updatedScenario);
        setShowSaveAsInput(false);
        fetchScenarios(); // Refresh the list
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

  const confirmRenameScenario = async () => {
    if (!renameTitle.trim()) {
      setErrorMessage('Title cannot be empty');
      return;
    }

    // Check if title already exists (excluding current scenario)
    if (scenarios.some(s => s.title === renameTitle && s.id !== currentScenario?.id)) {
      setErrorMessage('A scenario with this title already exists');
      return;
    }

    try {
      if (currentScenario) {
        const updatedScenario = { ...currentScenario, title: renameTitle.trim() };
        const result = await updateScenario(updatedScenario);
        onLoadScenario(result); // Update in memory
        setShowRenameInput(false);
        fetchScenarios(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to rename scenario:', error);
      setErrorMessage('Failed to rename scenario');
    }
  };

  // Add function to handle deleting a scenario
  const handleDeleteRequest = (id: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation(); // Prevent the click from also selecting the scenario
    }
    setScenarioToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteScenario = async () => {
    try {
      await deleteScenario(scenarioToDelete);
      
      // If we deleted the current scenario, clear it
      if (currentScenario && currentScenario.id === scenarioToDelete) {
        // Create an empty scenario 
        const username = localStorage.getItem('username') || 'anonymous';
        const emptyScenario: Scenario = {
          id: '',
          userId: username,
          title: '',
          synopsis: '',
          createdAt: new Date(),
        };
        onLoadScenario(emptyScenario);
      }
      
      setSelectedScenarioId(''); // Clear selection
      setShowDeleteConfirm(false);
      fetchScenarios(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete scenario:', error);
    }
  };

  return (
    <div className="tab-container">
      <Modal 
        show={showConfirm} 
        onClose={() => setShowConfirm(false)} 
        title="Unsaved Changes"
        footer={
          <div className="form-buttons">
            <ActionButton onClick={() => setShowConfirm(false)} label="Cancel" variant="default" />
            <ActionButton onClick={confirmAction} label="Continue" variant="primary" />
          </div>
        }
      >
        <p>You have unsaved changes. Do you want to continue?</p>
      </Modal>

      <Modal 
        show={showSaveConfirm} 
        onClose={handleCancelSwitch} 
        title="Save Changes"
        footer={
          <div className="form-buttons">
            <ActionButton onClick={handleCancelSwitch} label="Cancel" variant="default" />
            <ActionButton onClick={handleDiscardAndLoad} label="Discard Changes" variant="default" />
            <ActionButton onClick={handleSaveAndLoad} label="Save Changes" variant="primary" />
          </div>
        }
      >
        <p>You have unsaved changes in the current scenario. Would you like to save them before switching?</p>
      </Modal>

      <Modal
        show={showTitleInput}
        onClose={() => {
          setShowTitleInput(false);
          setErrorMessage('');
        }}
        title="Create New Scenario"
        footer={
          <div className="form-buttons">
            <ActionButton 
              onClick={() => {
                setShowTitleInput(false);
                setErrorMessage('');
              }} 
              label="Cancel" 
              variant="default" 
            />
            <ActionButton onClick={confirmNewScenario} label="Create" variant="primary" />
          </div>
        }
      >
        <div className="form-field">
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Enter scenario title"
            autoFocus
            className="form-input"
          />
        </div>
      </Modal>

      <Modal
        show={showSaveAsInput}
        onClose={() => {
          setShowSaveAsInput(false);
          setErrorMessage('');
        }}
        title="Save Scenario As"
        footer={
          <div className="form-buttons">
            <ActionButton 
              onClick={() => {
                setShowSaveAsInput(false);
                setErrorMessage('');
              }} 
              label="Cancel" 
              variant="default" 
            />
            <ActionButton onClick={confirmSaveAs} label="Save" variant="primary" />
          </div>
        }
      >
        <div className="form-field">
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          <input
            type="text"
            value={saveAsTitle}
            onChange={(e) => setSaveAsTitle(e.target.value)}
            placeholder="Enter new title"
            autoFocus
            className="form-input"
          />
        </div>
      </Modal>

      <Modal
        show={showRenameInput}
        onClose={() => {
          setShowRenameInput(false);
          setErrorMessage('');
        }}
        title="Rename Scenario"
        footer={
          <div className="form-buttons">
            <ActionButton 
              onClick={() => {
                setShowRenameInput(false);
                setErrorMessage('');
              }} 
              label="Cancel" 
              variant="default" 
            />
            <ActionButton onClick={confirmRenameScenario} label="Rename" variant="primary" />
          </div>
        }
      >
        <div className="form-field">
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          <input
            type="text"
            value={renameTitle}
            onChange={(e) => setRenameTitle(e.target.value)}
            placeholder="Enter new title"
            autoFocus
            className="form-input"
          />
        </div>
      </Modal>

      <Modal
        show={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
        }}
        title="Delete Scenario"
        footer={
          <div className="form-buttons">
            <ActionButton onClick={() => setShowDeleteConfirm(false)} label="Cancel" variant="default" />
            <ActionButton onClick={confirmDeleteScenario} label="Delete" variant="danger" />
          </div>
        }
      >
        <p>Are you sure you want to delete this scenario? This action cannot be undone.</p>
      </Modal>

      <div className="tab-actions file-tab-actions">
        <div className="tab-section">
          <h3 className="tab-section-title">Manage Scenarios</h3>
          
          <div className="form-field">
            <label htmlFor="scenario-select">Select Scenario:</label>
            <div className="scenario-select-wrapper">
              <div className="custom-dropdown" ref={dropdownRef}>
                <button className="dropdown-toggle tab-btn tab-btn-default" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                  {selectedScenarioId ? scenarios.find(s => s.id === selectedScenarioId)?.title : "Select a scenario"} ▼
                </button>
                {isDropdownOpen && (
                  <div className="dropdown-menu">
                    {scenarios.length === 0 && (
                      <div className="dropdown-item disabled">
                        No scenarios found
                      </div>
                    )}
                    {scenarios.map(scenario => (
                      <div 
                        key={scenario.id} 
                        className={`dropdown-item ${scenario.id === selectedScenarioId ? 'active' : ''}`}
                        onClick={() => {
                          if (scenario.id !== selectedScenarioId) {
                            setSelectedScenarioId(scenario.id);
                          }
                          setIsDropdownOpen(false);
                        }}
                      >
                        {scenario.title || "(Untitled)"}
                        <button 
                          className="card-btn card-btn-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRequest(scenario.id);
                          }}
                          title="Delete scenario"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
