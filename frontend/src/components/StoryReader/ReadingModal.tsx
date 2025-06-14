import React, { MouseEvent, ReactNode, useEffect, useRef } from 'react';
import './ReadingModal.css';

interface ReadingModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const ReadingModal: React.FC<ReadingModalProps> = ({ show, onClose, title, children }) => {
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (show) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [show, onClose]);

  // Handle clicking outside the modal content
  const handleOverlayClick = (e: MouseEvent) => {
    if (modalContentRef.current && !modalContentRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!show) return null;

  return (
    <div className="reading-modal-overlay" onClick={handleOverlayClick}>
      <div className="reading-modal-content" ref={modalContentRef}>
        <div className="reading-modal-header">
          <h2 className="reading-modal-title">{title}</h2>
          <button 
            className="reading-modal-close" 
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className="reading-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ReadingModal;
