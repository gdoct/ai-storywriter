import React from 'react';
import ActionButton from '../../common/ActionButton';
import Modal from '../../common/Modal';

interface UnsavedChangesModalProps {
  show: boolean;
  onClose: () => void;
  onContinue: () => void;
}

const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({ show, onClose, onContinue }) => (
  <Modal 
    show={show} 
    onClose={onClose} 
    title="Unsaved Changes"
    footer={
      <div className="form-buttons">
        <ActionButton onClick={onClose} label="Cancel" variant="default" />
        <ActionButton onClick={onContinue} label="Continue" variant="primary" />
      </div>
    }
  >
    <p>You have unsaved changes. Do you want to continue?</p>
  </Modal>
);

export default UnsavedChangesModal;
