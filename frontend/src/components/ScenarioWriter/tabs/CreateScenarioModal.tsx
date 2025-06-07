import React from 'react';
import ActionButton from '../../common/ActionButton';
import Modal from '../../common/Modal';

interface CreateScenarioModalProps {
  show: boolean;
  onClose: () => void;
  onCreate: () => void;
  newTitle: string;
  setNewTitle: (title: string) => void;
  errorMessage: string;
}

const CreateScenarioModal: React.FC<CreateScenarioModalProps> = ({ show, onClose, onCreate, newTitle, setNewTitle, errorMessage }) => (
  <Modal
    show={show}
    onClose={onClose}
    title="Create New Scenario"
    footer={
      <div className="form-buttons">
        <ActionButton 
          onClick={onClose} 
          label="Cancel" 
          variant="default" 
        />
        <ActionButton onClick={onCreate} label="Create" variant="primary" />
      </div>
    }
  >
    <div className="form-field">
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      <input
        type="text"
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
        placeholder="Enter scenario title"
        autoFocus
        className="form-input"
      />
    </div>
  </Modal>
);

export default CreateScenarioModal;
