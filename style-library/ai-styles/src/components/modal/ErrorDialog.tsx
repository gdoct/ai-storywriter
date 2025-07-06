import React from 'react';
import ReactDOM from 'react-dom';
import { useTheme } from '../../providers/ThemeProvider';
import './ModalDialog.css';

export interface ErrorDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  onConfirm: () => void;
}

export const ErrorDialog: React.FC<ErrorDialogProps> = ({
  open,
  title = 'Error',
  message,
  confirmText = 'OK',
  onConfirm,
}) => {
  const { resolvedTheme: theme } = useTheme();

  if (!open) return null;

  return ReactDOM.createPortal(
    <div className={`modal-overlay modal-overlay--${theme}`}>
      <div className={`modal-dialog modal-dialog--${theme}`}>
        {title && <h2 className="modal-title">{title}</h2>}
        <div className="modal-message">{message}</div>
        <div className="modal-actions">
          <button className="modal-btn modal-btn-confirm" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>,
    document.body
  );
};
