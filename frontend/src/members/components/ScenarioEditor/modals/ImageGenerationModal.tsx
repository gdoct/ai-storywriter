import React from 'react';
import { FaWandMagicSparkles } from 'react-icons/fa6';
import './ImageGenerationModal.css';

interface ImageGenerationModalProps {
  isOpen: boolean;
  title?: string;
}

export const ImageGenerationModal: React.FC<ImageGenerationModalProps> = ({
  isOpen,
  title = 'Generating Image'
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="image-generation-modal-overlay">
      <div className="image-generation-modal">
        <div className="image-generation-modal__content">
          <div className="image-generation-modal__icon">
            <FaWandMagicSparkles className="image-generation-modal__magic-icon" />
            <span className="image-generation-modal__sparkles">✨</span>
          </div>
          <h3 className="image-generation-modal__title">{title}</h3>
          <p className="image-generation-modal__description">
            Please wait while we generate your image using AI...
          </p>
          <div className="image-generation-modal__progress">
            <div className="image-generation-modal__progress-bar">
              <div className="image-generation-modal__progress-fill"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};