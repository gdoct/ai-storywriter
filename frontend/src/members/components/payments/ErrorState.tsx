import React from 'react';
import { PaymentError } from '../../pages/BuyCredits';
import './ErrorState.css';

interface ErrorStateProps {
  error: PaymentError;
  onRetry: () => void;
  onClose: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry, onClose }) => {
  const getErrorIcon = (errorCode: string) => {
    switch (errorCode) {
      case 'CARD_DECLINED':
        return '💳';
      case 'INSUFFICIENT_FUNDS':
        return '💰';
      case 'NETWORK_ERROR':
        return '🌐';
      case 'PAYMENT_FAILED':
      default:
        return '❌';
    }
  };

  const getErrorTitle = (errorCode: string) => {
    switch (errorCode) {
      case 'CARD_DECLINED':
        return 'Card Declined';
      case 'INSUFFICIENT_FUNDS':
        return 'Insufficient Funds';
      case 'NETWORK_ERROR':
        return 'Network Error';
      case 'PAYMENT_FAILED':
      default:
        return 'Payment Failed';
    }
  };

  return (
    <div className="error-state">
      <div className="error-icon">
        <div className="error-circle">
          <span className="error-symbol">{getErrorIcon(error.code)}</span>
        </div>
      </div>
      
      <h3>❌ {getErrorTitle(error.code)}</h3>
      
      <p className="error-message">
        {error.message}
      </p>
      
      <div className="error-details">
        <div className="error-code">
          Error Code: <span className="code">{error.code}</span>
        </div>
      </div>
      
      <div className="error-actions">
        {error.retryable && (
          <button 
            className="retry-btn primary-btn"
            onClick={onRetry}
          >
            Try Again
          </button>
        )}
        <button 
          className="cancel-btn secondary-btn"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ErrorState;
