import React, { useState, useEffect } from 'react';
import { getSelectedModel } from '../../services/modelSelection';
import { getLLMStatus } from '../../services/llmBackend';
import { LLMSettingsModal } from '../LLMSettingsModal';

const ModelSelector: React.FC = () => {
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Load connection status and selected model on mount
  useEffect(() => {
    const loadStatus = async () => {
      try {
        // Check LLM connection status
        const status = await getLLMStatus();
        setIsConnected(status.isConnected);
        
        // Load selected model from storage
        const savedModel = getSelectedModel();
        if (savedModel) {
          setSelectedModelId(savedModel);
        }
      } catch (error) {
        console.error('Failed to load status:', error);
        setIsConnected(false);
      } finally {
        setLoading(false);
      }
    };

    loadStatus();

    // Set up interval to periodically check status
    const intervalId = setInterval(loadStatus, 30000); // Every 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  // Update selected model when modal changes it
  useEffect(() => {
    const savedModel = getSelectedModel();
    if (savedModel && savedModel !== selectedModelId) {
      setSelectedModelId(savedModel);
    }
  }, [selectedModelId]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Refresh selected model after modal closes
    const savedModel = getSelectedModel();
    if (savedModel) {
      setSelectedModelId(savedModel);
    }
  };

  const getDisplayName = () => {
    if (!selectedModelId) return 'No Model';
    // Truncate long model names for display
    return selectedModelId.length > 30
      ? `${selectedModelId.substring(0, 30)}...`
      : selectedModelId;
  };

  if (loading) {
    return (
      <button
        disabled
        style={{
          padding: '6px 12px',
          fontSize: '0.75rem',
          color: 'var(--color-text-secondary)',
          background: 'var(--color-surface-variant)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
          cursor: 'not-allowed',
          fontFamily: 'inherit',
          fontWeight: '500'
        }}
      >
        Loading...
      </button>
    );
  }

  return (
    <>
      <button
        onClick={handleOpenModal}
        title={`Current model: ${selectedModelId || 'None selected'}${!isConnected ? ' (Disconnected)' : ''}`}
        style={{
          padding: '6px 12px',
          fontSize: '0.75rem',
          fontWeight: '500',
          color: isConnected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          background: 'var(--color-surface-variant)',
          border: `1px solid ${isConnected ? 'var(--color-border)' : 'var(--color-error-300)'}`,
          borderRadius: '6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          minWidth: '120px',
          maxWidth: '200px',
          transition: 'all 0.15s ease',
          boxShadow: 'var(--shadow-sm)',
          fontFamily: 'inherit',
          position: 'relative'
        }}
        onMouseEnter={(e) => {
          if (isConnected) {
            e.currentTarget.style.background = 'var(--color-surface-elevated)';
            e.currentTarget.style.borderColor = 'var(--color-primary)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--color-surface-variant)';
          e.currentTarget.style.borderColor = isConnected ? 'var(--color-border)' : 'var(--color-error-300)';
        }}
      >
        {/* Connection indicator */}
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: isConnected ? 'var(--color-success-500)' : 'var(--color-error-500)',
            flexShrink: 0
          }}
        />
        
        {/* Model name */}
        <span style={{ 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          flex: 1,
          textAlign: 'left'
        }}>
          {getDisplayName()}
        </span>

        {/* Settings icon */}
        <svg 
          width="14" 
          height="14" 
          viewBox="0 0 16 16" 
          fill="none"
          style={{ 
            color: 'var(--color-text-secondary)',
            flexShrink: 0
          }}
        >
          <path 
            d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" 
            stroke="currentColor" 
            strokeWidth="1.2"
          />
          <path 
            d="M12.9 8.9C12.8 9.4 12.9 9.8 13.1 10.1L13.2 10.2C13.3 10.4 13.4 10.6 13.4 10.8C13.4 11 13.3 11.2 13.2 11.4C13.1 11.6 12.9 11.7 12.7 11.8L11.8 12.3C11.6 12.4 11.3 12.4 11.1 12.3C10.9 12.2 10.7 12 10.6 11.8L10.5 11.7C10.3 11.5 9.9 11.4 9.4 11.5C9 11.6 8.5 11.5 8.1 11.3L8 11.2C7.8 11.1 7.6 11 7.4 11C7.2 11 7 11.1 6.8 11.2L5.9 11.7C5.7 11.8 5.4 11.8 5.2 11.7C5 11.6 4.8 11.4 4.7 11.2L4.2 10.3C4.1 10.1 4.1 9.8 4.2 9.6C4.3 9.4 4.5 9.2 4.7 9.1L4.8 9C5 8.8 5.1 8.4 5 7.9C4.9 7.5 5 7 5.2 6.6L5.3 6.5C5.4 6.3 5.5 6.1 5.5 5.9C5.5 5.7 5.4 5.5 5.3 5.3C5.2 5.1 5 5 4.8 4.9L3.9 4.4C3.7 4.3 3.4 4.3 3.2 4.4C3 4.5 2.8 4.7 2.7 4.9L2.2 5.8C2.1 6 2.1 6.3 2.2 6.5C2.3 6.7 2.5 6.9 2.7 7L2.8 7.1C3 7.3 3.1 7.7 3 8.2C2.9 8.6 3 9.1 3.2 9.5" 
            stroke="currentColor" 
            strokeWidth="1.2" 
            strokeLinecap="round"
          />
        </svg>
      </button>

      <LLMSettingsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
};

export default ModelSelector;