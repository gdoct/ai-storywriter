import React, { useCallback, useState } from 'react';
import { FaDownload, FaPlus, FaRandom, FaTimes, FaTrash, FaUser } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import { useAIStatus } from '../../../contexts/AIStatusContext';
import { generateCharacterField } from '../../../services/characterFieldGenerator';
import { generateRandomCharacter } from '../../../services/storyGenerator';
import { Character } from '../../../types/ScenarioTypes';
import ImportModal from '../../common/ImportModal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { TabProps } from '../types';
import './CharactersTab.css';

export const CharactersTab: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty,
  isLoading,
}) => {
  const characters = scenario.characters || [];
  const [expandedCharacter, setExpandedCharacter] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cancelGeneration, setCancelGeneration] = useState<(() => void) | null>(null);
  const [fieldGenerationInProgress, setFieldGenerationInProgress] = useState<{ characterId: string; fieldName: string } | null>(null);
  const [fieldStreamedText, setFieldStreamedText] = useState('');
  const [fieldCancelGeneration, setFieldCancelGeneration] = useState<(() => void) | null>(null);
  const { setAiStatus, setShowAIBusyModal } = useAIStatus();

  const handleAddCharacter = useCallback(() => {
    const newCharacter: Character = {
      id: uuidv4(),
      name: '',
      alias: '',
      role: '',
      gender: '',
      appearance: '',
      backstory: '',
      extraInfo: '',
    };
    const updatedCharacters = [...characters, newCharacter];
    onScenarioChange({ characters: updatedCharacters });
    setExpandedCharacter(newCharacter.id);
  }, [characters, onScenarioChange]);

  const handleRemoveCharacter = useCallback((characterId: string) => {
    const updatedCharacters = characters.filter(c => c.id !== characterId);
    onScenarioChange({ characters: updatedCharacters });
    if (expandedCharacter === characterId) {
      setExpandedCharacter(null);
    }
  }, [characters, onScenarioChange, expandedCharacter]);

  const handleCharacterChange = useCallback((characterId: string, field: keyof Character, value: string) => {
    const updatedCharacters = characters.map(character =>
      character.id === characterId
        ? { ...character, [field]: value }
        : character
    );
    onScenarioChange({ characters: updatedCharacters });
  }, [characters, onScenarioChange]);

  const toggleCharacterExpanded = useCallback((characterId: string) => {
    setExpandedCharacter(expandedCharacter === characterId ? null : characterId);
  }, [expandedCharacter]);

  const handleImport = useCallback((importedCharacters: Character[]) => {
    // Merge with existing characters, ensuring unique IDs
    const existingIds = new Set(characters.map(c => c.id));
    const newCharacters = importedCharacters.map(char => ({
      ...char,
      id: existingIds.has(char.id) ? uuidv4() : char.id
    }));
    onScenarioChange({ characters: [...characters, ...newCharacters] });
  }, [characters, onScenarioChange]);

  const handleGenerateRandomCharacter = useCallback(async () => {
    try {
      setIsGenerating(true);
      
      // Determine character type based on existing characters
      const existingRoles = characters.map(c => c.role?.toLowerCase());
      let characterType = 'supporting'; // Default
      
      if (!existingRoles.includes('protagonist')) {
        characterType = 'protagonist';
      } else if (!existingRoles.includes('antagonist')) {
        characterType = 'antagonist';
      }
      
      const generationResult = await generateRandomCharacter(
        scenario,
        characterType,
        {
          onProgress: () => {}, // No need for progress on character generation
          temperature: 0.8
        },
        setAiStatus,
        setShowAIBusyModal
      );
      
      setCancelGeneration(() => generationResult.cancelGeneration);
      
      try {
        const characterJson = await generationResult.result;
        const generatedCharacterData = JSON.parse(characterJson);
        
        const newCharacter: Character = {
          id: uuidv4(),
          name: generatedCharacterData.name || '',
          alias: generatedCharacterData.alias || '',
          role: generatedCharacterData.role || characterType,
          gender: generatedCharacterData.gender || '',
          appearance: generatedCharacterData.appearance || '',
          backstory: generatedCharacterData.backstory || '',
          extraInfo: generatedCharacterData.extraInfo || '',
        };
        
        const updatedCharacters = [...characters, newCharacter];
        onScenarioChange({ characters: updatedCharacters });
        setExpandedCharacter(newCharacter.id);
      } catch (error) {
        console.log('Character generation was interrupted:', error);
      }
    } catch (error) {
      console.error('Error generating character:', error);
    } finally {
      setIsGenerating(false);
      setCancelGeneration(null);
    }
  }, [scenario, characters, onScenarioChange, setAiStatus, setShowAIBusyModal]);

  const handleCancelGeneration = useCallback(() => {
    if (cancelGeneration) {
      cancelGeneration();
    }
  }, [cancelGeneration]);

  const handleGenerateField = useCallback(async (characterId: string, fieldName: string, fieldDisplayName: string) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    setFieldGenerationInProgress({ characterId, fieldName });
    setFieldStreamedText('');
    
    try {
      const generationResult = await generateCharacterField(
        scenario,
        character,
        fieldName,
        fieldDisplayName,
        {
          onProgress: (text) => {
            setFieldStreamedText(text);
          },
          setAiStatus,
          setShowAIBusyModal
        }
      );
      
      setFieldCancelGeneration(() => generationResult.cancelGeneration);
      
      try {
        const generatedValue = await generationResult.result;
        
        // Update the character with the generated value
        const updatedCharacters = characters.map(char =>
          char.id === characterId
            ? { ...char, [fieldName]: generatedValue }
            : char
        );
        onScenarioChange({ characters: updatedCharacters });
        
        setFieldStreamedText('');
        setFieldGenerationInProgress(null);
        setFieldCancelGeneration(null);
      } catch (error) {
        console.error('Field generation failed:', error);
        setFieldStreamedText('');
        setFieldGenerationInProgress(null);
        setFieldCancelGeneration(null);
      }
    } catch (error) {
      console.error('Error starting field generation:', error);
      setFieldGenerationInProgress(null);
      setFieldCancelGeneration(null);
    }
  }, [scenario, characters, onScenarioChange, setAiStatus, setShowAIBusyModal]);

  const handleCancelFieldGeneration = useCallback(() => {
    if (fieldCancelGeneration) {
      fieldCancelGeneration();
    }
    setFieldCancelGeneration(null);
    setFieldGenerationInProgress(null);
    setFieldStreamedText('');
  }, [fieldCancelGeneration]);

  // Field Generate Button component
  const FieldGenerateButton: React.FC<{
    characterId: string;
    fieldName: string;
    fieldDisplayName: string;
    disabled?: boolean;
  }> = ({ characterId, fieldName, fieldDisplayName, disabled }) => {
    const isGenerating = fieldGenerationInProgress?.characterId === characterId && fieldGenerationInProgress?.fieldName === fieldName;
    
    if (isGenerating) {
      return (
        <button
          type="button"
          onClick={handleCancelFieldGeneration}
          className="field-generate-btn cancel"
          title="Cancel generation"
        >
          ×
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() => handleGenerateField(characterId, fieldName, fieldDisplayName)}
        disabled={disabled || !!fieldGenerationInProgress}
        title={`Generate ${fieldDisplayName.toLowerCase()}`}
        className="field-generate-btn"
      >
        ✨
      </button>
    );
  };

  return (
    <div className="characters-tab">
      <div className="characters-tab__header">
        <h3 className="characters-tab__title">Characters</h3>
        <div className="characters-tab__actions">
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddCharacter}
            icon={<FaPlus />}
          >
            Add Character
          </Button>
          {!isGenerating ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleGenerateRandomCharacter}
              icon={<FaRandom />}
              disabled={isLoading}
            >
              Generate Character
            </Button>
          ) : (
            <Button
              variant="danger"
              size="sm"
              onClick={handleCancelGeneration}
              icon={<FaTimes />}
            >
              Cancel Generation
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowImportModal(true)}
            icon={<FaDownload />}
          >
            Import
          </Button>
        </div>
      </div>

      <div className="characters-tab__content">
        {characters.length === 0 ? (
          <div className="characters-tab__empty">
            <div className="characters-tab__empty-icon">
              <FaUser />
            </div>
            <p>No characters created yet.</p>
            <p>Click "Add Character" to create manually or "Generate Character" for AI-powered creation.</p>
          </div>
        ) : (
          <div className="characters-tab__list">
            {characters.map((character) => (
              <div key={character.id} className="character-card">
                <div 
                  className="character-card__header"
                  onClick={() => toggleCharacterExpanded(character.id)}
                >
                  <div className="character-card__info">
                    <h4 className="character-card__name">
                      {character.name || 'Unnamed Character'}
                    </h4>
                    {character.role && (
                      <span className="character-card__role">{character.role}</span>
                    )}
                  </div>
                  <div className="character-card__actions">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCharacter(character.id)}
                      icon={<FaTrash />}
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                {expandedCharacter === character.id && (
                  <div className="character-card__details">
                    <div className="character-card__grid">
                      <div className="input-with-generate">
                        <Input
                          label="Name"
                          value={
                            fieldGenerationInProgress?.characterId === character.id && 
                            fieldGenerationInProgress?.fieldName === 'name' 
                              ? fieldStreamedText 
                              : (character.name || '')
                          }
                          onChange={(value) => handleCharacterChange(character.id, 'name', value)}
                          placeholder="Character's full name"
                          disabled={!!fieldGenerationInProgress}
                        />
                        <FieldGenerateButton 
                          characterId={character.id}
                          fieldName="name" 
                          fieldDisplayName="Name" 
                          disabled={isLoading}
                        />
                      </div>
                      <div className="input-with-generate">
                        <Input
                          label="Alias/Nickname"
                          value={
                            fieldGenerationInProgress?.characterId === character.id && 
                            fieldGenerationInProgress?.fieldName === 'alias' 
                              ? fieldStreamedText 
                              : (character.alias || '')
                          }
                          onChange={(value) => handleCharacterChange(character.id, 'alias', value)}
                          placeholder="Nickname or alias"
                          disabled={!!fieldGenerationInProgress}
                        />
                        <FieldGenerateButton 
                          characterId={character.id}
                          fieldName="alias" 
                          fieldDisplayName="Alias" 
                          disabled={isLoading}
                        />
                      </div>
                      <div className="input-with-generate">
                        <Input
                          label="Role"
                          value={
                            fieldGenerationInProgress?.characterId === character.id && 
                            fieldGenerationInProgress?.fieldName === 'role' 
                              ? fieldStreamedText 
                              : (character.role || '')
                          }
                          onChange={(value) => handleCharacterChange(character.id, 'role', value)}
                          placeholder="e.g., Protagonist, Antagonist, Supporting"
                          disabled={!!fieldGenerationInProgress}
                        />
                        <FieldGenerateButton 
                          characterId={character.id}
                          fieldName="role" 
                          fieldDisplayName="Role" 
                          disabled={isLoading}
                        />
                      </div>
                      <div className="input-with-generate">
                        <Input
                          label="Gender"
                          value={
                            fieldGenerationInProgress?.characterId === character.id && 
                            fieldGenerationInProgress?.fieldName === 'gender' 
                              ? fieldStreamedText 
                              : (character.gender || '')
                          }
                          onChange={(value) => handleCharacterChange(character.id, 'gender', value)}
                          placeholder="Character's gender"
                          disabled={!!fieldGenerationInProgress}
                        />
                        <FieldGenerateButton 
                          characterId={character.id}
                          fieldName="gender" 
                          fieldDisplayName="Gender" 
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    
                    <div className="input-with-generate">
                      <Input
                        label="Appearance"
                        value={
                          fieldGenerationInProgress?.characterId === character.id && 
                          fieldGenerationInProgress?.fieldName === 'appearance' 
                            ? fieldStreamedText 
                            : (character.appearance || '')
                        }
                        onChange={(value) => handleCharacterChange(character.id, 'appearance', value)}
                        placeholder="Physical description..."
                        multiline
                        rows={3}
                        disabled={!!fieldGenerationInProgress}
                      />
                      <FieldGenerateButton 
                        characterId={character.id}
                        fieldName="appearance" 
                        fieldDisplayName="Appearance" 
                        disabled={isLoading}
                      />
                    </div>
                    
                    <div className="input-with-generate">
                      <Input
                        label="Backstory"
                        value={
                          fieldGenerationInProgress?.characterId === character.id && 
                          fieldGenerationInProgress?.fieldName === 'backstory' 
                            ? fieldStreamedText 
                            : (character.backstory || '')
                        }
                        onChange={(value) => handleCharacterChange(character.id, 'backstory', value)}
                        placeholder="Character's background and history..."
                        multiline
                        rows={4}
                        disabled={!!fieldGenerationInProgress}
                      />
                      <FieldGenerateButton 
                        characterId={character.id}
                        fieldName="backstory" 
                        fieldDisplayName="Backstory" 
                        disabled={isLoading}
                      />
                    </div>
                    
                    <div className="input-with-generate">
                      <Input
                        label="Additional Information"
                        value={
                          fieldGenerationInProgress?.characterId === character.id && 
                          fieldGenerationInProgress?.fieldName === 'extraInfo' 
                            ? fieldStreamedText 
                            : (character.extraInfo || '')
                        }
                        onChange={(value) => handleCharacterChange(character.id, 'extraInfo', value)}
                        placeholder="Personality traits, motivations, goals..."
                        multiline
                        rows={3}
                        disabled={!!fieldGenerationInProgress}
                      />
                      <FieldGenerateButton 
                        characterId={character.id}
                        fieldName="extraInfo" 
                        fieldDisplayName="Additional Info" 
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showImportModal && (
        <ImportModal
          show={showImportModal}
          onClose={() => setShowImportModal(false)}
          title="Import Characters"
          onImport={handleImport}
          extractContent={(scenario) => scenario.characters || []}
          renderCheckboxes={true}
          getCheckboxItems={(scenario) => scenario.characters || []}
          itemType="characters"
          renderItemLabel={(character) => (
            <span>
              <strong>{character.name || 'Unnamed Character'}</strong>
              {character.role && <span> - {character.role}</span>}
            </span>
          )}
        />
      )}
    </div>
  );
};
