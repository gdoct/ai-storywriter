import { ConfirmDialog } from '@drdata/docomo';
import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  message, 
  title = 'Confirm', 
  confirmText = 'Yes',
  cancelText = 'No',
  variant = 'default'
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <ConfirmDialog
      open={isOpen}
      onCancel={onClose}
      onConfirm={handleConfirm}
      title={title}
      message={message}
      confirmText={confirmText}
      cancelText={cancelText}
      variant={variant === 'danger' ? 'danger' : 'default'}
    />
  );
};

export default ConfirmModal;
