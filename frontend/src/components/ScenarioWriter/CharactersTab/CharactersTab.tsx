import React, { useEffect, useState } from 'react';
import { generateRandomCharacter } from '../../../services/storyGenerator';
import { Character } from '../../../types/ScenarioTypes';
import ActionButton from '../../common/ActionButton';
import ImportButton from '../../common/ImportButton';
import ImportModal from '../../common/ImportModal';
import Modal from '../../common/Modal';
import { TabProps } from '../common/TabInterface';
import '../common/TabStylesNew.css';

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
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateFormCharacter, setGenerateFormCharacter] = useState<Character>({ id: '', name: '' });
  const [generateFormError, setGenerateFormError] = useState<string | null>(null);
  
  // Debug: Log when currentScenario changes
  useEffect(() => {
    console.log("CharactersTab: currentScenario updated:", currentScenario);
  }, [currentScenario]);
  const [showCharacterTypeDropdown, setShowCharacterTypeDropdown] = useState(false);
  const [characterGenerationInProgress, setCharacterGenerationInProgress] = useState(false);
  const [cancelGeneration, setCancelGeneration] = useState<(() => void) | null>(null);

  // Add state for streaming character JSON and error modal
  const [streamedJson, setStreamedJson] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [showJsonErrorModal, setShowJsonErrorModal] = useState(false);

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
    if (!currentScenario) {
      alert("Please create or select a scenario first before generating a character.");
      return;
    }
    setGenerateFormCharacter({ id: generateUniqueId(), name: '' });
    setShowGenerateModal(true);
    setGenerateFormError(null);
  };

  // Handler for changes in the generate form
  const handleGenerateFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setGenerateFormCharacter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler for generating character from modal form (streaming, no llmBackend)
  const handleGenerateCharacterFromModal = async () => {
    if (!currentScenario) {
      setGenerateFormError("No scenario selected.");
      return;
    }
    setCharacterGenerationInProgress(true);
    setGenerateFormError(null);
    setStreamedJson('');
    setJsonError(null);
    setShowJsonErrorModal(false);
    let accumulated = '';
    try {
      // Compose a temporary scenario with up-to-date characters
      const scenarioForPrompt = {
        ...currentScenario,
        characters: characters
      };
      const filledFields = generateFormCharacter;
      let characterType = filledFields.role?.toLowerCase() || 'supporting';
      // Use llmService for streaming
      const generationResult = await generateRandomCharacter(
        scenarioForPrompt,
        characterType,
        {
          onProgress: (chunk) => {
            accumulated += chunk;
            setStreamedJson(accumulated);
          }
        }
      );
      setCancelGeneration(() => generationResult.cancelGeneration);
      try {
        const randomCharacter = await generationResult.result;
        let parsed = null;
        try {
          parsed = typeof randomCharacter === 'string' ? JSON.parse(randomCharacter) : randomCharacter;
        } catch (e) {
          setJsonError('Failed to parse generated character as JSON.');
          setShowJsonErrorModal(true);
          return;
        }
        if (parsed && typeof parsed === 'object') {
          const newCharacterWithId = {
            ...parsed,
            ...generateFormCharacter,
            id: generateFormCharacter.id || generateUniqueId()
          };
          setCharacters(prev => [...prev, newCharacterWithId]);
          setShowGenerateModal(false);
          setGenerateFormCharacter({ id: '', name: '' });
          setStreamedJson('');
        }
      } catch (error) {
        setJsonError('Character generation was interrupted or failed.');
        setShowJsonErrorModal(true);
      }
    } catch (error) {
      setJsonError('Error generating random character.');
      setShowJsonErrorModal(true);
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

  return (
    <div className="tab-container scenario-editor-panel">
      <div className="scenario-tab-title">
        Characters
      </div>
      <div className="tab-actions">
        <div className="tab-actions-primary">
          {!characterGenerationInProgress ? (
            <div style={{ position: 'relative' }}>
              <ActionButton 
                onClick={handleGenerateButtonClick} 
                label="✨ Generate Character" 
                variant="success"
                title="Generate a random character using AI"
                disabled={!currentScenario}
              />
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

      {/* Generate Character Modal */}
      <Modal
        show={showGenerateModal}
        onClose={() => { setShowGenerateModal(false); setGenerateFormError(null); setStreamedJson(''); }}
        title="Generate New Character"
      >
        <div className="form-container" style={{
          background: '#181a20',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
          border: '1.5px solid #353b45',
          padding: '2rem 2rem 1.5rem 2rem',
          marginBottom: '2rem',
        }}>
          <h3 className="form-title" style={{ color: '#e6e6e6', fontWeight: 700 }}>New Character</h3>
          <div className="form-field">
            <label htmlFor="name" style={{ color: '#bfc7d5', fontWeight: 600 }}>Name (or leave blank for random name)</label>
            <input
              type="text"
              id="name"
              name="name"
              value={generateFormCharacter.name || ''}
              onChange={handleGenerateFormChange}
              placeholder="Character name"
              className="form-input"
              style={{ background: '#23272e', color: '#e6e6e6', border: '1px solid #353b45' }}
            />
          </div>
          <div className="form-field">
            <label htmlFor="alias" style={{ color: '#bfc7d5', fontWeight: 600 }}>Alias (use this if no name given)</label>
            <input
              type="text"
              id="alias"
              name="alias"
              value={generateFormCharacter.alias || ''}
              onChange={handleGenerateFormChange}
              placeholder="Character alias"
              className="form-input"
              style={{ background: '#23272e', color: '#e6e6e6', border: '1px solid #353b45' }}
            />
          </div>
          <div className="form-field">
            <label htmlFor="role" style={{ color: '#bfc7d5', fontWeight: 600 }}>Role (optional)</label>
            <input
              type="text"
              id="role"
              name="role"
              value={generateFormCharacter.role || ''}
              onChange={handleGenerateFormChange}
              placeholder="Select or type a role"
              list="role-options"
              className="form-input"
              style={{ background: '#23272e', color: '#e6e6e6', border: '1px solid #353b45' }}
            />
            <datalist id="role-options">
              <option value="Protagonist" />
              <option value="Antagonist" />
              <option value="Supporting" />
              <option value="Background" />
            </datalist>
          </div>
          <div className="form-field">
            <label htmlFor="gender" style={{ color: '#bfc7d5', fontWeight: 600 }}>Gender (optional)</label>
            <input
              type="text"
              id="gender"
              name="gender"
              value={generateFormCharacter.gender || ''}
              onChange={handleGenerateFormChange}
              placeholder="Select or type a gender"
              list="gender-options"
              className="form-input"
              style={{ background: '#23272e', color: '#e6e6e6', border: '1px solid #353b45' }}
            />
            <datalist id="gender-options">
              <option value="Male" />
              <option value="Female" />
              <option value="Non-binary" />
              <option value="Other" />
            </datalist>
          </div>
          <div className="form-field">
            <label htmlFor="appearance" style={{ color: '#bfc7d5', fontWeight: 600 }}>Physical Appearance (optional)</label>
            <textarea
              id="appearance"
              name="appearance"
              value={generateFormCharacter.appearance || ''}
              onChange={handleGenerateFormChange}
              placeholder="Describe how this character looks..."
              className="form-textarea"
              style={{ background: '#23272e', color: '#e6e6e6', border: '1px solid #353b45' }}
            />
          </div>
          <div className="form-field">
            <label htmlFor="backstory" style={{ color: '#bfc7d5', fontWeight: 600 }}>Backstory (optional)</label>
            <textarea
              id="backstory"
              name="backstory"
              value={generateFormCharacter.backstory || ''}
              onChange={handleGenerateFormChange}
              placeholder="Character's history and background..."
              className="form-textarea"
              style={{ background: '#23272e', color: '#e6e6e6', border: '1px solid #353b45' }}
            />
          </div>
          <div className="form-field">
            <label htmlFor="extraInfo" style={{ color: '#bfc7d5', fontWeight: 600 }}>Extra Information (optional)</label>
            <textarea
              id="extraInfo"
              name="extraInfo"
              value={generateFormCharacter.extraInfo || ''}
              onChange={handleGenerateFormChange}
              placeholder="Any additional details about this character..."
              className="form-textarea"
              style={{ background: '#23272e', color: '#e6e6e6', border: '1px solid #353b45' }}
            />
          </div>
          {generateFormError && (
            <div style={{ color: '#ff6b6b', marginBottom: '1rem', fontWeight: 600 }}>{generateFormError}</div>
          )}
          {streamedJson && characterGenerationInProgress && (
            <div style={{
              background: '#23272f',
              color: '#90caf9',
              fontFamily: 'monospace',
              fontSize: '1rem',
              padding: '12px 18px',
              borderRadius: '8px',
              margin: '12px auto',
              maxWidth: 700,
              wordBreak: 'break-all',
              whiteSpace: 'pre-wrap',
              border: '1px solid #444',
            }}>
              {streamedJson}
            </div>
          )}
          <div className="form-buttons">
            <ActionButton onClick={() => { setShowGenerateModal(false); setGenerateFormError(null); }} label="Cancel" variant="default" />
            <ActionButton 
              onClick={handleGenerateCharacterFromModal} 
              label="Generate" 
              variant="success" 
              disabled={characterGenerationInProgress}
            />
          </div>
        </div>
      </Modal>

      <Modal
        show={showJsonErrorModal}
        onClose={() => setShowJsonErrorModal(false)}
        title="Character Generation Error"
      >
        <div style={{ color: '#ff5252', fontWeight: 600, marginBottom: '12px' }}>{jsonError}</div>
        <div style={{ background: '#23272f', color: '#90caf9', fontFamily: 'monospace', fontSize: '1rem', padding: '12px 18px', borderRadius: '8px', margin: '12px auto', maxWidth: 700, wordBreak: 'break-all', whiteSpace: 'pre-wrap', border: '1px solid #444' }}>{streamedJson}</div>
        <div className="form-buttons">
          <ActionButton onClick={() => { setShowJsonErrorModal(false); handleGenerateCharacterFromModal(); }} label="Retry" variant="success" />
          <ActionButton onClick={() => setShowJsonErrorModal(false)} label="Cancel" variant="default" />
        </div>
      </Modal>

      {showForm && (
        <div className="form-container" style={{
          background: '#181a20',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
          border: '1.5px solid #353b45',
          padding: '2rem 2rem 1.5rem 2rem',
          marginBottom: '2rem',
        }}>
          <h3 className="form-title" style={{ color: '#e6e6e6', fontWeight: 700 }}>{isEditing ? 'Edit Character' : 'New Character'}</h3>

          <div className="form-field">
            <label htmlFor="name" style={{ color: '#bfc7d5', fontWeight: 600 }}>Name (or leave blank for random name)</label>
            <input
              type="text"
              id="name"
              name="name"
              value={newCharacter.name}
              onChange={handleFormChange}
              placeholder="Character name"
              className="form-input"
              style={{ background: '#23272e', color: '#e6e6e6', border: '1px solid #353b45' }}
            />
          </div>
          <div className="form-field">
            <label htmlFor="alias" style={{ color: '#bfc7d5', fontWeight: 600 }}>Alias (use this if no name given)</label>
            <input
              type="text"
              id="alias"
              name="alias"
              value={newCharacter.alias}
              onChange={handleFormChange}
              placeholder="Character alias"
              className="form-input"
              style={{ background: '#23272e', color: '#e6e6e6', border: '1px solid #353b45' }}
            />
          </div>

          <div className="form-field">
            <label htmlFor="role" style={{ color: '#bfc7d5', fontWeight: 600 }}>Role (optional)</label>
            <input
              type="text"
              id="role"
              name="role"
              value={newCharacter.role || ''}
              onChange={handleFormChange}
              placeholder="Select or type a role"
              list="role-options"
              className="form-input"
              style={{ background: '#23272e', color: '#e6e6e6', border: '1px solid #353b45' }}
            />
            <datalist id="role-options">
              <option value="Protagonist" />
              <option value="Antagonist" />
              <option value="Supporting" />
              <option value="Background" />
            </datalist>
          </div>

          <div className="form-field">
            <label htmlFor="gender" style={{ color: '#bfc7d5', fontWeight: 600 }}>Gender (optional)</label>
            <input
              type="text"
              id="gender"
              name="gender"
              value={newCharacter.gender || ''}
              onChange={handleFormChange}
              placeholder="Select or type a gender"
              list="gender-options"
              className="form-input"
              style={{ background: '#23272e', color: '#e6e6e6', border: '1px solid #353b45' }}
            />
            <datalist id="gender-options">
              <option value="Male" />
              <option value="Female" />
              <option value="Non-binary" />
              <option value="Other" />
            </datalist>
          </div>

          <div className="form-field">
            <label htmlFor="appearance" style={{ color: '#bfc7d5', fontWeight: 600 }}>Physical Appearance (optional)</label>
            <textarea
              id="appearance"
              name="appearance"
              value={newCharacter.appearance || ''}
              onChange={handleFormChange}
              placeholder="Describe how this character looks..."
              className="form-textarea"
              style={{ background: '#23272e', color: '#e6e6e6', border: '1px solid #353b45' }}
            />
          </div>

          <div className="form-field">
            <label htmlFor="backstory" style={{ color: '#bfc7d5', fontWeight: 600 }}>Backstory (optional)</label>
            <textarea
              id="backstory"
              name="backstory"
              value={newCharacter.backstory || ''}
              onChange={handleFormChange}
              placeholder="Character's history and background..."
              className="form-textarea"
              style={{ background: '#23272e', color: '#e6e6e6', border: '1px solid #353b45' }}
            />
          </div>

          <div className="form-field">
            <label htmlFor="extraInfo" style={{ color: '#bfc7d5', fontWeight: 600 }}>Extra Information (optional)</label>
            <textarea
              id="extraInfo"
              name="extraInfo"
              value={newCharacter.extraInfo || ''}
              onChange={handleFormChange}
              placeholder="Any additional details about this character..."
              className="form-textarea"
              style={{ background: '#23272e', color: '#e6e6e6', border: '1px solid #353b45' }}
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
    <div className="content-card" style={{
      background: '#181a20', // darker for better contrast
      border: '1.5px solid #353b45',
      borderRadius: '12px',
      color: '#e6e6e6',
      boxShadow: '0 4px 16px rgba(0,0,0,0.22)',
      marginBottom: '22px',
      padding: '22px 18px',
      minWidth: '220px',
      maxWidth: '340px',
      fontSize: '1.08rem',
      fontFamily: 'inherit',
      transition: 'box-shadow 0.2s',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}>
      <div className="content-card-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button
          className="card-btn card-btn-edit"
          onClick={() => onEdit(character)}
          title="Edit character"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: '#61dafb' }}>
            <path d="M10 3L13 6M2 14H5L13 6L10 3L2 11V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          className="card-btn card-btn-delete"
          onClick={() => onDelete(character.id)}
          title="Delete character"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: '#ff6b6b' }}>
            <path d="M2 4h12M5 4v10h6V4M6 2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <h3 style={{ color: '#fff', fontWeight: 700, margin: '0 0 6px 0', fontSize: '1.18rem', letterSpacing: '0.01em' }}>{character.name || character.alias + " (random name)"}</h3>

      <div className="character-field" style={{ color: '#e6e6e6', fontSize: '1rem' }}>
        {character.role && (
          <>
            <div className="character-field-label" style={{ fontWeight: 600, color: '#61dafb', marginBottom: 2 }}>Role</div>
            <div className="character-field-value" style={{ fontWeight: 500 }}>{character.role}</div>
          </>
        )}
        <div className="character-field-label" style={{ fontWeight: 600, color: '#61dafb', marginTop: 6 }}>Gender</div>
        <div className="character-field-value" style={{ fontWeight: 500 }}>{character.gender || "Random"}</div>
      </div>
    </div>
  );
});

export default CharactersTab;
