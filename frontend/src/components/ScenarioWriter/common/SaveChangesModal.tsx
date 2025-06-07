import React from 'react';
import ActionButton from '../../common/ActionButton';
import Modal from '../../common/Modal';

interface SaveChangesModalProps {
  show: boolean;
  onClose: () => void;
  onDiscard: () => void;
  onSave: () => void;
}

const SaveChangesModal: React.FC<SaveChangesModalProps> = ({ show, onClose, onDiscard, onSave }) => (
  <Modal 
    show={show} 
    onClose={onClose} 
    title="Save Changes"
    footer={
      <div className="form-buttons">
        <ActionButton onClick={onClose} label="Cancel" variant="default" />
        <ActionButton onClick={onDiscard} label="Discard Changes" variant="default" />
        <ActionButton onClick={onSave} label="Save Changes" variant="primary" />
      </div>
    }
  >
    <p>You have unsaved changes in the current scenario. Would you like to save them before switching?</p>
  </Modal>
);

export default SaveChangesModal;
