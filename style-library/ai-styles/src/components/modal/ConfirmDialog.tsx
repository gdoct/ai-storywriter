import React from 'react';
import ReactDOM from 'react-dom';
import { useTheme } from '../../providers/ThemeProvider';
import './ModalDialog.css';

export interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Dialog variant - affects styling and button colors */
  variant?: 'default' | 'danger';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title = 'Confirm',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
}) => {
  const { resolvedTheme: theme } = useTheme();

  if (!open) return null;

  const dialogClasses = [
    'modal-dialog',
    `modal-dialog--${variant}`,
    `modal-dialog--${theme}`,
  ].join(' ');

  const confirmButtonClasses = [
    'modal-btn',
    `modal-btn-confirm--${variant}`,
    `modal-btn-confirm--${theme}`,
  ].join(' ');

  return ReactDOM.createPortal(
    <div className={`modal-overlay modal-overlay--${theme}`}>
      <div className={dialogClasses}>
        {title && <h2 className="modal-title">{title}</h2>}
        <div className="modal-message">{message}</div>
        <div className="modal-actions">
          <button className="modal-btn modal-btn-cancel" onClick={onCancel}>{cancelText}</button>
          <button className={confirmButtonClasses} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>,
    document.body
  );
};
