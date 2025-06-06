import React from 'react';
import ActionButton from '../common/ActionButton';
import Modal from '../common/Modal';

interface DeleteScenarioModalProps {
  show: boolean;
  onClose: () => void;
  onDelete: () => void;
}

const DeleteScenarioModal: React.FC<DeleteScenarioModalProps> = ({ show, onClose, onDelete }) => (
  <Modal
    show={show}
    onClose={onClose}
    title="Delete Scenario"
    footer={
      <div className="form-buttons">
        <ActionButton onClick={onClose} label="Cancel" variant="default" />
        <ActionButton onClick={onDelete} label="Delete" variant="danger" />
      </div>
    }
  >
    <p>Are you sure you want to delete this scenario? This action cannot be undone.</p>
  </Modal>
);

export default DeleteScenarioModal;
