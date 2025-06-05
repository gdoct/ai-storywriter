import React, { MouseEvent, ReactNode, useEffect, useRef } from 'react';
import './Modal.css';

interface ModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ show, onClose, title, children, footer }) => {
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside the modal content
  const handleOverlayClick = (e: MouseEvent) => {
    // Only close if clicking the overlay directly, not the modal content
    if (modalContentRef.current && !modalContentRef.current.contains(e.target as Node)) {
      onClose();
    }
  };
  
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [show]);

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" ref={modalContentRef}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
