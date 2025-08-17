import React, { useEffect, useRef, useState } from 'react';
import { FaPlus, FaRandom, FaTimes, FaUser } from 'react-icons/fa';
import { FaWandMagicSparkles } from 'react-icons/fa6';
import { getRandomCharacterPhoto, uploadCharacterPhoto } from '../../../../services/characterPhotoService';
import { Character, Scenario } from '../../../../types/ScenarioTypes';
import { showUserFriendlyError } from '../../../../utils/errorHandling';
import { isImageGenerationAvailable } from '../../../../services/featureDetection';
import { getSavedSettings } from '../../../../services/settings';
import { generateImage, createCharacterImagePrompt } from '../../../../services/imageGenerationService';
import { ImageGenerationModal } from '../../modals/ImageGenerationModal';
import './CharacterPhoto.css';

interface CharacterPhotoProps {
  character: Character;
  onPhotoUpdate?: (character: Character) => void;
  size?: 'small' | 'medium' | 'large';
  editable?: boolean;
  scenario?: Scenario; // Add scenario to get genre for random photos
  showRandomizeButton?: boolean; // Control whether to show randomize button
}

export const CharacterPhoto: React.FC<CharacterPhotoProps> = ({
  character,
  onPhotoUpdate,
  size = 'medium',
  editable = false,
  scenario,
  showRandomizeButton = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [canGenerateImages, setCanGenerateImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if image generation is available for current backend
  useEffect(() => {
    const checkImageGeneration = async () => {
      try {
        const settings = await getSavedSettings();
        if (settings) {
          setCanGenerateImages(isImageGenerationAvailable(settings.backendType));
        }
      } catch (error) {
        console.error('Failed to check image generation capability:', error);
        setCanGenerateImages(false);
      }
    };
    
    checkImageGeneration();
  }, []);

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

  const handleRandomizePhoto = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!scenario || !onPhotoUpdate) return;

    setIsRandomizing(true);
    try {
      // Get the genre from scenario, default to 'general' if not available
      const genre = scenario.writingStyle?.genre || 'general';
      
      // Normalize character gender to match backend expectations
      const normalizeGender = (gender?: string): string | undefined => {
        if (!gender) return undefined;
        
        const lowerGender = gender.toLowerCase().trim();
        
        // Map various gender inputs to our three categories
        if (lowerGender.includes('male') && !lowerGender.includes('female')) {
          return 'male';
        } else if (lowerGender.includes('female')) {
          return 'female';
        } else if (lowerGender.includes('non-binary') || 
                   lowerGender.includes('nonbinary') || 
                   lowerGender.includes('other') || 
                   lowerGender.includes('genderless') ||
                   lowerGender.includes('neutral')) {
          return 'other';
        }
        
        return undefined; // Let backend choose randomly
      };
      
      const normalizedGender = normalizeGender(character.gender);
      
      // Fetch a random character photo URL with gender preference
      const { url } = await getRandomCharacterPhoto(genre, normalizedGender);
      
      // Update character with the random photo URL
      const updatedCharacter = {
        ...character,
        photoId: undefined, // Clear photoId since this is an external URL
        photoUrl: url,
      };
      
      onPhotoUpdate(updatedCharacter);
      
      // Reset image error state
      setImageError(false);

    } catch (error) {
      console.error('Failed to get random photo:', error);
      showUserFriendlyError(
        error instanceof Error ? error : new Error('Failed to get random photo'),
        'Random Photo'
      );
    } finally {
      setIsRandomizing(false);
    }
  };

  const handleAIGeneration = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!canGenerateImages || !onPhotoUpdate) return;
    
    setIsGeneratingAI(true);
    try {
      // Create prompt for character image
      const prompt = createCharacterImagePrompt(character, scenario);
      
      // Generate image
      const result = await generateImage({
        prompt,
        model: 'dall-e-3', // Default model, could be configurable
        n: 1,
        size: '1024x1024'
      });

      if (result.data && result.data.length > 0) {
        const generatedImage = result.data[0];
        
        // Update character with the generated image
        const updatedCharacter = {
          ...character,
          photoId: undefined, // This is a generated image, not an uploaded one
          photoUrl: generatedImage.url,
        };
        
        onPhotoUpdate(updatedCharacter);
        setImageError(false);
      }
    } catch (error) {
      console.error('Failed to generate AI character image:', error);
      showUserFriendlyError(
        error instanceof Error ? error : new Error('Failed to generate AI character image'),
        'AI Generation Error'
      );
    } finally {
      setIsGeneratingAI(false);
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
    if (isUploading || isRandomizing || isGeneratingAI) classes += ' character-photo--uploading';
    return classes;
  };

  const hasPhoto = character.photoUrl && !imageError;

  return (
    <div className={getContainerClass()}>
      <div className="character-photo__container" onClick={handlePhotoClick}>
        {isUploading || isRandomizing || isGeneratingAI ? (
          <div className="character-photo__uploading">
            <div className="spinner"></div>
            <span>
              {isUploading ? 'Uploading...' : 
               isRandomizing ? 'Getting random photo...' : 
               '✨ Generating AI image...'}
            </span>
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
                <div className="character-photo__buttons">
                  {canGenerateImages && (
                    <button
                      className="character-photo__action-btn character-photo__ai-btn"
                      onClick={handleAIGeneration}
                      title="Generate AI image"
                    >
                      <FaWandMagicSparkles />
                    </button>
                  )}
                  {showRandomizeButton && (
                    <button
                      className="character-photo__action-btn character-photo__randomize-btn"
                      onClick={handleRandomizePhoto}
                      title="Get random photo"
                    >
                      <FaRandom />
                    </button>
                  )}
                  <button
                    className="character-photo__action-btn character-photo__remove-btn"
                    onClick={handleRemovePhoto}
                    title="Remove photo"
                  >
                    <FaTimes />
                  </button>
                </div>
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
                <div className="character-photo__buttons">
                  {canGenerateImages && (
                    <button
                      className="character-photo__action-btn character-photo__ai-btn"
                      onClick={handleAIGeneration}
                      title="Generate AI image"
                    >
                      <FaWandMagicSparkles />
                    </button>
                  )}
                  {showRandomizeButton && (
                    <button
                      className="character-photo__action-btn character-photo__randomize-btn"
                      onClick={handleRandomizePhoto}
                      title="Get random photo"
                    >
                      <FaRandom />
                    </button>
                  )}
                </div>
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

      <ImageGenerationModal 
        isOpen={isGeneratingAI} 
        title="Generating Character Image"
      />
    </div>
  );
};
