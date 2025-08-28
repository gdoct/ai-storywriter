import { AiTextArea, AiTextBox, Button } from '@drdata/ai-styles';
import React, { useCallback, useMemo, useState } from 'react';
import { FaDownload, FaPlus, FaTrash, FaUser } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import { AI_STATUS, useAIStatus } from '../../../../../shared/contexts/AIStatusContext';
import { useAuth } from '../../../../../shared/contexts/AuthContext';
import { generateCharacterField } from '../../../../../shared/services/characterFieldGenerator';
import { generateAppearanceFromPhoto } from '../../../../../shared/services/characterPhotoService';
import { createPhotoBasedAppearancePrompt } from '../../../../../shared/services/llmPromptService';
import { Character } from '../../../../../shared/types/ScenarioTypes';
import { showUserFriendlyError } from '../../../../../shared/utils/errorHandling';
import ImportModal from '../../../../../shared/components/common/ImportModal';
import { TabProps } from '../../types';
import { CharacterPhoto } from '../CharacterPhoto';
import './CharactersTab.css';
import { PhotoUploadModal } from '../PhotoUploadModal';

export const CharactersTab: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty: _isDirty,
  isLoading,
}) => {
  // Wrap characters in useMemo to stabilize reference for useCallback deps
  const characters = useMemo(() => scenario.characters || [], [scenario.characters]);
  const [expandedCharacter, setExpandedCharacter] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [fieldGenerationInProgress, setFieldGenerationInProgress] = useState<{ characterId: string; fieldName: string } | null>(null);
  const [fieldStreamedText, setFieldStreamedText] = useState('');
  const [fieldCancelGeneration, setFieldCancelGeneration] = useState<(() => void) | null>(null);
  const { setAiStatus, setShowAIBusyModal } = useAIStatus();
  const { refreshCredits } = useAuth();

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

  const handleRemoveCharacter = useCallback(async (characterId: string) => {
    // Find the character to check if it has a photo
    const characterToRemove = characters.find(c => c.id === characterId);
    
    // If character has a photo, delete it from the backend
    if (characterToRemove?.photoId) {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          await fetch(`/api/characters/photos/${characterToRemove.photoId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
        }
      } catch (error) {
        console.error('Error deleting character photo:', error);
        // Continue with character deletion even if photo deletion fails
      }
    }
    
    // Remove character from the scenario
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

  const handleCharacterFromPhoto = useCallback((newCharacter: Character) => {
    // Add the new character from photo
    const updatedCharacters = [...characters, newCharacter];
    onScenarioChange({ characters: updatedCharacters });
    setExpandedCharacter(newCharacter.id);
    // Refresh credits after successful generation
    setTimeout(() => {
      refreshCredits();
    }, 1000);
  }, [characters, onScenarioChange, refreshCredits]);

  const handleGenerateField = useCallback(async (characterId: string, fieldName: string, fieldDisplayName: string) => {
    // If already generating this field, cancel it
    if (fieldGenerationInProgress?.characterId === characterId && fieldGenerationInProgress?.fieldName === fieldName) {
      if (fieldCancelGeneration) {
        fieldCancelGeneration();
      }
      setFieldCancelGeneration(null);
      setFieldGenerationInProgress(null);
      setFieldStreamedText('');
      return;
    }

    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    setFieldGenerationInProgress({ characterId, fieldName });
    setFieldStreamedText('');
    
    try {
      // Special handling for name field - use Faker.js instead of AI
      if (fieldName === 'name') {
        setAiStatus(AI_STATUS.BUSY);
        setShowAIBusyModal(true);
        
        try {
          // Use the character name generation service
          const { generateFullName } = await import('../../../../../shared/services/characterNameGenerator');
          const generatedName = await generateFullName(character.gender as any);
          
          // Update the character with the generated name
          const updatedCharacters = characters.map(char =>
            char.id === characterId
              ? { ...char, name: generatedName }
              : char
          );
          onScenarioChange({ characters: updatedCharacters });
          
          // Reset states
          setFieldStreamedText('');
          setFieldGenerationInProgress(null);
          setFieldCancelGeneration(null);
          setAiStatus(AI_STATUS.IDLE);
          setShowAIBusyModal(false);
          
          return;
        } catch (error) {
          console.error('Name generation failed:', error);
          
          // Reset states
          setFieldStreamedText('');
          setFieldGenerationInProgress(null);
          setAiStatus(AI_STATUS.IDLE);
          setShowAIBusyModal(false);
          
          // Show error
          if (error instanceof Error) {
            showUserFriendlyError(error, 'Name Generation');
          }
          
          return;
        }
      }
      
      // Special handling for appearance field when a photo is available
      if (fieldName === 'appearance' && character.photoId) {
        setAiStatus(AI_STATUS.BUSY);
        setShowAIBusyModal(true);
        
        try {
          // Create a proper prompt for appearance generation
          const prompt = createPhotoBasedAppearancePrompt(character, scenario);
          
          // Generate appearance based on the photo with the proper prompt
          const { appearance } = await generateAppearanceFromPhoto(
            character.photoId,
            prompt
          );
          
          // Update the character with the generated appearance
          const updatedCharacters = characters.map(char =>
            char.id === characterId
              ? { ...char, appearance }
              : char
          );
          onScenarioChange({ characters: updatedCharacters });
          
          // Reset states and refresh credits
          setFieldStreamedText('');
          setFieldGenerationInProgress(null);
          setFieldCancelGeneration(null);
          setAiStatus(AI_STATUS.IDLE);
          setShowAIBusyModal(false);
          
          setTimeout(() => { refreshCredits(); }, 1000);
          return;
        } catch (error) {
          console.error('Photo-based appearance generation failed:', error);
          
          // Reset states
          setFieldStreamedText('');
          setFieldGenerationInProgress(null);
          setAiStatus(AI_STATUS.IDLE);
          setShowAIBusyModal(false);
          
          // Show error and refresh credits
          if (error instanceof Error) {
            showUserFriendlyError(error, 'Photo-based Appearance Generation');
          }
          
          setTimeout(() => { refreshCredits(); }, 1000);
          return;
        }
      }
      
      // Regular field generation using LLM
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
        
        // Refresh credits
        setTimeout(() => { refreshCredits(); }, 1000);
      } catch (error) {
        console.error('Field generation failed:', error);
        setFieldStreamedText('');
        setFieldGenerationInProgress(null);
        setFieldCancelGeneration(null);
        
        // Refresh credits anyway
        setTimeout(() => { refreshCredits(); }, 1000);
      }
    } catch (error) {
      console.error('Error starting field generation:', error);
      
      // Show user-friendly error
      if (error instanceof Error) {
        showUserFriendlyError(error, `${fieldDisplayName} Generation`);
      }
      
      setFieldGenerationInProgress(null);
      setFieldCancelGeneration(null);
    }
  }, [scenario, characters, onScenarioChange, setAiStatus, setShowAIBusyModal, refreshCredits, fieldGenerationInProgress, fieldCancelGeneration]);


  const handleCharacterPhotoUpdate = useCallback((updatedCharacter: Character) => {
    const updatedCharacters = characters.map(char =>
      char.id === updatedCharacter.id ? updatedCharacter : char
    );
    onScenarioChange({ characters: updatedCharacters });
  }, [characters, onScenarioChange]);


  return (
    <div className="characters-tab">
      <div className="characters-tab__header">
        <h3 className="characters-tab__title">Characters</h3>
        <div className="characters-tab__actions">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowPhotoUploadModal(true)}
            icon={<FaUser />}
            disabled={isLoading}
            className='characters-tab__add-photo-btn'
          >
            Generate Character...
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddCharacter}
            icon={<FaPlus />}
          >
            Add Character
          </Button>
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
                  <div className="character-card__header-left">
                    <div className="character-card__thumbnail">
                      <CharacterPhoto
                        character={character}
                        onPhotoUpdate={handleCharacterPhotoUpdate}
                        size="small"
                        editable={false}
                        scenario={scenario}
                        showRandomizeButton={false}
                      />
                    </div>
                    <div className="character-card__info">
                      <h4 className="character-card__name">
                        {character.name || 'Unnamed Character'}
                      </h4>
                      {character.role && (
                        <span className="character-card__role">{character.role}</span>
                      )}
                    </div>
                  </div>
                  <div className="character-card__actions">
                    <div onClick={(e) => e.stopPropagation()}>
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
                </div>

                {expandedCharacter === character.id && (
                  <div className="character-card__details">
                    <div className="character-card__photo">
                      <CharacterPhoto
                        character={character}
                        onPhotoUpdate={handleCharacterPhotoUpdate}
                        size="medium"
                        editable={!isLoading && !fieldGenerationInProgress}
                        scenario={scenario}
                        showRandomizeButton={true}
                      />
                    </div>
                    <div className="character-card__fields">
                      <AiTextBox
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
                        onAiClick={() => handleGenerateField(character.id, 'name', 'Name')}
                        aiGenerating={fieldGenerationInProgress?.characterId === character.id && fieldGenerationInProgress?.fieldName === 'name'}
                      />
                      <AiTextBox
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
                        onAiClick={() => handleGenerateField(character.id, 'alias', 'Alias')}
                        aiGenerating={fieldGenerationInProgress?.characterId === character.id && fieldGenerationInProgress?.fieldName === 'alias'}
                      />
                      <AiTextBox
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
                        onAiClick={() => handleGenerateField(character.id, 'role', 'Role')}
                        aiGenerating={fieldGenerationInProgress?.characterId === character.id && fieldGenerationInProgress?.fieldName === 'role'}
                      />
                      <AiTextBox
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
                        onAiClick={() => handleGenerateField(character.id, 'gender', 'Gender')}
                        aiGenerating={fieldGenerationInProgress?.characterId === character.id && fieldGenerationInProgress?.fieldName === 'gender'}
                      />
                    </div>
                    
                    <AiTextArea
                      label="Appearance"
                      value={
                        fieldGenerationInProgress?.characterId === character.id && 
                        fieldGenerationInProgress?.fieldName === 'appearance' 
                          ? fieldStreamedText 
                          : (character.appearance || '')
                      }
                      onChange={(value) => handleCharacterChange(character.id, 'appearance', value)}
                      placeholder="Physical description..."
                      rows={3}
                      disabled={!!fieldGenerationInProgress}
                      onAiClick={() => handleGenerateField(character.id, 'appearance', 'Appearance')}
                      aiGenerating={fieldGenerationInProgress?.characterId === character.id && fieldGenerationInProgress?.fieldName === 'appearance'}
                    />
                    
                    <AiTextArea
                      label="Backstory"
                      value={
                        fieldGenerationInProgress?.characterId === character.id && 
                        fieldGenerationInProgress?.fieldName === 'backstory' 
                          ? fieldStreamedText 
                          : (character.backstory || '')
                      }
                      onChange={(value) => handleCharacterChange(character.id, 'backstory', value)}
                      placeholder="Character's background and history..."
                      rows={4}
                      disabled={!!fieldGenerationInProgress}
                      onAiClick={() => handleGenerateField(character.id, 'backstory', 'Backstory')}
                      aiGenerating={fieldGenerationInProgress?.characterId === character.id && fieldGenerationInProgress?.fieldName === 'backstory'}
                    />
                    
                    <AiTextArea
                      label="Additional Information"
                      value={
                        fieldGenerationInProgress?.characterId === character.id && 
                        fieldGenerationInProgress?.fieldName === 'extraInfo' 
                          ? fieldStreamedText 
                          : (character.extraInfo || '')
                      }
                      onChange={(value) => handleCharacterChange(character.id, 'extraInfo', value)}
                      placeholder="Personality traits, motivations, goals..."
                      rows={3}
                      disabled={!!fieldGenerationInProgress}
                      onAiClick={() => handleGenerateField(character.id, 'extraInfo', 'Additional Info')}
                      aiGenerating={fieldGenerationInProgress?.characterId === character.id && fieldGenerationInProgress?.fieldName === 'extraInfo'}
                    />
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
      
      {showPhotoUploadModal && (
        <PhotoUploadModal
          isOpen={showPhotoUploadModal}
          onClose={() => setShowPhotoUploadModal(false)}
          onCharacterCreated={handleCharacterFromPhoto}
          scenario={scenario}
        />
      )}
    </div>
  );
};
