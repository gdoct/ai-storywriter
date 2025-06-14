import React from 'react';
import ActionButton from '../../common/ActionButton';
import Modal from '../../common/Modal';

interface SaveAsModalProps {
  show: boolean;
  onClose: () => void;
  onSave: () => void;
  saveAsTitle: string;
  setSaveAsTitle: (title: string) => void;
  errorMessage: string;
}

const SaveAsModal: React.FC<SaveAsModalProps> = ({ show, onClose, onSave, saveAsTitle, setSaveAsTitle, errorMessage }) => (
  <Modal
    show={show}
    onClose={onClose}
    title="Save Scenario As"
    footer={
      <div className="form-buttons">
        <ActionButton 
          onClick={onClose} 
          label="Cancel" 
          variant="default" 
        />
        <ActionButton onClick={onSave} label="Save" variant="primary" />
      </div>
    }
  >
    <div className="form-field">
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      <input
        type="text"
        value={saveAsTitle}
        onChange={(e) => setSaveAsTitle(e.target.value)}
        placeholder="Enter new title"
        autoFocus
        className="form-input"
      />
    </div>
  </Modal>
);

export default SaveAsModal;
