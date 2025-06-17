import React, { useRef, useState } from 'react';
import { FaPlus, FaTimes, FaUser } from 'react-icons/fa';
import { uploadCharacterPhoto } from '../../../services/characterPhotoService';
import { Character } from '../../../types/ScenarioTypes';
import { showUserFriendlyError } from '../../../utils/errorHandling';
import './CharacterPhoto.css';

interface CharacterPhotoProps {
  character: Character;
  onPhotoUpdate?: (character: Character) => void;
  size?: 'small' | 'medium' | 'large';
  editable?: boolean;
}

export const CharacterPhoto: React.FC<CharacterPhotoProps> = ({
  character,
  onPhotoUpdate,
  size = 'medium',
  editable = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showUserFriendlyError(new Error('Please select a valid image file'), 'Photo Upload');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      showUserFriendlyError(new Error('File size must be less than 5MB'), 'Photo Upload');
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadCharacterPhoto(character.id, file);
      
      // Update character with photo information
      const updatedCharacter = {
        ...character,
        photoId: result.photoId,
        photoUrl: result.photoUrl,
      };
      
      if (onPhotoUpdate) {
        onPhotoUpdate(updatedCharacter);
      }

      // Reset image error state
      setImageError(false);

    } catch (error) {
      console.error('Failed to upload photo:', error);
      showUserFriendlyError(
        error instanceof Error ? error : new Error('Failed to upload photo'),
        'Photo Upload'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handlePhotoClick = () => {
    if (editable && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemovePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const updatedCharacter = {
      ...character,
      photoId: undefined,
      photoUrl: undefined,
    };
    
    if (onPhotoUpdate) {
      onPhotoUpdate(updatedCharacter);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const getPictogramIcon = () => {
    const gender = character.gender?.toLowerCase() || '';
    
    if (gender.includes('male') && !gender.includes('female')) {
      return <span className="gender-icon male">♂</span>;
    } else if (gender.includes('female')) {
      return <span className="gender-icon female">♀</span>;
    } else if (gender.includes('non-binary') || gender.includes('nonbinary') || 
               gender.includes('other') || gender.includes('genderless')) {
      return <span className="gender-icon other">⚬</span>;
    } else {
      return <FaUser />;
    }
  };

  const getContainerClass = () => {
    let classes = 'character-photo';
    classes += ` character-photo--${size}`;
    if (editable) classes += ' character-photo--editable';
    if (isUploading) classes += ' character-photo--uploading';
    return classes;
  };

  const hasPhoto = character.photoUrl && !imageError;

  return (
    <div className={getContainerClass()}>
      <div className="character-photo__container" onClick={handlePhotoClick}>
        {isUploading ? (
          <div className="character-photo__uploading">
            <div className="spinner"></div>
            <span>Uploading...</span>
          </div>
        ) : hasPhoto ? (
          <div className="character-photo__image">
            <img 
              src={character.photoUrl} 
              alt={character.name || 'Character'} 
              onError={handleImageError}
            />
            {editable && (
              <div className="character-photo__overlay">
                <FaPlus className="character-photo__camera-icon" />
                <button
                  className="character-photo__remove-btn"
                  onClick={handleRemovePhoto}
                  title="Remove photo"
                >
                  <FaTimes />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="character-photo__pictogram">
            {getPictogramIcon()}
            {editable && (
              <div className="character-photo__overlay">
                <FaPlus className="character-photo__camera-icon" />
                <span className="character-photo__upload-text">Add Photo</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      )}
    </div>
  );
};
