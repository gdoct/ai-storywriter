import { Button } from '@drdata/ai-styles';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaDice, FaPlus, FaTrash, FaUser } from 'react-icons/fa';
import { FaWandMagicSparkles } from 'react-icons/fa6';
import { deleteScenarioImage, getRandomScenarioImage, uploadScenarioImage } from '@shared/services/scenarioImageService';
import { Scenario } from '@shared/types/ScenarioTypes';
import { showUserFriendlyError } from '@shared/utils/errorHandling';
import { isImageGenerationAvailable } from '@shared/services/featureDetection';
import { getSavedSettings } from '@shared/services/settings';
import { generateImage, createScenarioImagePrompt } from '@shared/services/imageGenerationService';
import { ImageGenerationModal } from '../../modals/ImageGenerationModal';
import './ScenarioImage.css';

interface ScenarioImageProps {
  scenario: Scenario;
  onScenarioChange: (updates: Partial<Scenario>) => void;
  className?: string;
  genre?: string;
}

export const ScenarioImage: React.FC<ScenarioImageProps> = ({
  scenario,
  onScenarioChange,
  className = '',
  genre
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isFetchingRandom, setIsFetchingRandom] = useState(false);
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

  const handleRandomImage = useCallback(async () => {
    if (!genre) return;
    
    setIsFetchingRandom(true);
    try {
      const result = await getRandomScenarioImage(genre);
      onScenarioChange({
        imageUrl: result.url,
        imageId: undefined // This is a random image, not an uploaded one
      });
      setImageError(false);
    } catch (error) {
      console.error('Failed to get random image:', error);
      showUserFriendlyError(
        error instanceof Error ? error : new Error('Failed to get random image'),
        'Random Image Error'
      );
    } finally {
      setIsFetchingRandom(false);
    }
  }, [genre, onScenarioChange]);

  const handleAIGeneration = useCallback(async () => {
    if (!canGenerateImages) return;
    
    setIsGeneratingAI(true);
    try {
      // Create prompt for scenario image
      const prompt = createScenarioImagePrompt(scenario);

      // Generate image
      const result = await generateImage(prompt, {
        model: 'dall-e-3', // Default model, could be configurable
        n: 1,
        size: '1024x1024'
      });

      if (result.images && result.images.length > 0) {
        const generatedImage = result.images[0];
        onScenarioChange({
          imageUrl: generatedImage.url,
          imageId: undefined // This is a generated image, not an uploaded one
        });
        setImageError(false);
      }
    } catch (error) {
      console.error('Failed to generate AI image:', error);
      showUserFriendlyError(
        error instanceof Error ? error : new Error('Failed to generate AI image'),
        'AI Generation Error'
      );
    } finally {
      setIsGeneratingAI(false);
    }
  }, [canGenerateImages, scenario, onScenarioChange]);

  // Auto-fetch random image when genre changes and no image is set
  useEffect(() => {
    if (genre && !scenario.imageUrl && !scenario.imageId) {
      handleRandomImage();
    }
  }, [genre, scenario.imageUrl, scenario.imageId, handleRandomImage]);

  const handleImageUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    
    try {
      let result;
      
      if (scenario.id && scenario.id.trim() !== '') {
        // If scenario has an ID, use the existing endpoint
        result = await uploadScenarioImage(scenario.id, file);
        
        // Use the full scenario returned from backend if available, otherwise just update image info
        if (result.scenario) {
          onScenarioChange(result.scenario);
        } else {
          onScenarioChange({
            imageId: result.imageId,
            imageUrl: result.imageUrl
          });
        }
      } else {
        throw new Error('An active, saved scenario is required to upload an image');
      }

      // Reset image error state
      setImageError(false);

    } catch (error) {
      console.error('Failed to upload image:', error);
      showUserFriendlyError(
        error instanceof Error ? error : new Error('Failed to upload image'),
        'Upload Error'
      );
    } finally {
      setIsUploading(false);
    }
  }, [scenario, onScenarioChange]);

  const handleImageSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
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

    handleImageUpload(file);
  }, [handleImageUpload]);

  const handleImageDelete = useCallback(async () => {
    if (!scenario.imageId) return;

    setIsUploading(true);
    try {
      // If scenario has an ID, delete from server
      if (scenario.id) {
        await deleteScenarioImage(scenario.id);
      }
      
      // Remove image information from scenario (works for both saved and unsaved scenarios)
      onScenarioChange({
        imageId: undefined,
        imageUrl: undefined
      });

    } catch (error) {
      console.error('Failed to delete image:', error);
      showUserFriendlyError(
        error instanceof Error ? error : new Error('Failed to delete image'),
        'Delete Error'
      );
    } finally {
      setIsUploading(false);
    }
  }, [scenario.id, scenario.imageId, onScenarioChange]);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleImageUpload(file);
      }
    }
  }, [handleImageUpload]);

  const hasImage = scenario.imageUrl && !imageError;

  return (
    <div className={`scenario-image ${className}`}>
      <div className="scenario-image__container">
        {hasImage ? (
          <div className="scenario-image__preview">
            <img
              src={scenario.imageUrl}
              alt="Scenario cover"
              className="scenario-image__image"
              onError={handleImageError}
            />
            <div className="scenario-image__overlay">
              <div className="scenario-image__actions">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isFetchingRandom || isGeneratingAI}
                  icon={<FaPlus />}
                  className="scenario-image__action-btn"
                >
                  Replace
                </Button>
                {canGenerateImages && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAIGeneration}
                    disabled={isUploading || isFetchingRandom || isGeneratingAI}
                    icon={<FaWandMagicSparkles />}
                    className="scenario-image__action-btn"
                  >
                    ✨ AI
                  </Button>
                )}
                {genre && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRandomImage}
                    disabled={isUploading || isFetchingRandom || isGeneratingAI}
                    icon={<FaDice />}
                    className="scenario-image__action-btn"
                  >
                    Random
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleImageDelete}
                  disabled={isUploading || isFetchingRandom || isGeneratingAI}
                  icon={<FaTrash />}
                  className="scenario-image__action-btn scenario-image__action-btn--danger"
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`scenario-image__placeholder ${(isUploading || isFetchingRandom || isGeneratingAI) ? 'scenario-image__placeholder--uploading' : ''}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <>
                <FaPlus className="scenario-image__placeholder-icon scenario-image__placeholder-icon--uploading" />
                <span className="scenario-image__placeholder-text">Uploading...</span>
              </>
            ) : isFetchingRandom ? (
              <>
                <FaDice className="scenario-image__placeholder-icon scenario-image__placeholder-icon--uploading" />
                <span className="scenario-image__placeholder-text">Getting random image...</span>
              </>
            ) : isGeneratingAI ? (
              <>
                <FaWandMagicSparkles className="scenario-image__placeholder-icon scenario-image__placeholder-icon--uploading" />
                <span className="scenario-image__placeholder-text">✨ Generating AI image...</span>
              </>
            ) : (
              <>
                <FaUser className="scenario-image__placeholder-icon" />
                <div className="scenario-image__placeholder-content">
                  <span className="scenario-image__placeholder-text">
                    Click or drag image here{genre ? ', or get a random image' : ', or select a genre'}
                  </span>
                  <span className="scenario-image__placeholder-hint">
                    Add a cover image for your scenario
                  </span>
                  <div className="scenario-image__placeholder-actions">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || isFetchingRandom || isGeneratingAI}
                      icon={<FaPlus />}
                      className="scenario-image__placeholder-btn"
                    >
                      Upload Image
                    </Button>
                    {canGenerateImages && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleAIGeneration}
                        disabled={isUploading || isFetchingRandom || isGeneratingAI}
                        icon={<FaWandMagicSparkles />}
                        className="scenario-image__placeholder-btn"
                      >
                        ✨ Generate AI
                      </Button>
                    )}
                    {genre && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRandomImage}
                        disabled={isUploading || isFetchingRandom || isGeneratingAI}
                        icon={<FaDice />}
                        className="scenario-image__placeholder-btn"
                      >
                        Random Image
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          style={{ display: 'none' }}
          disabled={isUploading || isGeneratingAI}
        />
      </div>

      <ImageGenerationModal 
        isOpen={isGeneratingAI} 
        title="Generating Scenario Image"
      />
    </div>
  );
};
