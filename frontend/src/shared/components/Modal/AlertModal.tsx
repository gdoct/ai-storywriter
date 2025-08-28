import { ErrorDialog } from '@drdata/ai-styles';
import React from 'react';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  title?: string;
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose, message, title = 'Alert' }) => {
  return (
    <ErrorDialog
      open={isOpen}
      onConfirm={onClose}
      title={title}
      message={message}
    />
  );
};

export default AlertModal;
