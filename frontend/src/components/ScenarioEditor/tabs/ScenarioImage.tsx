import React, { useCallback, useRef, useState } from 'react';
import { FaPlus, FaTrash, FaUser } from 'react-icons/fa';
import { deleteScenarioImage, uploadScenarioImage } from '../../../services/scenarioImageService';
import { Scenario } from '../../../types/ScenarioTypes';
import { showUserFriendlyError } from '../../../utils/errorHandling';
import { Button } from '../common/Button';
import './ScenarioImage.css';

interface ScenarioImageProps {
  scenario: Scenario;
  onScenarioChange: (updates: Partial<Scenario>) => void;
  className?: string;
}

export const ScenarioImage: React.FC<ScenarioImageProps> = ({
  scenario,
  onScenarioChange,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  }, []);

  const handleImageUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      let result;
      
      if (scenario.id) {
        // If scenario has an ID, use the existing endpoint
        result = await uploadScenarioImage(scenario.id, file);
        
        // Update scenario with image information
        onScenarioChange({
          imageId: result.imageId,
          imageUrl: result.imageUrl
        });
      } else {
        // If scenario doesn't have an ID, upload with scenario data
        result = await uploadScenarioImage(scenario.id, file);
        
        // Update the entire scenario with the saved version including image info
        onScenarioChange(result.scenario);
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
                  disabled={isUploading}
                  icon={<FaPlus />}
                  className="scenario-image__action-btn"
                >
                  Replace
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleImageDelete}
                  disabled={isUploading}
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
            className={`scenario-image__placeholder ${isUploading ? 'scenario-image__placeholder--uploading' : ''}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <>
                <FaPlus className="scenario-image__placeholder-icon scenario-image__placeholder-icon--uploading" />
                <span className="scenario-image__placeholder-text">Uploading...</span>
              </>
            ) : (
              <>
                <FaUser className="scenario-image__placeholder-icon" />
                <span className="scenario-image__placeholder-text">
                  Click or drag image here
                </span>
                <span className="scenario-image__placeholder-hint">
                  Add a cover image for your scenario
                </span>
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
          disabled={isUploading}
        />
      </div>
    </div>
  );
};
