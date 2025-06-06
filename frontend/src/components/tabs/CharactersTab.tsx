import React, { useEffect, useState } from 'react';
import { generateRandomCharacter } from '../../services/storyGenerator';
import { Character } from '../../types/ScenarioTypes';
import ActionButton from '../common/ActionButton';
import ImportButton from '../common/ImportButton';
import ImportModal from '../common/ImportModal';
import Modal from '../common/Modal';
import { TabProps } from './TabInterface';
import './TabStylesNew.css';

const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const CharactersTab: React.FC<TabProps> = ({ content, updateContent, currentScenario }) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [newCharacter, setNewCharacter] = useState<Character>({
    id: '',
    name: ''
  });
  
  // Debug: Log when currentScenario changes
  useEffect(() => {
    console.log("CharactersTab: currentScenario updated:", currentScenario);
  }, [currentScenario]);
  const [showCharacterTypeDropdown, setShowCharacterTypeDropdown] = useState(false);
  const [characterGenerationInProgress, setCharacterGenerationInProgress] = useState(false);
  const [cancelGeneration, setCancelGeneration] = useState<(() => void) | null>(null);

  // Parse stored characters JSON when component mounts or content changes
  useEffect(() => {
    if (content) {
      try {
        const parsedCharacters = JSON.parse(content);
        if (Array.isArray(parsedCharacters)) {
          // Use a function form of setCharacters to compare and avoid unnecessary updates
          setCharacters(currentChars => {
            const currentCharsJson = JSON.stringify(currentChars);
            const parsedCharsJson = JSON.stringify(parsedCharacters);

            return currentCharsJson !== parsedCharsJson ? parsedCharacters : currentChars;
          });
        }
      } catch (error) {
        console.error('Failed to parse characters content:', error);
      }
    }
  }, [content]);
  
  // Add click outside handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showCharacterTypeDropdown) {
        const target = e.target as HTMLElement;
        if (!target.closest('.character-type-dropdown-container')) {
          setShowCharacterTypeDropdown(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCharacterTypeDropdown]);

  // Update the JSON string whenever characters change, but use a ref to avoid circular updates
  const initialRender = React.useRef(true);
  const previousCharsJSON = React.useRef("");

  useEffect(() => {
    // Skip the first render
    if (initialRender.current) {
      initialRender.current = false;
      previousCharsJSON.current = JSON.stringify(characters);
      return;
    }

    // Compare with previous JSON to avoid unnecessary updates
    const currentCharsJSON = JSON.stringify(characters);
    if (currentCharsJSON !== previousCharsJSON.current) {
      previousCharsJSON.current = currentCharsJSON;
      updateContent(currentCharsJSON);
    }
  }, [characters, updateContent]);

  const handleAddCharacter = () => {
    setNewCharacter({
      id: generateUniqueId(),
      name: ''
    });
    setShowForm(true);
    setIsEditing(false);
  };

  const handleEditCharacter = React.useCallback((character: Character) => {
    setNewCharacter({ ...character });
    setShowForm(true);
    setIsEditing(true);
  }, []);

  const handleDeleteRequest = React.useCallback((characterId: string) => {
    setCharacterToDelete(characterId);
  }, []);

  const handleDeleteConfirm = React.useCallback(() => {
    if (characterToDelete) {
      setCharacters(prev => prev.filter(char => char.id !== characterToDelete));
      setCharacterToDelete(null);
    }
  }, [characterToDelete]);

  const handleDeleteCancel = React.useCallback(() => {
    setCharacterToDelete(null);
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewCharacter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveCharacter = React.useCallback(() => {
    const characterToSave = {
      ...newCharacter,
      name: newCharacter?.name?.trim() || ""
    };

    if (isEditing) {
      // Update existing character
      setCharacters(prev =>
        prev.map(char => char.id === characterToSave.id ? characterToSave : char)
      );
    } else {
      // Add new character
      setCharacters(prev => [...prev, characterToSave]);
    }

    setShowForm(false);
    setNewCharacter({ id: '', name: '' });
    setIsEditing(false);
  }, [newCharacter, isEditing]);

  const handleCancelForm = React.useCallback(() => {
    setShowForm(false);
    setNewCharacter({ id: '', name: '' });
    setIsEditing(false);
  }, []);

  const handleImportCharacters = (importedCharacters: Character[]) => {
    // Generate new IDs for imported characters to avoid conflicts
    const charactersWithNewIds = importedCharacters.map(character => ({
      ...character,
      id: generateUniqueId()
    }));

    // Merge with existing characters
    setCharacters(prev => [...prev, ...charactersWithNewIds]);
  };

  // Handler for character type dropdown
  const handleGenerateButtonClick = () => {
    console.log("Generate button clicked, currentScenario:", currentScenario);
    if (!currentScenario) {
      alert("Please create or select a scenario first before generating a character.");
      return;
    }
    setShowCharacterTypeDropdown(true);
  };

  // Handler for character generation
  const handleGenerateCharacter = async (characterType: string) => {
    if (!currentScenario) {
      console.error("No current scenario available for character generation");
      alert("Please create or select a scenario first before generating a character.");
      setShowCharacterTypeDropdown(false);
      return;
    }

    try {
      setCharacterGenerationInProgress(true);
      setShowCharacterTypeDropdown(false);
      
      console.log(`Generating ${characterType} character...`);
      
      const generationResult = await generateRandomCharacter(
        currentScenario,
        characterType,
        {
          onProgress: (generatedText) => {
            // For JSON results, we don't need to update intermediate progress
            console.log('Generating character...');
          }
        }
      );

      // Store the cancel function to enable cancellation
      setCancelGeneration(() => generationResult.cancelGeneration);
      
      try {
        // Wait for the generation to complete
        const randomCharacter = await generationResult.result;
        
        // Add the character with a unique ID
        const newCharacterWithId = {
          ...randomCharacter,
          id: generateUniqueId()
        };
        
        setCharacters(prev => [...prev, newCharacterWithId]);
        console.log('Random character generated:', newCharacterWithId);
      } catch (error) {
        console.log('Character generation was interrupted or failed:', error);
      }
    } catch (error) {
      console.error('Error generating random character:', error);
    } finally {
      setCharacterGenerationInProgress(false);
      setCancelGeneration(null);
    }
  };

  // Handle cancellation of character generation
  const handleCancelGeneration = () => {
    if (cancelGeneration) {
      cancelGeneration();
      setCancelGeneration(null);
      setCharacterGenerationInProgress(false);
    }
  };

  // Icons for buttons
  const addIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
  
  
  const cancelIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  // Styles for character type dropdown
  const dropdownStyles = {
    position: 'absolute' as const,
    top: '100%',
    left: '0',
    backgroundColor: '#fff',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    borderRadius: '4px',
    overflow: 'hidden',
    zIndex: 10,
    width: '200px',
    marginTop: '5px'
  };
  
  const dropdownOptionStyles = {
    padding: '10px 15px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    borderLeft: '4px solid transparent'
  };

  const protagonistOptionStyles = {
    ...dropdownOptionStyles,
    borderLeftColor: '#4caf50',
    color: '#4caf50'
  };
  
  const antagonistOptionStyles = {
    ...dropdownOptionStyles,
    borderLeftColor: '#f44336',
    color: '#f44336'
  };
  
  const supportingOptionStyles = {
    ...dropdownOptionStyles,
    borderLeftColor: '#2196f3',
    color: '#2196f3'
  };

  return (
    <div className="tab-container">
      <div className="tab-actions">
        <div className="tab-actions-primary">
          {!characterGenerationInProgress ? (
            <div style={{ position: 'relative' }} className="character-type-dropdown-container">
              <ActionButton 
                onClick={handleGenerateButtonClick} 
                label="✨ Generate Character" 
                variant="success"
                title="Generate a random character using AI"
                disabled={!currentScenario}
              />
              
              {showCharacterTypeDropdown && (
                <div style={dropdownStyles} className="character-type-dropdown">
                  <div 
                    style={protagonistOptionStyles}
                    onClick={() => handleGenerateCharacter('protagonist')}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f8f0'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span style={{ marginRight: '10px' }}>👤</span>
                    Protagonist
                  </div>
                  <div 
                    style={antagonistOptionStyles}
                    onClick={() => handleGenerateCharacter('antagonist')}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fff5f5'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span style={{ marginRight: '10px' }}>😈</span>
                    Antagonist
                  </div>
                  <div 
                    style={supportingOptionStyles}
                    onClick={() => handleGenerateCharacter('supporting')}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f7ff'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span style={{ marginRight: '10px' }}>🧩</span>
                    Supporting
                  </div>
                </div>
              )}
              &nbsp;
              <ActionButton 
                onClick={handleAddCharacter} 
                label="Add Character" 
                icon={addIcon}
                variant="primary"
                title="Add a new character"
              />
            </div>
          ) : (
            <ActionButton 
              onClick={handleCancelGeneration}
              label="Cancel Generation"
              icon={cancelIcon}
              variant="danger"
              title="Cancel the character generation"
            />
          )}
        </div>
        <div className="tab-actions-secondary">
          <ImportButton
            onClick={() => setShowImportModal(true)}
            title="Import characters from another scenario"
            label="Import Characters"
          />
        </div>
      </div>

      {showForm && (
        <div className="form-container">
          <h3 className="form-title">{isEditing ? 'Edit Character' : 'New Character'}</h3>

          <div className="form-field">
            <label htmlFor="name">Name (or leave blank for random name)</label>
            <input
              type="text"
              id="name"
              name="name"
              value={newCharacter.name}
              onChange={handleFormChange}
              placeholder="Character name"
              className="form-input"
            />
          </div><div className="form-field">
            <label htmlFor="alias">Alias (use this if no name given)</label>
            <input
              type="text"
              id="alias"
              name="alias"
              value={newCharacter.alias}
              onChange={handleFormChange}
              placeholder="Character alias"
              className="form-input"
            />
          </div>

          <div className="form-field">
            <label htmlFor="role">Role (optional)</label>
            <input
              type="text"
              id="role"
              name="role"
              value={newCharacter.role || ''}
              onChange={handleFormChange}
              placeholder="Select or type a role"
              list="role-options"
              className="form-input"
            />
            <datalist id="role-options">
              <option value="Protagonist" />
              <option value="Antagonist" />
              <option value="Supporting" />
              <option value="Background" />
            </datalist>
          </div>

          <div className="form-field">
            <label htmlFor="gender">Gender (optional)</label>
            <input
              type="text"
              id="gender"
              name="gender"
              value={newCharacter.gender || ''}
              onChange={handleFormChange}
              placeholder="Select or type a gender"
              list="gender-options"
              className="form-input"
            />
            <datalist id="gender-options">
              <option value="Male" />
              <option value="Female" />
              <option value="Non-binary" />
              <option value="Other" />
            </datalist>
          </div>

          <div className="form-field">
            <label htmlFor="appearance">Physical Appearance (optional)</label>
            <textarea
              id="appearance"
              name="appearance"
              value={newCharacter.appearance || ''}
              onChange={handleFormChange}
              placeholder="Describe how this character looks..."
              className="form-textarea"
            />
          </div>

          <div className="form-field">
            <label htmlFor="backstory">Backstory (optional)</label>
            <textarea
              id="backstory"
              name="backstory"
              value={newCharacter.backstory || ''}
              onChange={handleFormChange}
              placeholder="Character's history and background..."
              className="form-textarea"
            />
          </div>

          <div className="form-field">
            <label htmlFor="extraInfo">Extra Information (optional)</label>
            <textarea
              id="extraInfo"
              name="extraInfo"
              value={newCharacter.extraInfo || ''}
              onChange={handleFormChange}
              placeholder="Any additional details about this character..."
              className="form-textarea"
            />
          </div>

          <div className="form-buttons">
            <ActionButton onClick={handleCancelForm} label="Cancel" variant="default" />
            <ActionButton 
              onClick={handleSaveCharacter} 
              label={isEditing ? 'Update Character' : 'Save Character'} 
              variant="primary" 
            />
          </div>
        </div>
      )}

      <div className="content-cards-container">
        {characters.length === 0 ? (
          <div className="empty-state-message">
            <p>No characters added yet. Click "Add Character" to create one.</p>
          </div>
        ) : (
          characters.map(character => (
            <CharacterCard
              key={character.id}
              character={character}
              onEdit={handleEditCharacter}
              onDelete={handleDeleteRequest}
            />
          ))
        )}
      </div>

      <Modal
        show={!!characterToDelete}
        onClose={handleDeleteCancel}
        title="Delete Character"
      >
        <p>Are you sure you want to delete this character? This action cannot be undone.</p>
        <div className="form-buttons">
          <ActionButton onClick={handleDeleteCancel} label="Cancel" variant="default" />
          <ActionButton onClick={handleDeleteConfirm} label="Delete" variant="danger" />
        </div>
      </Modal>

      <ImportModal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Characters"
        onImport={handleImportCharacters}
        renderCheckboxes={true}
        getCheckboxItems={(scenario) => scenario.characters || []}
        extractContent={() => []}
        itemType="characters"          renderItemLabel={(character) => (
            <div className="character-item-label">
              <span className="character-item-icon">
                {character.gender === 'Male' ? '👨' :
                  character.gender === 'Female' ? '👩' : '🧑'}
              </span>
              <span className="character-item-name">
                {character.name ? character.name : character.alias ? character.alias : "(random character)"}
              </span>
              {character.role && (
                <span className="character-item-role">
                  ({character.role})
                </span>
              )}
            </div>
          )}
      />
    </div>
  );
};

// Memoized CharacterCard component for better performance
const CharacterCard: React.FC<{
  character: Character;
  onEdit: (character: Character) => void;
  onDelete: (id: string) => void;
}> = React.memo(({ character, onEdit, onDelete }) => {
  return (
    <div className="content-card">
      <div className="content-card-actions">
        <button
          className="card-btn card-btn-edit"
          onClick={() => onEdit(character)}
          title="Edit character"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 3L13 6M2 14H5L13 6L10 3L2 11V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          className="card-btn card-btn-delete"
          onClick={() => onDelete(character.id)}
          title="Delete character"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 4h12M5 4v10h6V4M6 2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <h3>{character.name || character.alias + " (random name)"}</h3>

      <div className="character-field">
        {character.role && (
          <>
            <div className="character-field-label">Role</div>
            <div className="character-field-value">{character.role}</div>
          </>
        )}
        
        <div className="character-field-label">Gender</div>
        <div className="character-field-value">{character.gender || "Random"}</div>
        
        {/* {character.appearance && (
          <>
            <div className="character-field-label">Appearance</div>
            <div className="character-field-value">{character.appearance}</div>
          </>
        )} */}
      </div>
    </div>
  );
});

export default CharactersTab;
