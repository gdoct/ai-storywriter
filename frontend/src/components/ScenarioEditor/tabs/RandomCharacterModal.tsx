import React, { useCallback, useState } from 'react';
import { FaRandom, FaTimes } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import { useAIStatus } from '../../../contexts/AIStatusContext';
import { useAuthenticatedUser } from '../../../contexts/AuthenticatedUserContext';
import { generateRandomCharacter } from '../../../services/storyGenerator';
import { Character, Scenario } from '../../../types/ScenarioTypes';
import { showUserFriendlyError } from '../../../utils/errorHandling';
import Modal from '../../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import './RandomCharacterModal.css';

interface RandomCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCharacterCreated: (character: Character) => void;
  scenario: Scenario;
}

export const RandomCharacterModal: React.FC<RandomCharacterModalProps> = ({
  isOpen,
  onClose,
  onCharacterCreated,
  scenario,
}) => {
  const [characterType, setCharacterType] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [cancelGeneration, setCancelGeneration] = useState<(() => void) | null>(null);
  const { setAiStatus, setShowAIBusyModal } = useAIStatus();
  const { refreshCredits } = useAuthenticatedUser();

  // Determine suggested character type based on existing characters
  const getSuggestedCharacterType = useCallback(() => {
    const existingRoles = scenario.characters?.map(c => c.role?.toLowerCase()) || [];
    
    if (!existingRoles.includes('protagonist')) {
      return 'protagonist';
    } else if (!existingRoles.includes('antagonist')) {
      return 'antagonist';
    } else {
      return 'supporting';
    }
  }, [scenario.characters]);

  // Initialize character type when modal opens
  React.useEffect(() => {
    if (isOpen && !characterType) {
      setCharacterType(getSuggestedCharacterType());
    }
  }, [isOpen, characterType, getSuggestedCharacterType]);

  const handleGenerate = useCallback(async () => {
    if (!characterType.trim()) {
      showUserFriendlyError(new Error('Please specify a character type'), 'Character Generation');
      return;
    }

    try {
      setIsGenerating(true);
      
      const generationResult = await generateRandomCharacter(
        scenario,
        characterType.trim(),
        {
          onProgress: () => {}, // No progress needed for modal
          temperature: 0.8,
          additionalInstructions: additionalInstructions.trim() || undefined
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
        
        onCharacterCreated(newCharacter);
        
        // Reset form and close modal
        setCharacterType('');
        setAdditionalInstructions('');
        onClose();
        
        // Refresh credits after successful generation
        setTimeout(() => {
          refreshCredits();
        }, 1000);
      } catch (error) {
        console.log('Character generation was interrupted:', error);
        // Still refresh credits in case of partial consumption
        setTimeout(() => {
          refreshCredits();
        }, 1000);
      }
    } catch (error) {
      console.error('Error generating character:', error);
      if (error instanceof Error) {
        showUserFriendlyError(error, 'Character Generation');
      }
    } finally {
      setIsGenerating(false);
      setCancelGeneration(null);
    }
  }, [scenario, characterType, additionalInstructions, onCharacterCreated, onClose, setAiStatus, setShowAIBusyModal, refreshCredits]);

  const handleCancel = useCallback(() => {
    if (cancelGeneration) {
      cancelGeneration();
    }
  }, [cancelGeneration]);

  const handleClose = useCallback(() => {
    if (isGenerating) {
      handleCancel();
    }
    // Reset form when closing
    setCharacterType('');
    setAdditionalInstructions('');
    onClose();
  }, [isGenerating, handleCancel, onClose]);

  const footer = (
    <div className="random-character-modal__footer">
      <Button
        variant="ghost"
        onClick={handleClose}
        disabled={isGenerating}
      >
        Cancel
      </Button>
      {!isGenerating ? (
        <Button
          variant="primary"
          onClick={handleGenerate}
          icon={<FaRandom />}
          disabled={!characterType.trim()}
        >
          Generate Character
        </Button>
      ) : (
        <Button
          variant="danger"
          onClick={handleCancel}
          icon={<FaTimes />}
        >
          Cancel Generation
        </Button>
      )}
    </div>
  );

  return (
    <Modal
      show={isOpen}
      onClose={handleClose}
      title="Generate Random Character"
      footer={footer}
    >
      <div className="random-character-modal">
        <div className="random-character-modal__form">
          <Input
            label="Character Type"
            value={characterType}
            onChange={setCharacterType}
            placeholder="e.g., protagonist, antagonist, supporting, mentor, villain..."
            disabled={isGenerating}
          />
          
          <Input
            label="Additional Instructions (Optional)"
            value={additionalInstructions}
            onChange={setAdditionalInstructions}
            placeholder="e.g., mysterious background, comic relief, has magical abilities..."
            multiline
            rows={3}
            disabled={isGenerating}
          />
          
          <div className="random-character-modal__help">
            <p>
              <strong>Suggested character type:</strong> {getSuggestedCharacterType()}
            </p>
            <p>
              The AI will create a character that fits your story's genre and existing characters.
              You can provide additional instructions to customize the character's traits.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
