import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes } from 'react-icons/fa';
import { FaPlay } from 'react-icons/fa6';
import { getSelectedModel } from '@shared/services/modelSelection';
import { MaxTokensService, TokenContext } from '@shared/services/maxTokensService';
import './GenerationSettingsModal.css';

export interface GenerationSettings {
  model: string;
  temperature: number;
  maxTokens: number;
}

interface GenerationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (settings: GenerationSettings) => void;
  isRegenerating?: boolean;
}

export const GenerationSettingsModal: React.FC<GenerationSettingsModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  isRegenerating = false,
}) => {
  const [model, setModel] = useState<string>('');
  const [temperature, setTemperature] = useState<number>(0.8);
  const [maxTokens, setMaxTokens] = useState<number>(
    MaxTokensService.getDefault(TokenContext.STORY_GENERATION)
  );

  // Load settings when modal opens
  useEffect(() => {
    if (isOpen) {
      // Load model from localStorage
      const savedModel = getSelectedModel();
      setModel(savedModel || 'No model selected');

      // Load temperature from localStorage
      const savedTemp = localStorage.getItem('storywriter_temperature');
      if (savedTemp) {
        setTemperature(parseFloat(savedTemp));
      }

      // Load max tokens from localStorage or use default
      const savedMaxTokens = localStorage.getItem('storywriter_story_max_tokens');
      if (savedMaxTokens) {
        setMaxTokens(parseInt(savedMaxTokens, 10));
      } else {
        setMaxTokens(MaxTokensService.getDefault(TokenContext.STORY_GENERATION));
      }
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleMaxTokensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setMaxTokens(value);
      localStorage.setItem('storywriter_story_max_tokens', value.toString());
    }
  };

  const handleGenerate = () => {
    onGenerate({
      model,
      temperature,
      maxTokens,
    });
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="generation-settings-modal__overlay" onClick={onClose}>
      <div
        className="generation-settings-modal__content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="generation-settings-modal__header">
          <h2>{isRegenerating ? 'Regenerate Story' : 'Generate Story'}</h2>
          <button
            className="generation-settings-modal__close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <FaTimes />
          </button>
        </div>

        <div className="generation-settings-modal__body">
          {/* Model Display (read-only) */}
          <div className="generation-settings-modal__section">
            <label className="generation-settings-modal__label">Model</label>
            <div className="generation-settings-modal__value">{model}</div>
            <p className="generation-settings-modal__hint">
              Change model in the AI Settings (top bar)
            </p>
          </div>

          {/* Temperature Display (read-only) */}
          <div className="generation-settings-modal__section">
            <label className="generation-settings-modal__label">
              Temperature: {temperature.toFixed(2)}
            </label>
            <div className="generation-settings-modal__slider-display">
              <div
                className="generation-settings-modal__slider-fill"
                style={{
                  width: `${((temperature - 0.6) / 0.6) * 100}%`,
                }}
              />
            </div>
            <p className="generation-settings-modal__hint">
              Change temperature in the AI Settings (top bar)
            </p>
          </div>

          {/* Max Tokens Input */}
          <div className="generation-settings-modal__section">
            <label
              htmlFor="max-tokens-input"
              className="generation-settings-modal__label"
            >
              Max Tokens
            </label>
            <input
              id="max-tokens-input"
              type="number"
              value={maxTokens}
              onChange={handleMaxTokensChange}
              min={100}
              max={32000}
              step={100}
              className="generation-settings-modal__input"
            />
            <p className="generation-settings-modal__hint">
              Maximum number of tokens for the generated story (100-32000)
            </p>
          </div>
        </div>

        <div className="generation-settings-modal__footer">
          <button
            className="generation-settings-modal__button generation-settings-modal__button--secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="generation-settings-modal__button generation-settings-modal__button--primary"
            onClick={handleGenerate}
          >
            <FaPlay />
            {isRegenerating ? 'Regenerate Story' : 'Generate Story'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
