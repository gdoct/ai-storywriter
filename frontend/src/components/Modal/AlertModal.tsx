import React from 'react';
import Modal from './Modal';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  title?: string;
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose, message, title = 'Alert' }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="alert-modal">
      <div className="alert-message">{message}</div>
      <div className="alert-actions">
        <button
          className="btn btn-primary"
          onClick={onClose}
          data-testid="confirm-button"
          autoFocus
        >
          OK
        </button>
      </div>
    </Modal>
  );
};

export default AlertModal;
