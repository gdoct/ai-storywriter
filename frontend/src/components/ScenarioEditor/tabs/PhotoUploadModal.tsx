import React, { useCallback, useRef, useState } from 'react';
import { FaPlus, FaTimes, FaUser } from 'react-icons/fa';
import { createCharacterFromPhotoPrompt } from '../../../services/llmPromptService';
import { getToken } from '../../../services/security';
import { Character, Scenario } from '../../../types/ScenarioTypes';
import { showUserFriendlyError } from '../../../utils/errorHandling';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import './PhotoUploadModal.css';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCharacterCreated: (character: Character) => void;
  scenario: Scenario;
}

export const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  isOpen,
  onClose,
  onCharacterCreated,
  scenario,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [characterName, setCharacterName] = useState('');
  const [characterRole, setCharacterRole] = useState('');
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showUserFriendlyError(new Error('Please select a valid image file'), 'File Upload');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      showUserFriendlyError(new Error('File size must be less than 10MB'), 'File Upload');
      return;
    }

    setSelectedFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) {
      return;
    }

    const token = getToken();
    if (!token) {
      showUserFriendlyError(new Error('Please log in to upload photos'), 'Authentication');
      return;
    }

    setIsUploading(true);

    try {
      // Generate the prompt using the service
      const prompt = createCharacterFromPhotoPrompt(scenario,
        characterName.trim() || undefined,
        characterRole.trim() || undefined,
        additionalPrompt.trim() || undefined
      );

      const formData = new FormData();
      formData.append('photo', selectedFile);
      formData.append('prompt', prompt);

      const response = await fetch('/api/characters/create-from-photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        // Try to get error data, but handle cases where response isn't JSON
        let errorMessage = 'Failed to create character from photo';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          // If response isn't JSON, try to get it as text
          try {
            const errorText = await response.text();
            console.error('Non-JSON error response:', errorText);
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          } catch (textError) {
            console.error('Failed to read error response:', textError);
          }
        }
        throw new Error(errorMessage);
      }

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        const responseText = await response.text();
        console.error('Response was:', responseText);
        throw new Error('Server returned invalid response format');
      }
      
      // Create character object with the response data
      const newCharacter: Character = {
        id: result.character.id || Date.now().toString(), // Fallback ID if not provided
        name: result.character.name,
        alias: result.character.alias,
        role: result.character.role,
        gender: result.character.gender,
        appearance: result.character.appearance,
        backstory: result.character.backstory,
        extraInfo: result.character.extraInfo,
        photoId: result.photoId,
        photoUrl: result.photoUrl,
      };

      onCharacterCreated(newCharacter);
      onClose();
      
      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setCharacterName('');
      setCharacterRole('');
      setAdditionalPrompt('');
      
    } catch (error) {
      console.error('Error uploading photo:', error);
      showUserFriendlyError(error instanceof Error ? error : new Error('Failed to create character from photo'), 'Photo Upload');
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, scenario.id, characterName, characterRole, additionalPrompt, onCharacterCreated, onClose]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        // Manually trigger file selection by setting the file and preview
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  }, [handleFileSelect]);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="photo-upload-modal-overlay">
      <div className="photo-upload-modal">
        <div className="photo-upload-modal__header">
          <h3>Create Character from Photo</h3>
          <button
            className="photo-upload-modal__close"
            onClick={onClose}
            disabled={isUploading}
          >
            <FaTimes />
          </button>
        </div>

        <div className="photo-upload-modal__content">
          <div className="photo-upload-section">
            <label className="photo-upload-label">Photo</label>
            
            {!selectedFile ? (
              <div
                className="photo-drop-zone"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <FaUser className="photo-drop-zone__icon" />
                <p>Drag and drop a photo here, or click to select</p>
                <p className="photo-drop-zone__hint">Supports JPG, PNG, GIF (max 10MB)</p>
              </div>
            ) : (
              <div className="photo-preview">
                <img
                  src={previewUrl || ''}
                  alt="Preview"
                  className="photo-preview__image"
                />
                <button
                  className="photo-preview__remove"
                  onClick={handleRemoveFile}
                  disabled={isUploading}
                >
                  <FaTimes />
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          <div className="character-details-section">
            <label className="character-detail-label">Character Details (Optional)</label>
            <p className="character-detail-hint">
              Provide hints to help the AI generate more accurate character attributes
            </p>
            
            <Input
              label="Character Name"
              value={characterName}
              onChange={(value) => setCharacterName(value)}
              placeholder="e.g., Alice, John, etc."
              disabled={isUploading}
            />
            
            <Input
              label="Character Role"
              value={characterRole}
              onChange={(value) => setCharacterRole(value)}
              placeholder="e.g., protagonist, antagonist, supporting"
              disabled={isUploading}
            />
            
            <div className="input-group">
              <label className="input-label">Additional Prompt</label>
              <textarea
                className="input-textarea"
                value={additionalPrompt}
                onChange={(e) => setAdditionalPrompt(e.target.value)}
                placeholder="Any additional context or specific traits you want the AI to consider..."
                rows={3}
                disabled={isUploading}
              />
            </div>
          </div>
        </div>

        <div className="photo-upload-modal__footer">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            icon={<FaPlus />}
          >
            {isUploading ? 'Creating Character...' : 'Create Character'}
          </Button>
        </div>
      </div>
    </div>
  );
};
