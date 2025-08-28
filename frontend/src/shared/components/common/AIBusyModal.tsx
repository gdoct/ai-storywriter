import React from 'react';
import { useAIStatus } from '../../contexts/AIStatusContext';
import './AIBusyModal.css';

const AIBusyModal: React.FC = () => {
  const { showAIBusyModal, setShowAIBusyModal } = useAIStatus();

  if (!showAIBusyModal) return null;

  return (
    <div className="ai-busy-modal-overlay">
      <div className="ai-busy-modal">
        <h2>AI Busy</h2>
        <p>The AI service is currently busy processing another request. Please try again in a few moments.</p>
        <button onClick={() => setShowAIBusyModal(false)}>OK</button>
      </div>
    </div>
  );
};

export default AIBusyModal;
