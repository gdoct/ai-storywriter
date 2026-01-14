import React, { useEffect, useState } from 'react';
import {
  fetchImageGenerationModels,
  getImageGenerationStatus,
  getSupportedImageSizes,
  getSupportedImageStyles,
  getSupportedImageQualities
} from '../../services/imageGenerationService';
import { setModelByType, getSelectedModelByType } from '../../services/modelSelection';

interface ImageGenerationTabProps {
  isActive: boolean;
}

export const ImageGenerationTab: React.FC<ImageGenerationTabProps> = ({
  isActive
}) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [imageSize, setImageSize] = useState('1024x1024');
  const [imageQuality, setImageQuality] = useState('standard');
  const [imageStyle, setImageStyle] = useState('');

  // Load image generation settings when tab becomes active
  useEffect(() => {
    if (isActive) {
      loadImageGenerationSettings();
      
      // Load saved settings from localStorage
      const savedSettings = localStorage.getItem('storywriter_image_settings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          setIsEnabled(settings.enabled || false);
          setSelectedModel(settings.model || '');
          setImageSize(settings.size || '1024x1024');
          setImageQuality(settings.quality || 'standard');
          setImageStyle(settings.style || '');
        } catch (error) {
          console.error('Failed to parse image generation settings:', error);
        }
      }
    }
  }, [isActive]);

  const loadImageGenerationSettings = async () => {
    try {
      // Check image generation service status
      const status = await getImageGenerationStatus();
      setIsBusy(status.busy);
      
      // Try to fetch models to determine if service is available
      try {
        const models = await fetchImageGenerationModels();
        setAvailableModels(models);
        setIsConnected(models.length > 0);
        
        // If no model is selected and we have models available, select the first one
        if (!selectedModel && models.length > 0) {
          const newModel = models[0];
          setSelectedModel(newModel);
          // Update centralized model selection
          setModelByType('image', newModel, {
            enabled: isEnabled,
            size: imageSize,
            quality: imageQuality,
            style: imageStyle
          });
        }
      } catch (error) {
        console.error("Failed to fetch image generation models:", error);
        setIsConnected(false);
        setAvailableModels([]);
      }
    } catch (error) {
      console.error("Failed to load image generation settings:", error);
      setIsConnected(false);
    }
  };

  const saveSettings = () => {
    const settings = {
      enabled: isEnabled,
      model: selectedModel,
      size: imageSize,
      quality: imageQuality,
      style: imageStyle
    };
    localStorage.setItem('storywriter_image_settings', JSON.stringify(settings));
  };

  // Handle enable/disable toggle
  const handleEnabledChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = e.target.checked;
    setIsEnabled(enabled);
    saveSettings();
  };

  // Handle model selection change
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    setSelectedModel(newModel);

    // Reset dependent settings when model changes
    let newSize = imageSize;
    let newQuality = imageQuality;
    let newStyle = imageStyle;

    const supportedSizes = getSupportedImageSizes(newModel);
    if (supportedSizes.length > 0 && !supportedSizes.includes(imageSize)) {
      newSize = supportedSizes[0];
      setImageSize(newSize);
    }

    const supportedQualities = getSupportedImageQualities(newModel);
    if (supportedQualities.length > 0 && !supportedQualities.includes(imageQuality)) {
      newQuality = supportedQualities[0];
      setImageQuality(newQuality);
    }

    const supportedStyles = getSupportedImageStyles(newModel);
    if (supportedStyles.length > 0 && !supportedStyles.includes(imageStyle)) {
      newStyle = supportedStyles[0];
      setImageStyle(newStyle);
    } else if (supportedStyles.length === 0) {
      newStyle = '';
      setImageStyle('');
    }

    // Update centralized model selection
    setModelByType('image', newModel, {
      enabled: isEnabled,
      size: newSize,
      quality: newQuality,
      style: newStyle
    });

    saveSettings();
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = e.target.value;
    setImageSize(newSize);
    setModelByType('image', selectedModel, {
      enabled: isEnabled,
      size: newSize,
      quality: imageQuality,
      style: imageStyle
    });
    saveSettings();
  };

  const handleQualityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newQuality = e.target.value;
    setImageQuality(newQuality);
    setModelByType('image', selectedModel, {
      enabled: isEnabled,
      size: imageSize,
      quality: newQuality,
      style: imageStyle
    });
    saveSettings();
  };

  const handleStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStyle = e.target.value;
    setImageStyle(newStyle);
    setModelByType('image', selectedModel, {
      enabled: isEnabled,
      size: imageSize,
      quality: imageQuality,
      style: newStyle
    });
    saveSettings();
  };

  if (!isActive) return null;

  const supportedSizes = getSupportedImageSizes(selectedModel);
  const supportedQualities = getSupportedImageQualities(selectedModel);
  const supportedStyles = getSupportedImageStyles(selectedModel);

  return (
    <div className="llm-tab-content">
      {/* Enable/Disable Toggle */}
      <div className="llm-settings-modal__section">
        <div className="llm-settings-modal__seed-checkbox">
          <input
            id="image-enabled"
            type="checkbox"
            checked={isEnabled}
            onChange={handleEnabledChange}
            disabled={true} // Temporarily disabled in member mode
          />
          <label htmlFor="image-enabled">Enable Image Generation</label>
        </div>
        <p className="llm-settings-description">
          {isEnabled 
            ? "Generate images from text prompts using AI models."
            : "Image generation is currently disabled for member accounts. Available in BYOK mode."
          }
        </p>
      </div>

      {/* Connection Status */}
      <div className="llm-settings-modal__status">
        <div className={`llm-settings-modal__status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          <div className="status-dot"></div>
          <span>
            {isConnected 
              ? (isBusy ? 'Connected (Busy)' : 'Connected') 
              : 'Unavailable'
            }
          </span>
        </div>
        {!isConnected && (
          <p className="llm-settings-description">
            Image generation is not currently available. This feature requires BYOK mode with your own API keys.
          </p>
        )}
      </div>

      {/* Model Selection */}
      <div className="llm-settings-modal__section">
        <label htmlFor="image-model-select" className="llm-settings-modal__label">
          Model
        </label>
        <select
          id="image-model-select"
          data-testid="image-model-select"
          value={selectedModel}
          onChange={handleModelChange}
          disabled={!isEnabled || !isConnected || availableModels.length === 0}
          className="llm-settings-modal__select"
        >
          {availableModels.length === 0 ? (
            <option value="">No image generation models available</option>
          ) : (
            availableModels.map(model => (
              <option key={model} value={model}>{model}</option>
            ))
          )}
        </select>
        <p className="llm-settings-description">
          Select an image generation model (DALL-E, Stable Diffusion, etc.).
        </p>
      </div>
      
      {/* Image Size */}
      <div className="llm-settings-modal__section">
        <label htmlFor="image-size-select" className="llm-settings-modal__label">
          Image Size
        </label>
        <select
          id="image-size-select"
          value={imageSize}
          onChange={handleSizeChange}
          disabled={!isEnabled || supportedSizes.length <= 1}
          className="llm-settings-modal__select"
        >
          {supportedSizes.map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
        <p className="llm-settings-description">
          Larger images use more credits and take longer to generate.
        </p>
      </div>

      {/* Image Quality (if supported) */}
      {supportedQualities.length > 1 && (
        <div className="llm-settings-modal__section">
          <label htmlFor="image-quality-select" className="llm-settings-modal__label">
            Quality
          </label>
          <select
            id="image-quality-select"
            value={imageQuality}
            onChange={handleQualityChange}
            disabled={!isEnabled}
            className="llm-settings-modal__select"
          >
            {supportedQualities.map(quality => (
              <option key={quality} value={quality}>
                {quality === 'standard' ? 'Standard' : quality === 'hd' ? 'HD' : quality}
              </option>
            ))}
          </select>
          <p className="llm-settings-description">
            HD quality images are more detailed but cost significantly more credits.
          </p>
        </div>
      )}

      {/* Image Style (if supported) */}
      {supportedStyles.length > 0 && (
        <div className="llm-settings-modal__section">
          <label htmlFor="image-style-select" className="llm-settings-modal__label">
            Style
          </label>
          <select
            id="image-style-select"
            value={imageStyle}
            onChange={handleStyleChange}
            disabled={!isEnabled}
            className="llm-settings-modal__select"
          >
            {supportedStyles.map(style => (
              <option key={style} value={style}>
                {style.charAt(0).toUpperCase() + style.slice(1).replace('-', ' ')}
              </option>
            ))}
          </select>
          <p className="llm-settings-description">
            Choose the artistic style for generated images.
          </p>
        </div>
      )}

      {/* Usage Information */}
      <div className="llm-settings-modal__section">
        <div className="llm-settings-info-box">
          <h4>Image Generation Costs</h4>
          <ul>
            <li><strong>Standard 1024x1024:</strong> ~100 credits per image</li>
            <li><strong>HD Quality:</strong> ~200 credits per image</li>
            <li><strong>Larger sizes:</strong> Higher credit costs</li>
            <li>Generation typically takes 10-30 seconds</li>
          </ul>
        </div>
      </div>
    </div>
  );
};