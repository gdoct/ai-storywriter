import { AiTextBox, Button } from '@drdata/ai-styles';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';
import { FaLocationDot } from 'react-icons/fa6';
import { getToken } from '../../../../services/security';
import { Location } from '../../../../types/ScenarioTypes';
import { showUserFriendlyError } from '../../../../utils/errorHandling';
import './LocationImageUploadModal.css';

interface LocationImageUploadModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onLocationGenerated: (location: Partial<Location>) => void;
}

export const LocationImageUploadModal: React.FC<LocationImageUploadModalProps> = ({
  isOpen = true,
  onClose,
  onLocationGenerated,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  // Progress tracking states
  const [generationProgress, setGenerationProgress] = useState<{
    stage: string;
    elapsedTime: number;
    tokensReceived?: number;
  }>({ stage: '', elapsedTime: 0 });
  const progressIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to start progress tracking
  const startProgressTracking = useCallback((stage: string) => {
    const startTime = Date.now();
    setGenerationProgress({ stage, elapsedTime: 0 });
    
    // Update elapsed time every second
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setGenerationProgress(prev => ({ ...prev, elapsedTime: elapsed }));
    }, 1000);
  }, []);

  // Helper function to update progress stage
  const updateProgressStage = useCallback((stage: string, tokensReceived?: number) => {
    setGenerationProgress(prev => ({ 
      ...prev, 
      stage,
      tokensReceived 
    }));
  }, []);

  // Helper function to stop progress tracking
  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setGenerationProgress({ stage: '', elapsedTime: 0 });
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }, []);

  const handleRemoveFile = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [previewUrl]);

  const createLocationPrompt = useCallback(() => {
    let prompt = "Analyze this image and create a detailed location description. ";
    
    if (locationName) {
      prompt += `This location is called "${locationName}". `;
    }
    
    prompt += "Please provide:\n";
    prompt += "1. A vivid visual description of the physical appearance and atmosphere\n";
    prompt += "2. Background information about the location's history, significance, and context\n";
    prompt += "3. Any additional details that would be useful for storytelling\n\n";
    
    if (additionalPrompt) {
      prompt += `Additional context: ${additionalPrompt}\n\n`;
    }
    
    prompt += "Return the response as a JSON object with these exact fields:\n";
    prompt += "{\n";
    prompt += '  "name": "Location name (if not provided, suggest one based on the image)",\n';
    prompt += '  "visualDescription": "Detailed physical description and atmosphere",\n';
    prompt += '  "background": "History, significance, and context",\n';
    prompt += '  "extraInfo": "Additional relevant details for storytelling"\n';
    prompt += "}";
    
    return prompt;
  }, [locationName, additionalPrompt]);

  const handleGenerateLocation = useCallback(async () => {
    if (!selectedFile) {
      showUserFriendlyError(new Error('Please select an image first.'));
      return;
    }

    setIsUploading(true);
    startProgressTracking('Preparing image...');

    try {
      // Create FormData for the upload
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('prompt', createLocationPrompt());

      updateProgressStage('Uploading image...', 0);

      // Upload and generate location
      const token = await getToken();
      const response = await fetch('/api/location-photos/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate location from image');
      }

      updateProgressStage('Processing image...', 50);
      const result = await response.json();
      updateProgressStage('Generating description...', 100);

      // Convert the uploaded file to base64 for storage
      const reader = new FileReader();
      reader.onload = () => {
        const locationData: Partial<Location> = {
          name: result.name || locationName || 'Generated Location',
          visualDescription: result.visualDescription || '',
          background: result.background || '',
          extraInfo: result.extraInfo || '',
          image_data: reader.result as string,
          image_mime_type: selectedFile.type,
        };

        onLocationGenerated(locationData);
        stopProgressTracking();
      };
      reader.readAsDataURL(selectedFile);

    } catch (error: any) {
      console.error('Location generation error:', error);
      showUserFriendlyError(error.message || 'Failed to generate location. Please try again.');
      stopProgressTracking();
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, createLocationPrompt, locationName, onLocationGenerated, startProgressTracking, updateProgressStage, stopProgressTracking]);

  const handleClose = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    stopProgressTracking();
    onClose();
  }, [previewUrl, stopProgressTracking, onClose]);

  if (!isOpen) return null;

  return (
    <div className="location-upload-modal-overlay" onClick={handleClose}>
      <div className="location-upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="location-upload-header">
          <div className="location-upload-title">
            <FaLocationDot /> Generate Location from Image
          </div>
          <button className="location-upload-close" onClick={handleClose}>
            <FaTimes />
          </button>
        </div>

        <div className="location-upload-content">
          {!selectedFile ? (
            <div className="location-upload-zone" onClick={() => fileInputRef.current?.click()}>
              <FaPlus className="location-upload-icon" />
              <div className="location-upload-text">
                <strong>Click to upload an image</strong>
                <div>Support for JPG, PNG, WebP files</div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div className="location-preview-section">
              <div className="location-preview">
                <img src={previewUrl || ''} alt="Location preview" />
                <button className="remove-image-btn" onClick={handleRemoveFile}>
                  <FaTimes />
                </button>
              </div>
              
              <div className="location-form">
                <div className="location-form-field">
                  <AiTextBox
                    label="Location Name (Optional)"
                    value={locationName}
                    onChange={setLocationName}
                    placeholder="e.g., Ancient Temple, Dark Forest..."
                  />
                </div>
                
                <div className="location-form-field">
                  <AiTextBox
                    label="Additional Context (Optional)"
                    value={additionalPrompt}
                    onChange={setAdditionalPrompt}
                    placeholder="Any specific details or context for this location..."
                  />
                </div>
              </div>
            </div>
          )}

          {generationProgress.stage && (
            <div className="generation-progress">
              <div className="progress-header">
                <div className="progress-stage">{generationProgress.stage}</div>
                <div className="progress-time">{generationProgress.elapsedTime}s</div>
              </div>
              {generationProgress.tokensReceived !== undefined && (
                <div className="progress-tokens">
                  Tokens processed: {generationProgress.tokensReceived}
                </div>
              )}
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
            </div>
          )}
        </div>

        <div className="location-upload-actions">
          <Button variant="secondary" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleGenerateLocation}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? 'Generating...' : 'Generate Location'}
          </Button>
        </div>
      </div>
    </div>
  );
};