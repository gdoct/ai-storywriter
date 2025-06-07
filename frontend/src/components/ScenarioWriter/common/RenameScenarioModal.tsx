import React from 'react';
import ActionButton from '../../common/ActionButton';
import Modal from '../../common/Modal';

interface RenameScenarioModalProps {
  show: boolean;
  onClose: () => void;
  onRename: () => void;
  renameTitle: string;
  setRenameTitle: (title: string) => void;
  errorMessage: string;
}

const RenameScenarioModal: React.FC<RenameScenarioModalProps> = ({ show, onClose, onRename, renameTitle, setRenameTitle, errorMessage }) => (
  <Modal
    show={show}
    onClose={onClose}
    title="Rename Scenario"
    footer={
      <div className="form-buttons">
        <ActionButton 
          onClick={onClose} 
          label="Cancel" 
          variant="default" 
        />
        <ActionButton onClick={onRename} label="Rename" variant="primary" />
      </div>
    }
  >
    <div className="form-field">
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      <input
        type="text"
        value={renameTitle}
        onChange={(e) => setRenameTitle(e.target.value)}
        placeholder="Enter new title"
        autoFocus
        className="form-input"
      />
    </div>
  </Modal>
);

export default RenameScenarioModal;
