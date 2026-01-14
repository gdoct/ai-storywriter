import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes, FaComment, FaEye } from 'react-icons/fa';
import { FaImage } from 'react-icons/fa6';
import { TextGenerationTab } from './TextGenerationTab';
import { MultimodalTab } from './MultimodalTab';
import { ImageGenerationTab } from './ImageGenerationTab';
import './LLMSettingsModal.css';

interface LLMSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSeedChange?: (seed: number | null) => void;
}

type TabType = 'text' | 'multimodal' | 'image';

export const LLMSettingsModal: React.FC<LLMSettingsModalProps> = ({
  isOpen,
  onClose,
  onSeedChange
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    // Remember last active tab
    const savedTab = localStorage.getItem('storywriter_llm_settings_tab');
    return (savedTab as TabType) || 'text';
  });

  // Close modal on escape key
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

  // Save active tab selection
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    localStorage.setItem('storywriter_llm_settings_tab', tab);
  };

  if (!isOpen) return null;

  const tabs = [
    {
      id: 'text' as TabType,
      label: 'Text Generation',
      icon: <FaComment className="llm-settings-modal__tab-icon" />,
      description: 'Standard text-based AI models'
    },
    {
      id: 'multimodal' as TabType,
      label: 'Multimodal',
      icon: <FaEye className="llm-settings-modal__tab-icon" />,
      description: 'Vision + text AI models'
    },
    {
      id: 'image' as TabType,
      label: 'Image Generation',
      icon: <FaImage className="llm-settings-modal__tab-icon" />,
      description: 'Text-to-image AI models'
    }
  ];

  return createPortal(
    <div className="llm-settings-modal__overlay" onClick={onClose}>
      <div 
        className="llm-settings-modal__content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="llm-settings-modal__header">
          <h2>AI Model Settings</h2>
          <button
            className="llm-settings-modal__close"
            onClick={onClose}
            aria-label="Close modal"
            data-testid="button-close-llm-settings-modal"
          >
            <FaTimes />
          </button>
        </div>
        
        {/* Tab Navigation */}
        <div className="llm-settings-modal__tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`llm-settings-modal__tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
              aria-label={`Switch to ${tab.label} settings`}
              title={tab.description}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="llm-settings-modal__body tabbed">
          {/* Tab Content */}
          <TextGenerationTab 
            isActive={activeTab === 'text'} 
            onSeedChange={onSeedChange}
          />
          <MultimodalTab 
            isActive={activeTab === 'multimodal'} 
          />
          <ImageGenerationTab 
            isActive={activeTab === 'image'} 
          />
        </div>
      </div>
    </div>,
    document.body
  );
};