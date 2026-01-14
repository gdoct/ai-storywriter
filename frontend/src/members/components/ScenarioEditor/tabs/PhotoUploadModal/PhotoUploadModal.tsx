import { AiTextBox, Button } from '@drdata/ai-styles';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaPlus, FaRandom, FaTimes, FaUser } from 'react-icons/fa';
import { getRandomCharacterPhoto } from '@shared/services/characterPhotoService';
import { generateRandomCharacter } from '@shared/services/storyGenerator';
import { Character, Scenario } from '@shared/types/ScenarioTypes';
import { showUserFriendlyError } from '@shared/utils/errorHandling';
import {
  generateCharacterWithAgent,
  buildCharacterFromFields,
  CharacterStreamingEvent,
  CharacterField
} from '@shared/services/characterAgentService';
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
  const [selectedGender, setSelectedGender] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [isLoadingRandomPhoto, setIsLoadingRandomPhoto] = useState(false);
  const [isUsingRandomPhoto, setIsUsingRandomPhoto] = useState(false);
  const [isGeneratingName, setIsGeneratingName] = useState(false);
  // Progress tracking states
  const [generationProgress, setGenerationProgress] = useState<{
    stage: string;
    elapsedTime: number;
    tokensReceived?: number;
  }>({ stage: '', elapsedTime: 0 });
  const progressIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Character agent state
  const [characterFields, setCharacterFields] = useState<CharacterField[]>([]);
  const [currentCharacterId, setCurrentCharacterId] = useState<string | null>(null);
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

  // Helper function to simulate progressive token counting during AI processing
  const simulateTokenProgress = useCallback((stage: string, estimatedDuration: number) => {
    return new Promise<void>((resolve) => {
      let tokens = 0;
      const tokenInterval = 200; // Update every 200ms
      const totalTokens = Math.floor(Math.random() * 500) + 200; // Random between 200-700 tokens
      const increment = totalTokens / (estimatedDuration / tokenInterval);

      updateProgressStage(stage, 0);
      
      const tokenTimer = setInterval(() => {
        tokens = Math.min(tokens + increment + Math.random() * increment * 0.5, totalTokens);
        updateProgressStage(stage, Math.floor(tokens));
        
        if (tokens >= totalTokens) {
          clearInterval(tokenTimer);
          resolve();
        }
      }, tokenInterval);
    });
  }, [updateProgressStage]);

  const generateCharacterName = useCallback(async () => {
    if (isGeneratingName) return;
    
    try {
      setIsGeneratingName(true);
      setCharacterName(''); // Clear existing name
      
      let accumulated = '';
      const generationResult = await generateRandomCharacter(
        scenario,
        'supporting', // character type for name generation
        {
          additionalInstructions: `Generate only a character name (first and last name) for a ${selectedGender || 'person'}. Do not include any other character details like appearance, backstory, or role. Just return the name in the format "FirstName LastName".`,
          onProgress: (generatedText) => {
            accumulated += generatedText;
            setCharacterName(accumulated);
          }
        }
      );
      
      try {
        const result = await generationResult.result;
        // Extract just the name from the generated character data
        let finalName = result;
        try {
          const parsedResult = JSON.parse(result);
          finalName = parsedResult.name || parsedResult.fullName || result;
        } catch {
          // If not JSON, try to extract name from text
          const nameMatch = result.match(/(?:Name|name):\s*([^\n\r,]+)/);
          if (nameMatch) {
            finalName = nameMatch[1].trim();
          } else {
            // Just use first line or clean up the result
            finalName = result.split('\n')[0].trim();
          }
        }
        setCharacterName(finalName);
      } catch (error) {
        console.error('Name generation failed:', error);
        // Keep the accumulated text if generation fails
      }
    } catch (error) {
      console.error('Error generating character name:', error);
      showUserFriendlyError(error instanceof Error ? error : new Error('Failed to generate name'), 'Name Generation');
    } finally {
      setIsGeneratingName(false);
    }
  }, [scenario, selectedGender, isGeneratingName]);

  const loadRandomPhoto = useCallback(async (gender?: string, genre?: string) => {
    setIsLoadingRandomPhoto(true);
    try {
      const effectiveGenre = genre || selectedGenre || scenario.writingStyle?.genre || 'general';
      const normalizedGender = gender || selectedGender || undefined;
      
      const { url } = await getRandomCharacterPhoto(effectiveGenre, normalizedGender);
      
      // Only update the preview URL after we have the new one to prevent flash
      setPreviewUrl(url);
      setSelectedFile(null); // Clear any uploaded file
      setIsUsingRandomPhoto(true);
    } catch (error) {
      console.error('Error loading random photo:', error);
      showUserFriendlyError(
        error instanceof Error ? error : new Error('Failed to load random photo'),
        'Random Photo'
      );
    } finally {
      setIsLoadingRandomPhoto(false);
    }
  }, [scenario.writingStyle?.genre, selectedGender, selectedGenre]);

  // Load initial random photo when modal opens
  useEffect(() => {
    if (isOpen && !previewUrl) {
      loadRandomPhoto();
    }
  }, [isOpen, loadRandomPhoto, previewUrl]);

  const handleGenderChange = useCallback((gender: string) => {
    setSelectedGender(gender);
    if (isUsingRandomPhoto) {
      loadRandomPhoto(gender);
    }
  }, [isUsingRandomPhoto, loadRandomPhoto]);

  const handleGenreChange = useCallback((genre: string) => {
    setSelectedGenre(genre);
    if (isUsingRandomPhoto) {
      loadRandomPhoto(undefined, genre);
    }
  }, [isUsingRandomPhoto, loadRandomPhoto]);

  const handleRefreshRandomPhoto = useCallback(() => {
    loadRandomPhoto();
  }, [loadRandomPhoto]);

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
    setIsUsingRandomPhoto(false); // User uploaded their own file

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile && !isUsingRandomPhoto) {
      return;
    }

    setIsUploading(true);
    startProgressTracking('Preparing character generation...');
    setCharacterFields([]);
    setCurrentCharacterId(null);

    try {
      updateProgressStage('Preparing image data...');

      // Prepare image file for character agent
      let imageFile: File | undefined;

      if (isUsingRandomPhoto && previewUrl) {
        // For random photos, fetch the image and convert it to a file
        const response = await fetch(previewUrl);
        const blob = await response.blob();
        imageFile = new File([blob], 'random-character.png', { type: blob.type });
      } else if (selectedFile) {
        // For uploaded files, use the file directly
        imageFile = selectedFile;
      }

      updateProgressStage('Starting character generation...');

      // Build scenario with user hints
      const enhancedScenario = {
        ...scenario,
        characterHints: {
          name: characterName.trim() || undefined,
          role: characterRole.trim() || undefined,
          gender: selectedGender || undefined,
          additionalPrompt: additionalPrompt.trim() || undefined,
        }
      };

      // Track generated fields for progress
      const receivedFields = new Set<string>();
      let finalCharacter: Character | null = null;
      let generatedImageUri: string | null = null;

      // Use character agent to generate character
      await generateCharacterWithAgent(
        {
          scenario: enhancedScenario,
          imageFile,
          generateImage: true, // Generate character portrait
          imageGenerationOptions: {
            size: '1024x1024',
            style: 'natural'
          }
        },
        (event: CharacterStreamingEvent) => {
          console.log('Character agent event:', event);

          if (event.event_type === 'field_update' && event.field) {
            // Update character fields
            setCharacterFields(prev => {
              const updated = [...prev];
              const existingIndex = updated.findIndex(f => f.field_name === event.field!.field_name);

              if (existingIndex >= 0) {
                updated[existingIndex] = event.field!;
              } else {
                updated.push(event.field!);
              }

              return updated;
            });

            // Track character ID
            if (event.character_id && !currentCharacterId) {
              setCurrentCharacterId(event.character_id);
            }

            // Update progress based on field completion
            if (event.field.status === 'completed') {
              receivedFields.add(event.field.field_name);
              updateProgressStage(`Generated ${event.field.field_name} (${receivedFields.size}/6 fields)`);
            } else if (event.field.status === 'generating') {
              updateProgressStage(`Generating ${event.field.field_name}...`);
            }
          } else if (event.event_type === 'image_generated' && event.image_uri) {
            generatedImageUri = event.image_uri;
            updateProgressStage('Character portrait generated!');
          } else if (event.event_type === 'complete') {
            updateProgressStage('Finalizing character...');
          } else if (event.event_type === 'error') {
            throw new Error(event.error || 'Character generation failed');
          }
        }
      );

      // Build final character from generated fields
      if (currentCharacterId && characterFields.length > 0) {
        finalCharacter = buildCharacterFromFields(currentCharacterId, characterFields);

        // Add any user-provided hints that weren't generated
        if (characterName.trim() && !finalCharacter.name) {
          finalCharacter.name = characterName.trim();
        }
        if (characterRole.trim() && !finalCharacter.role) {
          finalCharacter.role = characterRole.trim();
        }

        // Add generated image if available
        if (generatedImageUri) {
          finalCharacter.photoUrl = generatedImageUri;
        }

        updateProgressStage('Character created successfully!');

        // Notify parent component
        onCharacterCreated(finalCharacter);
        onClose();

        // Reset form
        setSelectedFile(null);
        setPreviewUrl(null);
        setCharacterName('');
        setCharacterRole('');
        setAdditionalPrompt('');
        setSelectedGender('');
        setSelectedGenre('');
        setIsUsingRandomPhoto(false);
        setCharacterFields([]);
        setCurrentCharacterId(null);
      } else {
        throw new Error('No character data received from generation');
      }

    } catch (error) {
      console.error('Error generating character:', error);
      showUserFriendlyError(
        error instanceof Error ? error : new Error('Failed to generate character'),
        'Character Generation'
      );
    } finally {
      setIsUploading(false);
      stopProgressTracking();
    }
  }, [selectedFile, isUsingRandomPhoto, previewUrl, scenario, characterName, characterRole, additionalPrompt, selectedGender, onCharacterCreated, onClose, startProgressTracking, updateProgressStage, stopProgressTracking, characterFields, currentCharacterId]);

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
        setIsUsingRandomPhoto(false);
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  }, []);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsUsingRandomPhoto(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Load a new random photo
    loadRandomPhoto();
  }, [loadRandomPhoto]);

  if (!isOpen) return null;

  return (
    <div className="photo-upload-modal-overlay">
      <div className="photo-upload-modal">
        <div className="photo-upload-modal__header">
          <h3>Generate new character</h3>
          <button
            className="photo-upload-modal__close"
            onClick={() => {
              if (isUploading) return; // Prevent closing during generation
              // Reset state when closing
              setSelectedFile(null);
              setPreviewUrl(null);
              setCharacterName('');
              setCharacterRole('');
              setAdditionalPrompt('');
              setSelectedGender('');
              setIsUsingRandomPhoto(false);
              stopProgressTracking();
              onClose();
            }}
            disabled={isUploading}
            title={isUploading ? 'Please wait for character generation to complete' : 'Close'}
          >
            <FaTimes />
          </button>
        </div>

        <div className="photo-upload-modal__content">
          <div className="photo-upload-section">
            <label className="photo-upload-label">Photo</label>
            
            {/* Genre selection dropdown */}
            <div className="input-group">
              <label className="input-label">Genre (optional)</label>
              <select
                className="input-select"
                value={selectedGenre}
                onChange={(e) => handleGenreChange(e.target.value)}
                disabled={isUploading || isLoadingRandomPhoto}
              >
                <option value="">{scenario.writingStyle?.genre || 'Current genre'}</option>
                <option value="general">General fiction</option>
                <option value="sci-fi">Science Fiction</option>
                <option value="fantasy">Fantasy</option>
                <option value="romance">Romance</option>
              </select>
            </div>
            
            {!previewUrl && isLoadingRandomPhoto ? (
              <div className="photo-loading">
                <div className="spinner"></div>
                <p>Loading random photo...</p>
              </div>
            ) : previewUrl ? (
              <div className="photo-preview">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="photo-preview__image"
                />
                {isLoadingRandomPhoto && (
                  <div className="photo-preview__loading-overlay">
                    <div className="spinner"></div>
                    <span>Loading...</span>
                  </div>
                )}
                <div className="photo-preview__controls">
                  {isUsingRandomPhoto && (
                    <button
                      className="photo-preview__refresh"
                      onClick={handleRefreshRandomPhoto}
                      disabled={isUploading || isLoadingRandomPhoto}
                      title="Get different random photo"
                    >
                      <FaRandom />
                    </button>
                  )}
                  <button
                    className="photo-preview__upload"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isLoadingRandomPhoto}
                    title="Upload your own photo"
                  >
                    <FaPlus />
                  </button>
                  <button
                    className="photo-preview__remove"
                    onClick={handleRemoveFile}
                    disabled={isUploading || isLoadingRandomPhoto}
                    title="Remove photo"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
            ) : (
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
            
            {/* Gender selection dropdown */}
            <div className="input-group">
              <label className="input-label">Gender (optional)</label>
              <select
                className="input-select"
                value={selectedGender}
                onChange={(e) => handleGenderChange(e.target.value)}
                disabled={isUploading || isLoadingRandomPhoto}
              >
                <option value="">Any Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="input-group">
              <label className="input-label">Character Name</label>
              <AiTextBox
                value={characterName}
                onChange={(value) => setCharacterName(value)}
                placeholder="e.g., Alice Johnson, John Smith, etc."
                disabled={isUploading || isGeneratingName}
                aiIcon={<FaRandom />}
                aiGenerating={isGeneratingName}
                onAiClick={generateCharacterName}
              />
            </div>
            
            <AiTextBox
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
                rows={2}
                disabled={isUploading}
              />
            </div>
          </div>
        </div>

        <div className="photo-upload-modal__footer">
          <Button
            variant="ghost"
            onClick={() => {
              if (isUploading) return; // Prevent closing during generation
              // Reset state when closing
              setSelectedFile(null);
              setPreviewUrl(null);
              setCharacterName('');
              setCharacterRole('');
              setAdditionalPrompt('');
              setSelectedGender('');
              setIsUsingRandomPhoto(false);
              stopProgressTracking();
              onClose();
            }}
            disabled={isUploading}
          >
            {isUploading ? 'Generating...' : 'Cancel'}
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            className='photo-upload-modal__create-button'
            disabled={(!selectedFile && !isUsingRandomPhoto) || isUploading || isLoadingRandomPhoto}
            icon={<FaPlus />}
          >
            {isUploading ? 'Creating Character...' : 'Create Character'}
          </Button>
        </div>

        {/* Progress Overlay */}
        {isUploading && (
          <div className="photo-upload-modal__progress-overlay">
            <div className="progress-content">
              <div className="progress-spinner">
                <div className="spinner"></div>
              </div>
              <div className="progress-info">
                <h4>Generating Character</h4>
                <p className="progress-stage">{generationProgress.stage}</p>
                <div className="progress-details">
                  <span className="elapsed-time">
                    Time: {Math.floor(generationProgress.elapsedTime / 60)}:
                    {(generationProgress.elapsedTime % 60).toString().padStart(2, '0')}
                  </span>
                  {generationProgress.tokensReceived && (
                    <span className="tokens-received">
                      Tokens: {generationProgress.tokensReceived}
                    </span>
                  )}
                </div>
                <p className="progress-hint">
                  AI is analyzing the image and generating detailed character attributes...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
