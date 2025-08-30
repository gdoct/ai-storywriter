import { AiTextArea, AiTextBox, Button } from '@drdata/ai-styles';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaPlus, FaTimes, FaUser } from 'react-icons/fa';
import { FaMap } from 'react-icons/fa6';
import { FaLocationDot } from 'react-icons/fa6';
import { AI_STATUS, useAIStatus } from '../../../../../shared/contexts/AIStatusContext';
import { useAuth } from '../../../../../shared/contexts/AuthContext';
import { getToken } from '../../../../../shared/services/security';
import { streamSimpleChatCompletionWithStatus } from '../../../../../shared/services/llmService';
import { getSelectedModel } from '../../../../../shared/services/modelSelection';
import { llmCompletionRequestMessage } from '../../../../../shared/types/LLMTypes';
import { Location } from '../../../../../shared/types/ScenarioTypes';
import { LocationMapPicker } from './LocationMapPicker';
import './GenerateLocationModal.css';

interface GenerateLocationModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onLocationGenerated: (location: Partial<Location>) => void;
}

type GenerationTab = 'image' | 'text' | 'maps';

export const GenerateLocationModal: React.FC<GenerateLocationModalProps> = ({
  isOpen = true,
  onClose,
  onLocationGenerated,
}) => {
  const [activeTab, setActiveTab] = useState<GenerationTab>('image');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Image tab states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageLocationName, setImageLocationName] = useState('');
  const [imageAdditionalPrompt, setImageAdditionalPrompt] = useState('');
  
  // Text tab states
  const [textLocationName, setTextLocationName] = useState('');
  const [textDescription, setTextDescription] = useState('');
  const [textAdditionalContext, setTextAdditionalContext] = useState('');
  
  // Maps tab states
  const [mapsLocationName, setMapsLocationName] = useState('');
  const [selectedMapLocation, setSelectedMapLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [mapsAdditionalContext, setMapsAdditionalContext] = useState('');
  
  // Progress tracking states
  const [generationProgress, setGenerationProgress] = useState<{
    stage: string;
    elapsedTime: number;
    tokensReceived?: number;
  }>({ stage: '', elapsedTime: 0 });
  const progressIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // AI Status context
  const { setAiStatus, setShowAIBusyModal } = useAIStatus();

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

  const handleClose = useCallback(() => {
    // Prevent closing during generation
    if (isGenerating) {
      return;
    }
    
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    stopProgressTracking();
    onClose();
  }, [previewUrl, stopProgressTracking, onClose, isGenerating]);

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

  const createImageLocationPrompt = useCallback(() => {
    let prompt = "Analyze this image and create a detailed location description. ";
    
    if (imageLocationName) {
      prompt += `This location is called "${imageLocationName}". `;
    }
    
    prompt += "Please provide:\n";
    prompt += "1. A vivid visual description of the physical appearance and atmosphere\n";
    prompt += "2. Background information about the location's history, significance, and context\n";
    prompt += "3. Any additional details that would be useful for storytelling\n\n";
    
    if (imageAdditionalPrompt) {
      prompt += `Additional context: ${imageAdditionalPrompt}\n\n`;
    }
    
    prompt += "Return the response as a JSON object with these exact fields:\n";
    prompt += "{\n";
    prompt += '  "name": "Location name (if not provided, suggest one based on the image)",\n';
    prompt += '  "visualDescription": "Detailed physical description and atmosphere",\n';
    prompt += '  "background": "History, significance, and context",\n';
    prompt += '  "extraInfo": "Additional relevant details for storytelling"\n';
    prompt += "}";
    
    return prompt;
  }, [imageLocationName, imageAdditionalPrompt]);

  const createTextLocationPrompt = useCallback(() => {
    let prompt = `Create a detailed location description based on this text description: "${textDescription}"\n\n`;
    
    if (textLocationName) {
      prompt += `The location name is: "${textLocationName}"\n\n`;
    }
    
    if (textAdditionalContext) {
      prompt += `Additional context: ${textAdditionalContext}\n\n`;
    }
    
    prompt += "Please provide:\n";
    prompt += "1. A vivid visual description expanding on the given description\n";
    prompt += "2. Background information about the location's history, significance, and context\n";
    prompt += "3. Any additional details that would be useful for storytelling\n\n";
    
    prompt += "Return the response as a JSON object with these exact fields:\n";
    prompt += "{\n";
    prompt += '  "name": "Location name (use provided name or suggest one if not given)",\n';
    prompt += '  "visualDescription": "Detailed physical description and atmosphere",\n';
    prompt += '  "background": "History, significance, and context",\n';
    prompt += '  "extraInfo": "Additional relevant details for storytelling"\n';
    prompt += "}";
    
    return prompt;
  }, [textLocationName, textDescription, textAdditionalContext]);

  const createMapsLocationPrompt = useCallback(() => {
    if (!selectedMapLocation) return '';
    
    const locationDescription = selectedMapLocation.address || `coordinates ${selectedMapLocation.lat.toFixed(6)}, ${selectedMapLocation.lng.toFixed(6)}`;
    let prompt = `Create a detailed location description for this place: "${locationDescription}"\n\n`;
    
    prompt += `Geographic coordinates: ${selectedMapLocation.lat}, ${selectedMapLocation.lng}\n\n`;
    
    if (mapsLocationName) {
      prompt += `The location name for storytelling purposes is: "${mapsLocationName}"\n\n`;
    }
    
    if (mapsAdditionalContext) {
      prompt += `Additional context: ${mapsAdditionalContext}\n\n`;
    }
    
    prompt += "Please provide:\n";
    prompt += "1. A vivid visual description of what this place might look like\n";
    prompt += "2. Background information about the location's history, significance, and context\n";
    prompt += "3. Any additional details that would be useful for storytelling\n\n";
    prompt += "Note: Use your knowledge of this real location to create an engaging description suitable for fiction.\n\n";
    
    prompt += "Return the response as a JSON object with these exact fields:\n";
    prompt += "{\n";
    prompt += '  "name": "Location name (use provided name or the actual place name)",\n';
    prompt += '  "visualDescription": "Detailed physical description and atmosphere",\n';
    prompt += '  "background": "History, significance, and context",\n';
    prompt += '  "extraInfo": "Additional relevant details for storytelling"\n';
    prompt += "}";
    
    return prompt;
  }, [mapsLocationName, selectedMapLocation, mapsAdditionalContext]);

  const handleGenerateFromImage = useCallback(async () => {
    if (!selectedFile) {
      console.error('Please select an image first.');
      return;
    }

    setIsGenerating(true);
    startProgressTracking('Preparing image...');

    try {
      // Create FormData for the upload
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('prompt', createImageLocationPrompt());

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
          name: result.name || imageLocationName || 'Generated Location',
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
      console.error('Location generation error:', error.message || 'Failed to generate location. Please try again.');
      stopProgressTracking();
    } finally {
      setIsGenerating(false);
    }
  }, [selectedFile, createImageLocationPrompt, imageLocationName, onLocationGenerated, startProgressTracking, updateProgressStage, stopProgressTracking]);

  const handleGenerateFromText = useCallback(async () => {
    if (!textDescription.trim()) {
      console.error('Please provide a text description first.');
      return;
    }

    setIsGenerating(true);
    startProgressTracking('Preparing request...');

    try {
      setAiStatus(AI_STATUS.BUSY);
      updateProgressStage('Generating location...', 0);

      const prompt: llmCompletionRequestMessage = {
        systemMessage: 'You are an expert location creator for stories. Generate detailed location descriptions based on user prompts.',
        userMessage: createTextLocationPrompt()
      };

      const selectedModel = getSelectedModel();
      let accumulatedText = '';
      
      await streamSimpleChatCompletionWithStatus(
        prompt,
        (text, isDone) => {
          if (isDone) {
            // Final call - completion signal only
            // accumulatedText already contains the complete text from streaming
            updateProgressStage('Finalizing response...', 80);
          } else {
            // Incremental chunk during streaming
            accumulatedText += text;
            updateProgressStage('Receiving response...', 50);
          }
        },
        {
          model: selectedModel || 'google/gemma-3-4b',
          temperature: 0.7,
          max_tokens: 2000
        },
        setAiStatus,
        setShowAIBusyModal
      );

      updateProgressStage('Processing response...', 100);

      // Parse the JSON response
      let locationData: Partial<Location>;
      try {
        // Clean the response - handle multiple JSON blocks and markdown
        let cleanedText = accumulatedText.trim();
        
        // Extract the first JSON object from markdown code blocks
        const jsonBlockRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
        const match = cleanedText.match(jsonBlockRegex);
        
        if (match) {
          cleanedText = match[1]; // Extract just the JSON content
        } else {
          // Fallback: try to extract JSON without code blocks
          const jsonMatch = cleanedText.match(/\{[\s\S]*?\}/);
          if (jsonMatch) {
            cleanedText = jsonMatch[0];
          }
        }
        
        const parsedResult = JSON.parse(cleanedText);
        locationData = {
          name: parsedResult.name || textLocationName || 'Generated Location',
          visualDescription: parsedResult.visualDescription || '',
          background: parsedResult.background || '',
          extraInfo: parsedResult.extraInfo || '',
        };
      } catch (parseError) {
        console.warn('Failed to parse JSON response:', accumulatedText);
        console.warn(parseError);
        // Fallback if JSON parsing fails
        locationData = {
          name: textLocationName || 'Generated Location',
          visualDescription: accumulatedText || '',
          background: '',
          extraInfo: '',
        };
      }

      onLocationGenerated(locationData);
      stopProgressTracking();
      
      // Auto-close modal on successful generation
      setTimeout(handleClose, 100); // Small delay to ensure UI updates

    } catch (error: any) {
      console.error('Location generation error:', error);
      console.error('Location generation error:', error.message || 'Failed to generate location. Please try again.');
      stopProgressTracking();
      setAiStatus(AI_STATUS.IDLE);
    } finally {
      setIsGenerating(false);
    }
  }, [textDescription, createTextLocationPrompt, textLocationName, onLocationGenerated, startProgressTracking, updateProgressStage, stopProgressTracking, setAiStatus, setShowAIBusyModal, handleClose]);

  const handleGenerateFromMaps = useCallback(async () => {
    if (!selectedMapLocation) {
      console.error('Please select a location on the map first.');
      return;
    }

    setIsGenerating(true);
    startProgressTracking('Preparing request...');

    try {
      setAiStatus(AI_STATUS.BUSY);
      updateProgressStage('Generating location...', 0);

      const prompt: llmCompletionRequestMessage = {
        systemMessage: 'You are an expert location creator for stories. Generate detailed location descriptions based on real-world places.',
        userMessage: createMapsLocationPrompt()
      };

      const selectedModel = getSelectedModel();
      let accumulatedText = '';
      
      await streamSimpleChatCompletionWithStatus(
        prompt,
        (text, isDone) => {
          if (isDone) {
            // Final call - completion signal only
            // accumulatedText already contains the complete text from streaming
            updateProgressStage('Finalizing response...', 80);
          } else {
            // Incremental chunk during streaming
            accumulatedText += text;
            updateProgressStage('Receiving response...', 50);
          }
        },
        {
          model: selectedModel || 'google/gemma-3-4b',
          temperature: 0.7,
          max_tokens: 2000
        },
        setAiStatus,
        setShowAIBusyModal
      );

      updateProgressStage('Processing response...', 100);

      // Parse the JSON response
      let locationData: Partial<Location>;
      try {
        // Clean the response - handle multiple JSON blocks and markdown
        let cleanedText = accumulatedText.trim();
        
        // Extract the first JSON object from markdown code blocks
        const jsonBlockRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
        const match = cleanedText.match(jsonBlockRegex);
        
        if (match) {
          cleanedText = match[1]; // Extract just the JSON content
        } else {
          // Fallback: try to extract JSON without code blocks
          const jsonMatch = cleanedText.match(/\{[\s\S]*?\}/);
          if (jsonMatch) {
            cleanedText = jsonMatch[0];
          }
        }
        
        const parsedResult = JSON.parse(cleanedText);
        locationData = {
          name: parsedResult.name || mapsLocationName || 'Generated Location',
          visualDescription: parsedResult.visualDescription || '',
          background: parsedResult.background || '',
          extraInfo: parsedResult.extraInfo || '',
        };
      } catch (parseError) {
        console.warn('Failed to parse JSON response:', accumulatedText);
        console.warn(parseError);
        // Fallback if JSON parsing fails
        locationData = {
          name: mapsLocationName || 'Generated Location',
          visualDescription: accumulatedText || '',
          background: '',
          extraInfo: '',
        };
      }

      onLocationGenerated(locationData);
      stopProgressTracking();
      
      // Auto-close modal on successful generation
      setTimeout(handleClose, 100); // Small delay to ensure UI updates

    } catch (error: any) {
      console.error('Location generation error:', error);
      console.error('Location generation error:', error.message || 'Failed to generate location. Please try again.');
      stopProgressTracking();
      setAiStatus(AI_STATUS.IDLE);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedMapLocation, createMapsLocationPrompt, mapsLocationName, onLocationGenerated, startProgressTracking, updateProgressStage, stopProgressTracking, setAiStatus, setShowAIBusyModal, handleClose]);

  const handleGenerate = useCallback(() => {
    switch (activeTab) {
      case 'image':
        handleGenerateFromImage();
        break;
      case 'text':
        handleGenerateFromText();
        break;
      case 'maps':
        handleGenerateFromMaps();
        break;
    }
  }, [activeTab, handleGenerateFromImage, handleGenerateFromText, handleGenerateFromMaps]);

  const handleMapLocationSelect = useCallback((location: { lat: number; lng: number; address?: string }) => {
    setSelectedMapLocation(location);
  }, []);

  const isGenerateDisabled = useCallback(() => {
    if (isGenerating) return true;
    
    switch (activeTab) {
      case 'image':
        return !selectedFile;
      case 'text':
        return !textDescription.trim();
      case 'maps':
        return !selectedMapLocation;
      default:
        return true;
    }
  }, [activeTab, isGenerating, selectedFile, textDescription, selectedMapLocation]);

  if (!isOpen) return null;

  return (
    <div className="generate-location-modal-overlay" onClick={isGenerating ? undefined : handleClose}>
      <div className="generate-location-modal" onClick={(e) => e.stopPropagation()}>
        <div className="generate-location-header">
          <div className="generate-location-title">
            <FaLocationDot /> Generate Location
          </div>
          <button 
            className="generate-location-close" 
            onClick={handleClose}
            disabled={isGenerating}
            style={{ opacity: isGenerating ? 0.5 : 1, cursor: isGenerating ? 'not-allowed' : 'pointer' }}
          >
            <FaTimes />
          </button>
        </div>

        <div className="generate-location-tabs">
          <button
            className={`tab-button ${activeTab === 'image' ? 'active' : ''}`}
            onClick={() => setActiveTab('image')}
            disabled={isGenerating}
          >
            <FaPlus /> From Image
          </button>
          <button
            className={`tab-button ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => setActiveTab('text')}
            disabled={isGenerating}
          >
            <FaUser /> From Description
          </button>
          <button
            className={`tab-button ${activeTab === 'maps' ? 'active' : ''}`}
            onClick={() => setActiveTab('maps')}
            disabled={isGenerating}
          >
            <FaMap /> From Maps Location
          </button>
        </div>

        <div className="generate-location-content">
          {/* Image Tab */}
          {activeTab === 'image' && (
            <div className="tab-content">
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
                        value={imageLocationName}
                        onChange={setImageLocationName}
                        placeholder="e.g., Ancient Temple, Dark Forest..."
                      />
                    </div>
                    
                    <div className="location-form-field">
                      <AiTextBox
                        label="Additional Context (Optional)"
                        value={imageAdditionalPrompt}
                        onChange={setImageAdditionalPrompt}
                        placeholder="Any specific details or context for this location..."
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Text Tab */}
          {activeTab === 'text' && (
            <div className="tab-content">
              <div className="location-form">
                <div className="location-form-field">
                  <AiTextBox
                    label="Location Name (Optional)"
                    value={textLocationName}
                    onChange={setTextLocationName}
                    placeholder="e.g., Mystic Library, Abandoned Factory..."
                  />
                </div>
                
                <div className="location-form-field">
                  <AiTextArea
                    label="Location Description"
                    value={textDescription}
                    onChange={setTextDescription}
                    placeholder="Describe the location you want to generate. E.g., 'A dark, mystical forest with ancient trees and glowing mushrooms'"
                    rows={4}
                  />
                </div>
                
                <div className="location-form-field">
                  <AiTextArea
                    label="Additional Context (Optional)"
                    value={textAdditionalContext}
                    onChange={setTextAdditionalContext}
                    placeholder="Any additional context, mood, or specific details..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Maps Tab */}
          {activeTab === 'maps' && (
            <div className="tab-content">
              <div className="maps-tab-layout">
                <div className="map-section">
                  <LocationMapPicker
                    onLocationSelect={handleMapLocationSelect}
                    selectedLocation={selectedMapLocation}
                  />
                </div>
                
                <div className="location-form">
                  <div className="location-form-field">
                    <AiTextBox
                      label="Location Name (Optional)"
                      value={mapsLocationName}
                      onChange={setMapsLocationName}
                      placeholder="e.g., The Mysterious Café, Secret Hideout..."
                    />
                  </div>
                  
                  <div className="location-form-field">
                    <AiTextArea
                      label="Additional Context (Optional)"
                      value={mapsAdditionalContext}
                      onChange={setMapsAdditionalContext}
                      placeholder="How should this real location be adapted for your story? Any specific mood or modifications..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Progress Section */}
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

        <div className="generate-location-actions">
          <Button variant="secondary" onClick={handleClose} disabled={isGenerating}>
            {isGenerating ? 'Generating...' : 'Cancel'}
          </Button>
          <Button 
            variant="primary" 
            onClick={handleGenerate}
            disabled={isGenerateDisabled()}
          >
            {isGenerating ? 'Generating...' : 'Generate Location'}
          </Button>
        </div>
      </div>
    </div>
  );
};