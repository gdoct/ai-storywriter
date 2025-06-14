import React from 'react';
import { AI_STATUS, useAIStatus } from '../../contexts/AIStatusContext';
import './StatusIndicator.css';

const StatusIndicator: React.FC = () => {
  const { aiStatus } = useAIStatus();

  const renderStatusIndicator = () => {
    let statusClass = '';
    let statusText = '';

    switch (aiStatus) {
      case AI_STATUS.IDLE:
        statusClass = 'idle';
        statusText = 'AI Available';
        break;
      case AI_STATUS.BUSY:
        statusClass = 'busy';
        statusText = 'AI Busy';
        break;
      case AI_STATUS.UNAVAILABLE:
        statusClass = 'unavailable';
        statusText = 'AI Unavailable';
        break;
      default:
        statusClass = 'error';
        statusText = 'AI Error';
    }

    return (
      <div className="status-indicator">
        <span className={`status-dot ${statusClass}`}></span>
        {statusText}
      </div>
    );
  };

  return renderStatusIndicator();
};

export default StatusIndicator;
