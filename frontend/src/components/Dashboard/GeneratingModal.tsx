import React from 'react';
import { createPortal } from 'react-dom';

interface GeneratingModalProps {
  isOpen: boolean;
}

const GeneratingModal: React.FC<GeneratingModalProps> = ({ isOpen }) => {
  if (!isOpen) return null;

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
        maxWidth: '400px',
        width: '90%',
      }}>
        <div style={{
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
          Generating Similar Scenario
        </h3>
        
        <p style={{
          margin: 0,
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--font-size-md)',
          lineHeight: 'var(--line-height-normal)',
        }}>
          Creating a new scenario based on your selections...
          <br />
          This may take a few moments.
        </p>
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