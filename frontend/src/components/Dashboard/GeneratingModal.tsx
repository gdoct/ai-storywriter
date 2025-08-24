import React from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@drdata/ai-styles';

interface GeneratingModalProps {
  isOpen: boolean;
  currentIndex?: number;
  totalCount?: number;
  isRetrying?: boolean;
  retryCount?: number;
  onAbort?: () => void;
}

const GeneratingModal: React.FC<GeneratingModalProps> = ({ 
  isOpen, 
  currentIndex = 1, 
  totalCount = 1, 
  isRetrying = false,
  retryCount = 0,
  onAbort 
}) => {
  if (!isOpen) return null;

  // Calculate progress percentage
  const progressPercent = totalCount > 1 ? ((currentIndex - 1) / totalCount) * 100 : 0;
  
  // Determine status text
  const getStatusText = () => {
    if (totalCount === 1) {
      return isRetrying 
        ? `Received incorrect result, retrying...`
        : 'Creating a new scenario based on your selections...';
    }
    
    if (isRetrying) {
      return `Received incorrect result, retrying ${currentIndex}/${totalCount}`;
    }
    
    return `Generating ${currentIndex}/${totalCount}`;
  };

  const modalContent = (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'var(--color-surface-overlay)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 'var(--z-modal)',
    }}>
      <div style={{
        backgroundColor: 'var(--color-surface-elevated)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--spacing-3xl)',
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--color-border-secondary)',
        textAlign: 'center',
        maxWidth: '450px',
        width: '90%',
        position: 'relative',
      }}>
        <div data-testid="generating-modal-spinner" style={{
          width: '60px',
          height: '60px',
          border: '4px solid var(--color-border-secondary)',
          borderTop: '4px solid var(--color-primary-500)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto var(--spacing-lg) auto',
        }} />
        
        <h3 style={{
          margin: '0 0 var(--spacing-md) 0',
          color: 'var(--color-text-primary)',
          fontSize: 'var(--font-size-xl)',
          fontWeight: 'var(--font-weight-semibold)',
        }}>
          Generating Similar Scenario{totalCount > 1 ? 's' : ''}
        </h3>
        
        <p style={{
          margin: '0 0 var(--spacing-lg) 0',
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--font-size-md)',
          lineHeight: 'var(--line-height-normal)',
          minHeight: '20px',
        }}>
          {getStatusText()}
          <br />
          This may take a few moments.
        </p>

        {/* Progress bar for multiple scenarios */}
        {totalCount > 1 && (
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'var(--color-surface-tertiary)',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: 'var(--spacing-sm)',
            }}>
              <div style={{
                width: `${progressPercent}%`,
                height: '100%',
                backgroundColor: 'var(--color-primary-500)',
                borderRadius: '4px',
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        )}

        {/* Abort button */}
        {onAbort && (
          <div style={{ marginTop: 'var(--spacing-lg)' }}>
            <Button 
              variant="secondary" 
              onClick={onAbort}
              style={{ fontSize: 'var(--font-size-sm)' }}
            >
              Abort
            </Button>
          </div>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default GeneratingModal;