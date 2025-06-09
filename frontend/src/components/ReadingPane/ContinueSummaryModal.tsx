import React from 'react';
import Modal from '../common/Modal';
import MarkdownViewer from './MarkDownViewer';

interface ContinueSummaryModalProps {
  show: boolean;
  summary: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ContinueSummaryModal: React.FC<ContinueSummaryModalProps> = ({ show, summary, onConfirm, onCancel }) => {
  return (
    <Modal
      show={show}
      onClose={onCancel}
      title="Summary of Previous Story"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onCancel} className="modal-cancel-btn">Cancel</button>
          <button onClick={onConfirm} className="modal-confirm-btn" autoFocus>Continue Story</button>
        </div>
      }
    >
      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        <MarkdownViewer content={summary} />
      </div>
      <p style={{ marginTop: 16 }}>Do you want to continue the story based on this summary?</p>
    </Modal>
  );
};

export default ContinueSummaryModal;
