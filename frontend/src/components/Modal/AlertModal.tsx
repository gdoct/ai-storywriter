import React from 'react';
import { ErrorDialog } from '@drdata/docomo';

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
